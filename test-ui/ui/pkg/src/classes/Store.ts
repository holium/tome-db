import Urbit from '@urbit/http-api'
import { Perm, Tome } from '../index'
import { agent, storeMark, tomeMark } from './constants'

export class Store extends Tome {
    private storeSubscriptionID: number
    // if preload is set, loaded will be set to true once the initial subscription state has been received.
    // then we know we can use the cache.
    private loaded: boolean
    private cache: Map<string, string>
    private bucket: string
    private writer: boolean
    private admin: boolean

    // subscribe to all values in the store, and keep cache synced.
    private async subscribeAll() {
        this.storeSubscriptionID = await this.api.subscribe({
            app: agent,
            path: this.subscribePath(),
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
                    if (entries.length === 0) {
                        // received an empty object, clear the cache.
                        this.cache.clear()
                    }
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
        bucket?: string,
        perm?: Perm,
        preload?: boolean,
        writer?: boolean,
        admin?: boolean
    ) {
        if (typeof api !== 'undefined') {
            super(api, tomeShip, thisShip, space, app, perm)
            this.bucket = bucket
            this.writer = writer
            this.admin = admin
            this.cache = new Map()
            if (preload) {
                this.loaded = false
                this.subscribeAll()
            }
        } else {
            super()
        }
    }

    private static async initStoreBucketPoke(
        api: Urbit,
        ship: string,
        space: string,
        app: string,
        bucket: string,
        perm: Perm
    ) {
        // do I have perms for this? should check somewhere.
        await api.poke({
            app: agent,
            mark: tomeMark,
            json: {
                'init-kv': {
                    space: space,
                    app: app,
                    bucket: bucket,
                    perm: perm,
                },
            },
            ship: ship,
            onError: (error) => {
                // check and update current perms if they're wrong.
                throw new Error(
                    `Tome: Initializing key-value store on ship ${ship} failed.  Make sure the ship and Tome agent are both running.\nError: ${error}`
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
        bucket?: string,
        perm?: Perm,
        preload?: boolean
    ) {
        const mars = typeof api !== 'undefined'
        if (mars) {
            // poke to init store
            if (tomeShip === thisShip) {
                await Store.initStoreBucketPoke(
                    api,
                    tomeShip,
                    space,
                    app,
                    bucket,
                    perm
                )
                return new Store(
                    api,
                    tomeShip,
                    thisShip,
                    space,
                    app,
                    bucket,
                    perm,
                    preload,
                    true,
                    true
                )
            }
            //
            return new Store(
                api,
                tomeShip,
                thisShip,
                space,
                app,
                bucket,
                perm,
                preload
            )
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
                localStorage.setItem(this.subscribePath(key), value)
                return true
            } catch (error) {
                console.error(error)
                return false
            }
        } else {
            // maybe set in the cache, return, and poke / retry as necesssary?
            let success = false
            await this.api.poke({
                app: agent,
                mark: storeMark,
                json: {
                    'set-value': {
                        space: this.space,
                        app: this.app,
                        bucket: this.bucket,
                        key: key,
                        value: value,
                    },
                },
                ship: this.tomeShip,
                onSuccess: () => {
                    this.cache.set(key, value)
                    success = true
                },
                onError: () => {
                    console.error('Failed to set key-value pair in the Store.')
                },
            })
            return success
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
            localStorage.removeItem(this.subscribePath(key))
            return true
        } else {
            let success = false
            await this.api.poke({
                app: agent,
                mark: storeMark,
                json: {
                    'remove-value': {
                        space: this.space,
                        app: this.app,
                        bucket: this.bucket,
                        key: key,
                    },
                },
                ship: this.tomeShip,
                onSuccess: () => {
                    this.cache.delete(key)
                    success = true
                },
                onError: (error) => {
                    console.error(error)
                },
            })
            return success
        }
    }

    /**
     * Discard all values in the store.
     * @returns True on success, false on failure.
     */
    public async clear(): Promise<boolean> {
        if (!this.mars) {
            // TODO - if we're only wiping a bucket, this might be the wrong method.
            localStorage.clear()
            return true
        } else {
            let success = false
            await this.api.poke({
                app: agent,
                mark: storeMark,
                json: {
                    'clear-kv': {
                        space: this.space,
                        app: this.app,
                        bucket: this.bucket,
                    },
                },
                ship: this.tomeShip,
                onSuccess: () => {
                    this.cache.clear()
                    success = true
                },
                onError: () => {
                    console.error('Failed to clear Store')
                },
            })
            return success
        }
    }

    /**
     * Retrieve the value associated with a specific key in the store.
     * @param key  The key to retrieve.
     * @param allowCachedValue  Whether we can check for cached values first.
     * If false, we will always check Urbit for the latest value. Default is true.
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
            const value = localStorage.getItem(this.subscribePath(key))
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
                return await this._getValueFromUrbit(key)
            }
        }
    }

    // TODO - does this have race conditions?
    private async _getValueFromUrbit(key: string): Promise<string> {
        return await this.api
            .subscribe({
                app: agent,
                path: this.subscribePath(key),
                err: () => {
                    throw new Error(
                        'Tome: the key-value store being used has been removed, or your access has been revoked.'
                    )
                },
                event: (value: string) => {
                    if (value !== null) {
                        this.cache.set(key, value)
                    } else {
                        this.cache.delete(key)
                    }
                },
                quit: () => this._getValueFromUrbit(key),
            })
            .then(async (id) => {
                await this.api.unsubscribe(id)
                return this.cache.get(key)
            })
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
            const startIndex = this.subscribePath().length + 1
            for (let i = 0; i < len; i++) {
                const key = localStorage.key(i)
                if (key.startsWith(this.subscribePath() + '/')) {
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
                return await this._getAllFromUrbit()
            }
        }
    }

    // TODO - does this have race conditions?
    private async _getAllFromUrbit(): Promise<Map<string, string>> {
        return await this.api
            .subscribe({
                app: agent,
                path: this.subscribePath(),
                err: () => {
                    throw new Error(
                        'Tome: the key-value store being used has been removed, or your access has been revoked.'
                    )
                },
                event: (data: JSON) => {
                    this.cache = new Map(Object.entries(data))
                },
                quit: () => this._getAllFromUrbit(),
            })
            .then(async (id) => {
                await this.api.unsubscribe(id)
                return this.cache
            })
    }

    // TODO: localStorage could probably use a simpler path than this.
    private subscribePath(key?: string): string {
        let path = `/kv/${this.space}/${this.app}/${this.bucket}/data/`
        if (key) {
            path += `key/${key}`
        } else {
            path += 'all'
        }
        return path
    }

    /**
     * Whether the current ship has permission to create new entries in this Tome, or overwrite it's own entries.
     */
    public isWriter(): boolean {
        return this.writer
    }

    /**
     * Whether the current ship has permission to overwrite or delete any entry in this Tome.
     */
    public isAdmin(): boolean {
        return this.admin
    }
}
