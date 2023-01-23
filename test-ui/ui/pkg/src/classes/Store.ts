import Urbit from '@urbit/http-api'
import { Perm, Tome } from '../index'
import { agent, storeMark, tomeMark, localKvPrefix } from './constants'

export class Store extends Tome {
    private storeSubscriptionID: number
    private currentSubscriptionID: number
    // if preload is set, loaded will be set to true once the initial subscription state has been received.
    // then we know we can use the cache.
    private preload: boolean
    private loaded: boolean
    private active: boolean // if false, we are switching spaces

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

    // this seems like pretty dirty update method, is there a better way?
    private async _wipeAndChangeSpace(tomeShip: string, space: string) {
        if (this.storeSubscriptionID) {
            await this.api.unsubscribe(this.storeSubscriptionID)
        }
        this.tomeShip = tomeShip
        this.space = space
        this.cache = new Map()
        if (this.preload) {
            this.loaded = false
            await this.subscribeAll()
        }

        if (this.tomeShip === this.thisShip) {
            await Store.initBucket(
                this.api,
                this.tomeShip,
                this.space,
                this.app,
                this.bucket,
                this.perm
            )
            this.writer = true
            this.admin = true
        } else {
            // check perms
        }
        this.active = true
    }

    private async watchCurrentSpace() {
        this.currentSubscriptionID = await this.api.subscribe({
            app: 'spaces',
            path: '/current',
            err: () => {
                // Is this the right error?
                throw new Error(
                    'Tome: the key-value store being used has been removed, or your access has been revoked.'
                )
            },
            event: async (current: JSON) => {
                const spacePath = current.current.path.split('/')
                const tomeShip = spacePath[1].slice(1)
                const space = spacePath[2]
                if (tomeShip !== this.tomeShip || space !== this.space) {
                    if (this.locked) {
                        throw new Error(
                            'Tome: the space has been switched for a locked Tome.'
                        )
                    }
                    this.active = false
                    await this._wipeAndChangeSpace(tomeShip, space)
                }
            },
            quit: this.watchCurrentSpace,
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
        locked?: boolean,
        writer?: boolean,
        admin?: boolean
    ) {
        if (typeof api !== 'undefined') {
            super(api, tomeShip, thisShip, space, app, perm, locked)
            this.bucket = bucket
            this.writer = writer
            this.admin = admin
            this.cache = new Map()
            this.preload = preload
            if (preload) {
                this.loaded = false
                this.subscribeAll()
            }
            this.watchCurrentSpace()
            this.active = true
        } else {
            super()
        }
    }

    private static async initBucket(
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

    private static async startWatchingBucket(
        api: Urbit,
        thisShip: string,
        tomeShip: string,
        space: string,
        app: string,
        bucket: string
    ) {
        // do I have perms for this? should check somewhere.
        await api.poke({
            app: agent,
            mark: tomeMark,
            json: {
                'watch-kv': {
                    ship: tomeShip,
                    space: space,
                    app: app,
                    bucket: bucket,
                },
            },
            ship: thisShip,
            onError: (error) => {
                // check and update current perms if they're wrong.
                throw new Error(
                    `Tome: Initializing store watch failed.  Make sure the ship and Tome agent are both running.\nError: ${error}`
                )
            },
        })
    }

    private static async checkExistsAndCanRead(
        api: Urbit,
        ship: string,
        space: string,
        app: string,
        bucket: string
    ) {
        // Tunnel poke to Tome ship
        const result = await api
            .thread({
                inputMark: 'json',
                outputMark: 'json',
                threadName: 'poke-tunnel',
                body: {
                    ship: ship,
                    json: JSON.stringify({
                        'verify-kv': {
                            ship: ship,
                            space: space,
                            app: app,
                            bucket: bucket,
                        },
                    }),
                },
            })
            .catch((e) => {
                console.error('Failed to verify Store.')
                return undefined
            })
        const success = result === 'success'
        if (!success) {
            throw new Error(
                'Tome: the requested Tome bucket does not exist, or you do not have permission to access the store.'
            )
        }
    }

    public static async initStore(
        api?: Urbit,
        tomeShip?: string,
        thisShip?: string,
        space?: string,
        app?: string,
        bucket?: string,
        perm?: Perm,
        preload?: boolean,
        locked?: boolean
    ) {
        const mars = typeof api !== 'undefined'
        if (mars) {
            // poke to init store
            if (tomeShip === thisShip) {
                await Store.initBucket(
                    api,
                    thisShip,
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
                    locked,
                    true,
                    true
                )
            }
            await Store.checkExistsAndCanRead(api, tomeShip, space, app, bucket)
            await Store.startWatchingBucket(api, thisShip, tomeShip, space, app, bucket)
            return new Store(
                api,
                tomeShip,
                thisShip,
                space,
                app,
                bucket,
                perm,
                preload,
                locked
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
                localStorage.setItem(localKvPrefix + key, value)
                return true
            } catch (error) {
                console.error(error)
                return false
            }
        } else {
            await this.waitForActive()
            // maybe set in the cache, return, and poke / retry as necesssary?
            let success = false
            if (this.tomeShip === this.thisShip) {
                await this.api.poke({
                    app: agent,
                    mark: storeMark,
                    json: {
                        'set-value': {
                            ship: this.tomeShip,
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
                        console.error(
                            'Failed to set key-value pair in the Store.'
                        )
                    },
                })
            } else {
                // Tunnel poke to Tome ship
                const result = await this.api
                    .thread({
                        inputMark: 'json',
                        outputMark: 'json',
                        threadName: 'poke-tunnel',
                        body: {
                            ship: this.tomeShip,
                            json: JSON.stringify({
                                'set-value': {
                                    ship: this.tomeShip,
                                    space: this.space,
                                    app: this.app,
                                    bucket: this.bucket,
                                    key: key,
                                    value: value,
                                },
                            }),
                        },
                    })
                    .catch((e) => {
                        console.error(
                            'Failed to add key-value pair to the Store.'
                        )
                        return undefined
                    })
                success = result === 'success'
                if (success) {
                    this.cache.set(key, value)
                }
            }
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
            localStorage.removeItem(localKvPrefix + key)
            return true
        } else {
            await this.waitForActive()
            let success = false
            if (this.tomeShip === this.thisShip) {
                await this.api.poke({
                    app: agent,
                    mark: storeMark,
                    json: {
                        'remove-value': {
                            ship: this.tomeShip,
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
            } else {
                // Tunnel poke to Tome ship
                const result = await this.api
                    .thread({
                        inputMark: 'json',
                        outputMark: 'json',
                        threadName: 'poke-tunnel',
                        body: {
                            ship: this.tomeShip,
                            json: JSON.stringify({
                                'remove-value': {
                                    ship: this.tomeShip,
                                    space: this.space,
                                    app: this.app,
                                    bucket: this.bucket,
                                    key: key,
                                },
                            }),
                        },
                    })
                    .catch((e) => {
                        console.error(
                            'Failed to remove key-value pair from the Store.'
                        )
                        return undefined
                    })
                success = result === 'success'
                if (success) {
                    this.cache.delete(key)
                }
            }
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
            await this.waitForActive()
            let success = false
            if (this.tomeShip === this.thisShip) {
                await this.api.poke({
                    app: agent,
                    mark: storeMark,
                    json: {
                        'clear-kv': {
                            ship: this.tomeShip,
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
            } else {
                // Tunnel poke to Tome ship
                const result = await this.api
                    .thread({
                        inputMark: 'json',
                        outputMark: 'json',
                        threadName: 'poke-tunnel',
                        body: {
                            ship: this.tomeShip,
                            json: JSON.stringify({
                                'clear-kv': {
                                    ship: this.tomeShip,
                                    space: this.space,
                                    app: this.app,
                                    bucket: this.bucket,
                                },
                            }),
                        },
                    })
                    .catch((e) => {
                        console.error('Failed to clear Store.')
                        return undefined
                    })
                success = result === 'success'
                if (success) {
                    this.cache.clear()
                }
            }
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
            const value = localStorage.getItem(localKvPrefix + key)
            if (value === null) {
                console.error(`key ${key} not found`)
                return undefined
            }
            return value
        } else {
            await this.waitForActive()
            // first check cache if allowed
            if (allowCachedValue) {
                const value = this.cache.get(key)
                if (value) {
                    return value
                }
            }
            if (this.preload) {
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
            const startIndex = localKvPrefix.length
            for (let i = 0; i < len; i++) {
                const key = localStorage.key(i)
                if (key.startsWith(localKvPrefix)) {
                    const keyName = key.substring(startIndex) // get key without prefix
                    map.set(keyName, localStorage.getItem(key))
                }
            }
            return map
        } else {
            await this.waitForActive()
            if (this.preload) {
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
        let path = `/kv/~${this.tomeShip}/${this.space}/${this.app}/${this.bucket}/data/`
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

    private waitForActive(): Promise<void> {
        return new Promise((resolve) => {
            while (!this.active) {
                setTimeout(() => {}, 50)
            }
            resolve()
        })
    }
}
