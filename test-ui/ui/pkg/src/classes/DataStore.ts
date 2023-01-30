import { InitStoreOptions, Perm, StoreType, Value } from '../index'
import { FeedStore, KeyValueStore, LogStore, Tome } from './index'
import { agent, storeMark, tomeMark } from './constants'

export abstract class DataStore extends Tome {
    protected storeSubscriptionID: number
    protected spaceSubscriptionID: number
    // if preload is set, loaded will be set to true once the initial subscription state has been received.
    // then we know we can use the cache.
    protected preload: boolean
    protected loaded: boolean
    protected ready: boolean // if false, we are switching spaces.  TODO could we consolidate this and "loaded"?
    protected onReadyChange: (ready: boolean) => void
    protected onWriteChange: (write: boolean) => void // TODO consider consolidating into "onPermsChange".  What about read?
    protected onAdminChange: (admin: boolean) => void

    protected cache: Map<string, Value>
    protected bucket: string
    protected write: boolean
    protected admin: boolean

    protected type: StoreType
    protected isLog: boolean

    // assumes MARZ
    public static async initDataStore(options: InitStoreOptions) {
        const { tomeShip, thisShip, type, isLog } = options
        if (tomeShip === thisShip) {
            await DataStore.initBucket(options)
            return new KeyValueStore({
                ...options,
                write: true,
                admin: true,
            })
        }
        await DataStore.checkExistsAndCanRead(options)
        const foreignPerm = {
            read: 'yes',
            write: 'unset',
            admin: 'unset',
        } as const
        await DataStore.initBucket({ ...options, perm: foreignPerm })
        await DataStore.startWatchingForeignBucket(options)
        await DataStore.startWatchingForeignPerms(options)
        switch (type) {
            case 'kv':
                return new KeyValueStore(options)
            case 'feed':
                if (isLog) {
                    return new LogStore(options)
                } else {
                    return new FeedStore(options)
                }
        }
    }

    constructor(options?: InitStoreOptions) {
        if (typeof options !== 'undefined') {
            super(options)
            const {
                bucket,
                write,
                admin,
                preload,
                onReadyChange,
                onWriteChange,
                onAdminChange,
                type,
                isLog,
            } = options
            this.bucket = bucket
            this.write = write
            this.admin = admin
            this.cache = new Map<string, string | JSON>()
            this.preload = preload
            this.onReadyChange = onReadyChange
            this.onWriteChange = onWriteChange
            this.onAdminChange = onAdminChange
            this.type = type
            if (type === 'feed') {
                this.isLog = isLog
            } else {
                this.isLog = false
            }
            if (preload) {
                this.loaded = false
                this.subscribeAll()
            }
            // TODO only do if %spaces exists.  Assume it does for now.
            this.watchCurrentSpace()
            // TODO turn this back on
            //this.watchPerms()
            this.setReady(true)
        } else {
            // This should only be called by KeyValueStore.
            super()
        }
    }

