/* eslint-disable @typescript-eslint/no-misused-promises */
import {
    FeedlogEntry,
    InitStoreOptions,
    Perm,
    StoreType,
    SubscribeUpdate,
    Value,
} from '../index'
import { LogStore, FeedStore, KeyValueStore, Tome } from './index'
import { agent, kvMark, feedMark, tomeMark } from './constants'

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
    protected onDataChange: (data: any) => void

    protected cache: Map<string, Value> // cache key-value pairs
    protected feedlog: object[] // array of objects (feed entries)
    protected order: string[] // ids of feed entries in order

    protected bucket: string
    protected write: boolean
    protected admin: boolean

    protected type: StoreType
    protected isLog: boolean

    // assumes MARZ
    public static async initDataStore(
        options: InitStoreOptions
    ): Promise<DataStore> {
        const { tomeShip, thisShip, type, isLog } = options
        if (tomeShip === thisShip) {
            await DataStore.initBucket(options)
            const newOptions = { ...options, write: true, admin: true }
            switch (type) {
                case 'kv':
                    return new KeyValueStore(newOptions)
                case 'feed':
                    if (isLog) {
                        return new LogStore(options)
                    } else {
                        return new FeedStore(options)
                    }
            }
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
                onDataChange,
                type,
                isLog,
            } = options
            this.bucket = bucket
            this.write = write
            this.admin = admin
            this.cache = new Map<string, Value>()
            this.feedlog = []
            this.order = []
            this.preload = preload
            this.onReadyChange = onReadyChange
            this.onWriteChange = onWriteChange
            this.onAdminChange = onAdminChange
            this.onDataChange = onDataChange
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
            // this.watchPerms()
            this.setReady(true)
        } else {
            // This should only be called by KeyValueStore.
            super()
        }
    }

    private async watchPerms(): Promise<void> {
        await this.api.subscribe({
            app: agent,
            path: this.permsSubscribePath(),
            err: () => {
                console.error(
                    `Tome-${this.type}: unable to watch perms for this bucket.`
                )
            },
            event: async (perms: Perm) => {
                const write = perms.write === 'yes'
                const admin = perms.admin === 'yes'
                this.setWrite(write)
                this.setAdmin(admin)
            },
            quit: this.watchPerms,
        })
    }

    private async watchCurrentSpace(): Promise<void> {
        this.spaceSubscriptionID = await this.api.subscribe({
            app: 'spaces',
            path: '/current',
            err: () => {
                throw new Error(
                    `Tome-${this.type}: unable to watch current space in spaces agent.  Is Realm installed and configured?`
                )
            },
            event: async (current: JSON) => {
                // @ts-expect-error
                const spacePath = current.current.path.split('/')
                const tomeShip = spacePath[1]
                const space = spacePath[2]
                if (tomeShip !== this.tomeShip || space !== this.space) {
                    if (this.locked) {
                        throw new Error(
                            `Tome-${this.type}: the space has been switched for a locked Tome.`
                        )
                    }
                    await this._wipeAndChangeSpace(tomeShip, space)
                }
            },
            quit: this.watchCurrentSpace,
        })
    }

    // this seems like pretty dirty update method, is there a better way?
    private async _wipeAndChangeSpace(
        tomeShip: string,
        space: string
    ): Promise<void> {
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
            perm,
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
        this.wipeLocalValues()
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

    protected static async checkExistsAndCanRead(
        options: InitStoreOptions
    ): Promise<void> {
        const { api, tomeShip, space, app, bucket, type, isLog } = options
        const action = `verify-${type}`
        const body = {
            [action]: {
                ship: tomeShip,
                space,
                app,
                bucket,
            },
        }
        if (type === 'feed') {
            // @ts-expect-error
            body[action].log = isLog
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

    protected static async initBucket(
        options: InitStoreOptions
    ): Promise<void> {
        const { api, tomeShip, space, app, bucket, type, isLog, perm } = options
        const action = `init-${type}`
        const body = {
            [action]: {
                ship: tomeShip,
                space,
                app,
                bucket,
                perm,
            },
        }
        if (type === 'feed') {
            // @ts-expect-error
            body[action].log = isLog
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
    ): Promise<void> {
        const { api, tomeShip, space, app, bucket, type, isLog } = options
        const action = `watch-${type}`
        const mark = type === 'kv' ? kvMark : feedMark
        const body = {
            [action]: {
                ship: tomeShip,
                space,
                app,
                bucket,
            },
        }
        if (type === 'feed') {
            // @ts-expect-error
            body[action].log = isLog
        }
        await api.poke({
            app: agent,
            mark,
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
    ): Promise<void> {
        const { api, tomeShip, space, app, bucket, type, isLog } = options
        const action = `team-${type}`
        const mark = type === 'kv' ? kvMark : feedMark
        const body = {
            [action]: {
                ship: tomeShip,
                space,
                app,
                bucket,
            },
        }
        if (type === 'feed') {
            // @ts-expect-error
            body[action].log = isLog
        }
        await api.poke({
            app: agent,
            mark,
            json: body,
            onError: (error) => {
                throw new Error(
                    `Tome-${type}: Initializing permissions watch failed.  Make sure the ship and Tome agent are both running.\nError: ${error}`
                )
            },
        })
    }

    // subscribe to all values in the store, and keep cache synced.
    protected async subscribeAll(): Promise<void> {
        this.storeSubscriptionID = await this.api.subscribe({
            app: agent,
            path: this.dataSubscribePath(),
            err: () => {
                throw new Error(
                    `Tome-${this.type}: the store being used has been removed, or your access has been revoked.`
                )
            },
            event: async (data: SubscribeUpdate) => {
                if (this.type === 'kv') {
                    const entries: Array<[string, string]> =
                        Object.entries(data)
                    if (entries.length === 0) {
                        // received an empty object, clear the cache.
                        this.cache.clear()
                    } else {
                        for (let [key, value] of entries) {
                            if (value === null) {
                                this.cache.delete(key)
                            } else {
                                // TODO foreign strings are getting stripped of their quotes? This is a workaround.
                                if (value.constructor !== String) {
                                    value = JSON.parse(value)
                                }
                                this.cache.set(key, value)
                            }
                        }
                    }
                } else {
                    // Feed
                    if (data.constructor === Array) {
                        // update is %all
                        data.map((entry: FeedlogEntry) => {
                            // save the IDs in time order so they are easier to find later
                            this.order.push(entry.id)
                            // ship has ~, so we need to remove it
                            entry.createdBy = entry.createdBy.slice(1)
                            entry.updatedBy = entry.updatedBy.slice(1)
                            entry.content = JSON.parse(entry.content)
                            entry.links = Object.fromEntries(
                                Object.entries(entry.links).map(([k, v]) => [
                                    k.slice(1),
                                    JSON.parse(v),
                                ])
                            )
                            return entry
                        })
                        this.feedlog = data as object[]
                    } else {
                        // %all update overwrites the array, so we need to wait here
                        // TODO can this block forever? might depend on update order
                        await this.waitForLoaded()
                        // %new, %edit, %delete, %clear, %set-link, %remove-link
                        let index: number
                        switch (data.type) {
                            case 'new': {
                                this.order.unshift(data.body.id)
                                const ship = data.body.ship.slice(1)
                                const entry = {
                                    id: data.body.id,
                                    createdAt: data.body.time,
                                    updatedAt: data.body.time,
                                    createdBy: ship,
                                    updatedBy: ship,
                                    content: data.body.content,
                                    links: {},
                                }
                                this.feedlog.unshift(entry)
                                break
                            }
                            case 'edit':
                                index = this.order.indexOf(data.body.id)
                                if (index > -1) {
                                    this.feedlog[index] = {
                                        ...this.feedlog[index],
                                        content: JSON.parse(data.body.content),
                                        updatedAt: data.body.time,
                                        updatedBy: data.body.ship.slice(1),
                                    }
                                }
                                break
                            case 'delete':
                                index = this.order.indexOf(data.body.id)
                                if (index > -1) {
                                    this.feedlog.splice(index, 1)
                                    this.order.splice(index, 1)
                                }
                                break
                            case 'clear':
                                this.wipeLocalValues()
                                break
                            case 'set-link':
                                index = this.order.indexOf(data.body.id)
                                if (index > -1) {
                                    this.feedlog[index] = {
                                        ...this.feedlog[index],
                                        links: {
                                            ...this.feedlog[index].links,
                                            [data.body.ship.slice(1)]:
                                                JSON.parse(data.body.value),
                                        },
                                    }
                                }
                                break
                            case 'remove-link':
                                index = this.order.indexOf(data.body.id)
                                if (index > -1) {
                                    this.feedlog[index] = {
                                        ...this.feedlog[index],
                                        links: (({
                                            [data.body.ship.slice(1)]: _,
                                            ...o
                                        }) => o)(this.feedlog[index].links), // remove data.body.ship
                                    }
                                }
                                break
                            default:
                                console.error('Tome-feed: unknown update type')
                        }
                    }
                }
                this.loaded = true
                this.dataUpdateCallback()
            },
            quit: this.subscribeAll,
        })
    }

    protected dataSubscribePath(key?: string): string {
        let path = `/${this.type}/${this.tomeShip}/${this.space}/${this.app}/${this.bucket}/`
        if (this.type === 'feed') {
            path += this.isLog ? 'log/' : 'feed/'
        }
        path += 'data/'
        if (key) {
            path += `key/${key}`
        } else {
            path += 'all'
        }
        return path
    }

    protected permsSubscribePath(): string {
        let path = `/${this.type}/${this.tomeShip}/${this.space}/${this.app}/${this.bucket}/`
        if (this.type === 'feed') {
            path += this.isLog ? 'log/' : 'feed/'
        }
        path += 'perm'
        return path
    }

    protected setReady(ready: boolean): void {
        if (ready !== this.ready) {
            this.ready = ready
            if (this.onReadyChange) {
                this.onReadyChange(ready)
            }
        }
    }

    protected setWrite(write: boolean): void {
        if (write !== this.write) {
            this.write = write
            if (this.onWriteChange) {
                this.onWriteChange(write)
            }
        }
    }

    protected setAdmin(admin: boolean): void {
        if (admin !== this.admin) {
            this.admin = admin
            if (this.onAdminChange) {
                this.onAdminChange(admin)
            }
        }
    }

    protected async waitForReady(): Promise<void> {
        return await new Promise((resolve) => {
            while (!this.ready) {
                setTimeout(() => {}, 50)
            }
            resolve()
        })
    }

    protected async waitForLoaded(): Promise<void> {
        return await new Promise((resolve) => {
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

    protected dataUpdateCallback(): void {
        switch (this.type) {
            case 'kv':
                if (this.onDataChange) {
                    this.onDataChange(this.cache)
                }
                break
            case 'feed':
                if (this.onDataChange) {
                    this.onDataChange(this.feedlog)
                }
                break
        }
    }

    private wipeLocalValues(): void {
        this.cache.clear()
        this.order.length = 0
        this.feedlog.length = 0
        this.dataUpdateCallback()
    }
}
