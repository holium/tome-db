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
    private ready: boolean // if false, we are switching spaces.  TODO could we consolidate this and "loaded"?
    private onReadyChange: (ready: boolean) => void
    private onWriteChange: (write: boolean) => void
    private onAdminChange: (admin: boolean) => void

    private cache: Map<string, JSON>
    private bucket: string
    private write: boolean
    private admin: boolean

    // subscribe to all values in the store, and keep cache synced.
    private async subscribeAll() {
        this.storeSubscriptionID = await this.api.subscribe({
            app: agent,
            path: this.dataSubscribePath(),
            err: () => {
                throw new Error(
                    'Tome-KV: the key-value store being used has been removed, or your access has been revoked.'
                )
            },
            event: (data: JSON) => {
                const entries: [string, string][] = Object.entries(data)
                if (entries.length === 0) {
                    // received an empty object, clear the cache.
                    this.cache.clear()
                } else {
                    for (const [key, value] of entries) {
                        if (value === null) {
                            this.cache.delete(key)
                        } else {
                            this.cache.set(key, JSON.parse(value))
                        }
                    }
                }
                this.loaded = true
            },
            quit: this.subscribeAll,
        })
    }

    // this seems like pretty dirty update method, is there a better way?
    private async _wipeAndChangeSpace(tomeShip: string, space: string) {
        this.setReady(false)
        if (this.storeSubscriptionID) {
            await this.api.unsubscribe(this.storeSubscriptionID)
        }
        // changing the top level tome, so we reinitialize
        await Tome.initTomePoke(this.api, tomeShip, space, this.app)
        const perm =
            tomeShip === this.thisShip
                ? this.perm
                : ({ read: 'yes', write: 'unset', admin: 'unset' } as const)

        // if not ours, we need to make sure we have read access first.
        if (tomeShip !== this.thisShip) {
            await Store.checkExistsAndCanRead(
                this.api,
                tomeShip,
                space,
                this.app,
                this.bucket
            )
        }
        // that succeeded, whether ours or not initialize the bucket.
        await Store.initBucket(
            this.api,
            tomeShip,
            space,
            this.app,
            this.bucket,
            perm
        )
        // if not us, we want Hoon side to start a subscription.
        if (tomeShip !== this.thisShip) {
            await Store.startWatchingBucket(
                this.api,
                tomeShip,
                space,
                this.app,
                this.bucket
            )
        }

        this.tomeShip = tomeShip
        this.space = space
        this.cache = new Map<string, JSON>()
        if (this.preload) {
            this.loaded = false
            await this.subscribeAll()
        }

        if (this.tomeShip === this.thisShip) {
            this.write = true
            this.admin = true
        } else {
            await this.watchPerms()
        }
        this.setReady(true)
    }

    private async watchCurrentSpace() {
        this.currentSubscriptionID = await this.api.subscribe({
            app: 'spaces',
            path: '/current',
            err: () => {
                throw new Error(
                    'Tome-KV: unable to watch current space in spaces agent.  Is Realm installed and configured?'
                )
            },
            event: async (current: JSON) => {
                // @ts-ignore
                const spacePath = current.current.path.split('/')
                const tomeShip = spacePath[1].slice(1)
                const space = spacePath[2]
                if (tomeShip !== this.tomeShip || space !== this.space) {
                    if (this.locked) {
                        throw new Error(
                            'Tome-KV: the space has been switched for a locked Tome.'
                        )
                    }
                    await this._wipeAndChangeSpace(tomeShip, space)
                }
            },
            quit: this.watchCurrentSpace,
        })
    }

    private async watchPerms() {
        await this.api.subscribe({
            app: agent,
            path: this.permsSubscribePath(),
            err: () => {
                console.error('Tome-KV: unable to watch perms for this bucket.')
            },
            event: async (perms: Perm) => {
                const write = perms.write === 'yes' ? true : false
                const admin = perms.admin === 'yes' ? true : false
                this.setWrite(write)
                this.setAdmin(admin)
            },
            quit: this.watchPerms,
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
        onReadyChange?: (ready: boolean) => void,
        onWriteChange?: (write: boolean) => void,
        onAdminChange?: (admin: boolean) => void,
        write?: boolean,
        admin?: boolean
    ) {
        if (typeof api !== 'undefined') {
            super(api, tomeShip, thisShip, space, app, perm, locked)
            this.bucket = bucket
            this.write = write
            this.admin = admin
            this.cache = new Map<string, JSON>()
            this.preload = preload
            this.onReadyChange = onReadyChange
            if (preload) {
                this.loaded = false
                this.subscribeAll()
            }
            // TODO only do if %spaces exists.  Assume it does for now.
            this.watchCurrentSpace()
            this.watchPerms()
            this.setReady(true)
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
        await api.poke({
            app: agent,
            mark: tomeMark,
            json: {
                'init-kv': {
                    ship: ship,
                    space: space,
                    app: app,
                    bucket: bucket,
                    perm: perm,
                },
            },
            onError: (error) => {
                throw new Error(
                    `Tome-KV: Initializing key-value store on ship ${ship} failed.  Make sure the ship and Tome agent are both running.\nError: ${error}`
                )
            },
        })
    }

    private static async startWatchingBucket(
        api: Urbit,
        ship: string,
        space: string,
        app: string,
        bucket: string
    ) {
        await api.poke({
            app: agent,
            mark: storeMark,
            json: {
                'watch-kv': {
                    ship: ship,
                    space: space,
                    app: app,
                    bucket: bucket,
                },
            },
            onError: (error) => {
                throw new Error(
                    `Tome-KV: Initializing store watch failed.  Make sure the ship and Tome agent are both running.\nError: ${error}`
                )
            },
        })
    }

    private static async retrieveInitialPerms(
        api: Urbit,
        ship: string,
        space: string,
        app: string,
        bucket: string
    ) {
        await api.poke({
            app: agent,
            mark: storeMark,
            json: {
                'team-kv': {
                    ship: ship,
                    space: space,
                    app: app,
                    bucket: bucket,
                },
            },
            onError: (error) => {
                throw new Error(
                    `Tome-KV: Initializing store watch failed.  Make sure the ship and Tome agent are both running.\nError: ${error}`
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
                'Tome-KV: the requested Tome bucket does not exist, or you do not have permission to access the store.'
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
        locked?: boolean,
        onReadyChange?: (ready: boolean) => void,
        onWriteChange?: (write: boolean) => void,
        onAdminChange?: (admin: boolean) => void
    ) {
        const mars = typeof api !== 'undefined'
        if (mars) {
            if (tomeShip === thisShip) {
                await Store.initBucket(api, tomeShip, space, app, bucket, perm)
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
                    onReadyChange,
                    onWriteChange,
                    onAdminChange,
                    true,
                    true
                )
            }
            await Store.checkExistsAndCanRead(api, tomeShip, space, app, bucket)
            await Store.initBucket(api, tomeShip, space, app, bucket, {
                read: 'yes',
                write: 'unset',
                admin: 'unset',
            })
            await Store.startWatchingBucket(api, tomeShip, space, app, bucket)
            await Store.retrieveInitialPerms(api, tomeShip, space, app, bucket)
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
                onReadyChange,
                onWriteChange,
                onAdminChange
            )
        }
        return new Store()
    }

    /**
     * Set a key-value pair in the store.
     * @param key The key to set.
     * @param value The JSON value to associate with the key.
     * @returns true if successful, false if not.
     */
    public async set(key: string, value: JSON): Promise<boolean> {
        if (!key) {
            console.error('missing key parameter')
            return false
        }
        if (
            value.constructor != Array &&
            value.constructor != String &&
            value.constructor != Object
        ) {
            console.error('value must be valid JSON')
            return false
        }
        const valueStr = JSON.stringify(value)

        if (!this.mars) {
            try {
                localStorage.setItem(localKvPrefix + key, valueStr)
                return true
            } catch (error) {
                console.error(error)
                return false
            }
        } else {
            await this.waitForReady()
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
                            value: valueStr,
                        },
                    },
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
                                    value: valueStr,
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
            await this.waitForReady()
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
            await this.waitForReady()
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
     * @returns The JSON value associated with the key, or undefined if the key does not exist.
     */
    public async get(
        key: string,
        allowCachedValue: boolean = true
    ): Promise<JSON> {
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
            return JSON.parse(value)
        } else {
            await this.waitForReady()
            // first check cache if allowed
            if (allowCachedValue) {
                const value = this.cache.get(key)
                if (value) {
                    return value
                }
            }
            if (this.preload) {
                await this.waitForLoaded()
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
    private async _getValueFromUrbit(key: string): Promise<JSON> {
        return await this.api
            .subscribe({
                app: agent,
                path: this.dataSubscribePath(key),
                err: () => {
                    throw new Error(
                        'Tome-KV: the key-value store being used has been removed, or your access has been revoked.'
                    )
                },
                event: (value: string) => {
                    if (value !== null) {
                        this.cache.set(key, JSON.parse(value))
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
    public async all(useCache: boolean = false): Promise<Map<string, JSON>> {
        if (!this.mars) {
            const map = new Map<string, JSON>()
            const len = localStorage.length
            const startIndex = localKvPrefix.length
            for (let i = 0; i < len; i++) {
                const key = localStorage.key(i)
                if (key.startsWith(localKvPrefix)) {
                    const keyName = key.substring(startIndex) // get key without prefix
                    map.set(keyName, JSON.parse(localStorage.getItem(key)))
                }
            }
            return map
        } else {
            await this.waitForReady()
            if (this.preload) {
                await this.waitForLoaded()
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
    private async _getAllFromUrbit(): Promise<Map<string, JSON>> {
        return await this.api
            .subscribe({
                app: agent,
                path: this.dataSubscribePath(),
                err: () => {
                    throw new Error(
                        'Tome-KV: the key-value store being used has been removed, or your access has been revoked.'
                    )
                },
                event: (data: JSON) => {
                    const entries: [string, string][] = Object.entries(data)
                    const newCache = new Map<string, JSON>()
                    for (const [key, value] of entries) {
                        newCache.set(key, JSON.parse(value))
                    }
                    this.cache = newCache
                },
                quit: () => this._getAllFromUrbit(),
            })
            .then(async (id) => {
                await this.api.unsubscribe(id)
                return this.cache
            })
    }

    private dataSubscribePath(key?: string): string {
        let path = `/kv/~${this.tomeShip}/${this.space}/${this.app}/${this.bucket}/data/`
        if (key) {
            path += `key/${key}`
        } else {
            path += 'all'
        }
        return path
    }

    private permsSubscribePath(): string {
        return `/kv/~${this.tomeShip}/${this.space}/${this.app}/${this.bucket}/perm`
    }

    /**
     * Whether the current ship has permission to create new entries in this Tome, or overwrite it's own entries.
     */
    public isWrite(): boolean {
        return this.write
    }

    /**
     * Whether the current ship has permission to overwrite or delete any entry in this Tome.
     */
    public isAdmin(): boolean {
        return this.admin
    }

    /**
     * Whether the current store is ready (loaded).  Useful for showing a loading screen?
     */
    public isReady(): boolean {
        return this.ready
    }

    private setReady(ready: boolean) {
        if (ready !== this.ready) {
            this.ready = ready
            if (this.onReadyChange) {
                this.onReadyChange(ready)
            }
        }
    }

    private setWrite(write: boolean) {
        if (write !== this.write) {
            this.write = write
            if (this.onWriteChange) {
                this.onWriteChange(write)
            }
        }
    }

    private setAdmin(admin: boolean) {
        if (admin !== this.admin) {
            this.admin = admin
            if (this.onAdminChange) {
                this.onAdminChange(admin)
            }
        }
    }

    private waitForReady(): Promise<void> {
        return new Promise((resolve) => {
            while (!this.ready) {
                setTimeout(() => {}, 50)
            }
            resolve()
        })
    }

    private waitForLoaded(): Promise<void> {
        return new Promise((resolve) => {
            while (!this.loaded) {
                setTimeout(() => {}, 50)
            }
            resolve()
        })
    }
}
