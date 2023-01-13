import Urbit from '@urbit/http-api'
import { Tome } from '../index'
import { agent, storeMark, tomeMark } from './constants'

export class Store extends Tome {
    private storeSubscriptionID: number
    // if preload is set, loaded will be set to true once the initial subscription state has been received.
    // then we know we can use the cache.
    private loaded: boolean
    private cache: Map<string, string>

    // subscribe to all values in the store, and keep cache synced.
    private async subscribeAll() {
        this.storeSubscriptionID = await this.api.subscribe({
            app: agent,
            path: `/store/${this.space}/${this.app}`,
            err: () => {
                throw new Error(
                    'Tome: the key-value store being used has been removed, or your access has been revoked.'
                )
            },
            event: (data: JSON) => {
                if (!this.loaded) {
                    this.cache = new Map(Object.entries(data))
                    this.loaded = true
                } else {
                    const entries = Object.entries(data)
                    for (const [key, value] of entries) {
                        if (value === null) {
                            this.cache.delete(key)
                        } else {
                            this.cache.set(key, value)
                        }
                    }
                }
            },
            quit: this.subscribeAll,
        })
    }

    private constructor(
        api?: Urbit,
        tomeShip?: string,
        thisShip?: string,
        space?: string,
        app?: string,
        preload?: boolean
    ) {
        if (typeof api !== 'undefined') {
            super(api, tomeShip, thisShip, space, app, false)
            if (preload) {
                this.loaded = false
                this.subscribeAll()
            }
        } else {
            super()
        }
    }

    private static async initStorePoke(
        api: Urbit,
        ship: string,
        space: string,
        app: string
    ) {
        await api.poke({
            app: agent,
            mark: tomeMark,
            json: {
                'init-store': {
                    space: space,
                    app: app,
                },
            },
            ship: ship,
            onError: (error) => {
                throw new Error(
                    `Tome: Initializing key-value store on ship ${ship} failed: ${error}.  Make sure the ship and Tome agent are both running.`
                )
            },
        })
    }

    public static async initStore(
        api?: Urbit,
        tomeShip?: string,
        thisShip?: string,
        space?: string,
        app?: string,
        preload?: boolean
    ) {
        const mars = typeof api !== 'undefined'
        if (mars) {
            // poke to init store
            if (tomeShip === thisShip) {
                await Store.initStorePoke(api, tomeShip, space, app)
            }
            return new Store(api, tomeShip, thisShip, space, app, preload)
        }
        return new Store()
    }

    /**
     * Set a key-value pair in the store.
     * @param key The key to set.
     * @param value The string value to associate with the key.
     * @returns true if successful, false if not.
     */
    public async set(key: string, value: string): Promise<boolean> {
        if (!key) {
            console.error('missing key parameter')
            return false
        }
        if (typeof value !== 'string') {
            console.error('value must be a string')
            return false
        }

        if (!this.mars) {
            try {
                localStorage.setItem(`${this.space}/${this.app}/${key}`, value)
            } catch (error) {
                console.error(error)
                return false
            }
            return true
        } else {
            // maybe set in the cache, return, and poke / retry as necesssary?
            await this.api.poke({
                app: agent,
                mark: storeMark,
                json: {
                    'set-store': {
                        space: this.space,
                        app: this.app,
                        key: key,
                        val: value,
                    },
                },
                ship: this.tomeShip,
                onSuccess: () => {
                    this.cache.set(key, value)
                    return true
                },
                onError: () => {
                    console.error('Failed to set key-value pair in the Store.')
                    return false
                },
            })
        }
    }
    /**
     * Remove a specific key-value pair from the store.
     * @param key The key to remove.
     * @returns True if an element in the Store existed and has been removed, or false if the element does not exist.
     */
    public async remove(key: string): Promise<boolean> {
        if (!key) {
            console.error('missing key parameter')
            return
        }

        if (!this.mars) {
            localStorage.removeItem(`${this.space}/${this.app}/${key}`)
            return true
        } else {
            await this.api.poke({
                app: agent,
                mark: storeMark,
                json: {
                    'remove-store': {
                        space: this.space,
                        app: this.app,
                        key: key,
                    },
                },
                ship: this.tomeShip,
                onSuccess: () => {
                    this.cache.delete(key)
                    return true
                },
                onError: (error) => {
                    console.error(error)
                    return false
                },
            })
        }
    }