    private async watchPerms() {
        await this.api.subscribe({
            app: agent,
            path: this.permsSubscribePath(),
            err: () => {
                console.error(
                    `Tome-${this.type}: unable to watch perms for this bucket.`
                )
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

    private async watchCurrentSpace() {
        this.spaceSubscriptionID = await this.api.subscribe({
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

        const options = {
            api: this.api,
            tomeShip,
            space,
            app: this.app,
            bucket: this.bucket,
            type: this.type,
            isLog: this.isLog,
            perm: perm,
        }
        // if not ours, we need to make sure we have read access first.
        if (tomeShip !== this.thisShip) {
            await DataStore.checkExistsAndCanRead(options)
        }
        // that succeeded, whether ours or not initialize the bucket.
        await DataStore.initBucket(options)
        // if not us, we want Hoon side to start a subscription.
        if (tomeShip !== this.thisShip) {
            await DataStore.startWatchingForeignBucket(options)
        }

        this.tomeShip = tomeShip
        this.space = space
        this.cache = new Map<string, string | JSON>()
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

    protected static async checkExistsAndCanRead(options: InitStoreOptions) {
        const { api, tomeShip, space, app, bucket, type, isLog } = options
        const action = `verify-${type}`
        const body = {
            [action]: {
                ship: tomeShip,
                space: space,
                app: app,
                bucket: bucket,
            },
        }
        if (type === 'feed') {
            // @ts-ignore
            body[action]['log'] = isLog
        }
        // Tunnel poke to Tome ship
        const result = await api
            .thread({
                inputMark: 'json',
                outputMark: 'json',
                threadName: `${type}-poke-tunnel`,
                body: {
                    ship: tomeShip,
                    json: JSON.stringify(body),
                },
            })
            .catch(() => {
                console.error(`Tome-${type}: Failed to verify ${type}.`)
                return undefined
            })
        const success = result === 'success'
        if (!success) {
            throw new Error(
                `Tome-${type}: the requested bucket does not exist, or you do not have permission to access it.`
            )
        }
    }

    protected static async initBucket(options: InitStoreOptions) {
        const { api, tomeShip, space, app, bucket, type, isLog, perm } = options
        const action = `init-${type}`
        const body = {
            [action]: {
                ship: tomeShip,
                space: space,
                app: app,
                bucket: bucket,
                perm: perm,
            },
        }
        if (type === 'feed') {
            // @ts-ignore
            body[action]['log'] = isLog
        }
        await api.poke({
            app: agent,
            mark: tomeMark,
            json: body,
            onError: (error) => {
                throw new Error(
                    `Tome-${type}: Initializing store on ship ${tomeShip} failed.  Make sure the ship and Tome agent are both running.\nError: ${error}`
                )
            },
        })
    }

    protected static async startWatchingForeignBucket(
        options: InitStoreOptions
    ) {
        const { api, tomeShip, space, app, bucket, type, isLog } = options
        const action = `watch-${type}`
        const body = {
            [action]: {
                ship: tomeShip,
                space: space,
                app: app,
                bucket: bucket,
            },
        }
        if (type === 'feed') {
            // @ts-ignore
            body[action]['log'] = isLog
        }
        await api.poke({
            app: agent,
            mark: storeMark,
            json: body,
            onError: (error) => {
                throw new Error(
                    `Tome-${type}: Starting foreign store watch failed.  Make sure the ship and Tome agent are both running.\nError: ${error}`
                )
            },
        })
    }

    protected static async startWatchingForeignPerms(
        options: InitStoreOptions
    ) {
        const { api, tomeShip, space, app, bucket, type, isLog } = options
        const action = `team-${type}`
        const body = {
            [action]: {
                ship: tomeShip,
                space: space,
                app: app,
                bucket: bucket,
            },
        }
        if (type === 'feed') {
            // @ts-ignore
            body[action]['log'] = isLog
        }
        await api.poke({
            app: agent,
            mark: storeMark,
            json: body,
            onError: (error) => {
                throw new Error(
                    `Tome-${type}: Initializing permissions watch failed.  Make sure the ship and Tome agent are both running.\nError: ${error}`
                )
            },
        })
    }

    // subscribe to all values in the store, and keep cache synced.
    protected async subscribeAll() {
        this.storeSubscriptionID = await this.api.subscribe({
            app: agent,
            path: this.dataSubscribePath(),
            err: () => {
                throw new Error(
                    `Tome-${this.type}: the store being used has been removed, or your access has been revoked.`
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

    protected async retrieveOne(key: string, allowCachedValue: boolean = true) {
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

    // TODO - does this have race conditions?
    private async _getValueFromUrbit(key: string): Promise<Value> {
        return await this.api
            .subscribe({
                app: agent,
                path: this.dataSubscribePath(key),
                err: () => {
                    throw new Error(
                        `Tome-${this.type}: the store being used has been removed, or your access has been revoked.`
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

    protected async retrieveAll(useCache: boolean = false) {
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

    // TODO - does this have race conditions?
    private async _getAllFromUrbit(): Promise<Map<string, Value>> {
        return await this.api
            .subscribe({
                app: agent,
                path: this.dataSubscribePath(),
                err: () => {
                    throw new Error(
                        `Tome-${this.type}: the store being used has been removed, or your access has been revoked.`
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

    protected dataSubscribePath(key?: string): string {
        let path = `/${this.type}/~${this.tomeShip}/${this.space}/${this.app}/${this.bucket}/data/`
        if (key) {
            path += `key/${key}`
        } else {
            path += 'all'
        }
        return path
    }

    protected permsSubscribePath(): string {
        return `/${this.type}/~${this.tomeShip}/${this.space}/${this.app}/${this.bucket}/perm`
    }

    protected setReady(ready: boolean) {
        if (ready !== this.ready) {
            this.ready = ready
            if (this.onReadyChange) {
                this.onReadyChange(ready)
            }
        }
    }

    protected setWrite(write: boolean) {
        if (write !== this.write) {
            this.write = write
            if (this.onWriteChange) {
                this.onWriteChange(write)
            }
        }
    }

    protected setAdmin(admin: boolean) {
        if (admin !== this.admin) {
            this.admin = admin
            if (this.onAdminChange) {
                this.onAdminChange(admin)
            }
        }
    }

    protected waitForReady(): Promise<void> {
        return new Promise((resolve) => {
            while (!this.ready) {
                setTimeout(() => {}, 50)
            }
            resolve()
        })
    }

    protected waitForLoaded(): Promise<void> {
        return new Promise((resolve) => {
            while (!this.loaded) {
                setTimeout(() => {}, 50)
            }
            resolve()
        })
    }

    protected canStore(value: any): boolean {
        if (
            value.constructor === Array ||
            value.constructor === Object ||
            value.constructor === String ||
            value.constructor === Number ||
            value.constructor === Boolean
        ) {
            return true
        }
        return false
    }
}