    /**
     * Discard all values in the store.
     * @returns True on success, false on failure.
     */
    public async clear(): Promise<boolean> {
        if (!this.mars) {
            localStorage.clear()
            return true
        } else {
            await this.api.poke({
                app: agent,
                mark: storeMark,
                json: {
                    'clear-store': {
                        space: this.space,
                        app: this.app,
                    },
                },
                ship: this.tomeShip,
                onSuccess: () => {
                    this.cache.clear()
                    return true
                },
                onError: () => {
                    console.error('Failed to clear Store')
                    return false
                },
            })
        }
    }

    /**
     * Retrieve the value associated with a specific key in the store.
     * @param key  The key to retrieve.
     * @param allowCachedValue  Whether we can check for cached values first.
     * If false, we will always check Urbit for the latest value.
     * @returns The string value associated with the key, or undefined if the key does not exist.
     */
    public async get(
        key: string,
        allowCachedValue: boolean = true
    ): Promise<string> {
        if (!key) {
            console.error('missing key parameter')
            return undefined
        }

        if (!this.mars) {
            const value = localStorage.getItem(
                `${this.space}/${this.app}/${key}`
            )
            if (value === null) {
                console.error(`key ${key} not found`)
                return undefined
            }
            return value
        } else {
            // first check cache if allowed
            if (allowCachedValue) {
                const value = this.cache.get(key)
                if (value) {
                    return value
                }
            }
            if (this.storeSubscriptionID) {
                while (!this.loaded) {
                    await new Promise((resolve) => setTimeout(resolve, 100))
                }
                const value = this.cache.get(key)
                if (value === undefined) {
                    console.error(`key ${key} not found`)
                }
                return value
            } else {
                await this.api
                    .subscribeOnce(
                        agent,
                        `/store/${this.space}/${this.app}/${key}`
                    )
                    .then((value: string) => {
                        this.cache.set(key, value)
                        return value
                    })
                    .catch(() => {
                        console.error(`key ${key} not found`)
                        return undefined
                    })
            }
        }
    }

    /**
     * Get all key-value pairs in the store.
     * @param useCache return the cache instead of querying Urbit.  Only relevant if preload was set to false.
     * @returns A map of all key-value pairs in the store.
     */
    public async all(useCache: boolean = false): Promise<Map<string, string>> {
        if (!this.mars) {
            const map: Map<string, string> = new Map()
            const len = localStorage.length
            const startIndex = `${this.space}/${this.app}/`.length
            for (let i = 0; i < len; i++) {
                const key = localStorage.key(i)
                if (key.startsWith(`${this.space}/${this.app}/`)) {
                    const keyName = key.substring(startIndex) // get key without prefix
                    map.set(keyName, localStorage.getItem(key))
                }
            }
            return map
        } else {
            if (this.storeSubscriptionID) {
                while (!this.loaded) {
                    await new Promise((resolve) => setTimeout(resolve, 100))
                }
                return this.cache
            } else {
                if (useCache) {
                    return this.cache
                }
                await this.api
                    .subscribeOnce(agent, `/store/${this.space}/${this.app}`)
                    .then((data: JSON) => {
                        this.cache = new Map(Object.entries(data))
                        return this.cache
                    })
                    .catch(() => {
                        console.error(
                            `Store ${this.space}/${this.app} not found`
                        )
                        return new Map()
                    })
            }
        }
    }

    public canCreate() {
        throw new Error(
            'Cannot check permissions on subclasses of Tome. Use the base class instead.'
        )
    }

    public canOverwrite() {
        throw new Error(
            'Cannot check permissions on subclasses of Tome. Use the base class instead.'
        )
    }
}
