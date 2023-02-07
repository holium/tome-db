/* eslint-disable @typescript-eslint/no-misused-promises */
import {
    FeedlogEntry,
    FeedlogUpdate,
    InitStoreOptions,
    InviteLevel,
    Perm,
    StoreType,
    SubscribeUpdate,
    Value,
} from '../index'
import { LogStore, FeedStore, KeyValueStore, Tome } from './index'
import {
    agent,
    kvMark,
    feedMark,
    tomeMark,
    kvThread,
    feedThread,
} from './constants'

export abstract class DataStore extends Tome {
    protected storeSubscriptionID: number
    protected spaceSubscriptionID: number
    // if preload is set, loaded will be set to true once the initial subscription state has been received.
    // then we know we can use the cache.
    protected preload: boolean
    protected loaded: boolean
    protected ready: boolean // if false, we are switching spaces.
    protected onReadyChange: (ready: boolean) => void
    protected onLoadChange: (loaded: boolean) => void
    protected onWriteChange: (write: boolean) => void
    protected onAdminChange: (admin: boolean) => void
    protected onDataChange: (data: any) => void

    protected cache: Map<string, Value> // cache key-value pairs
    protected feedlog: FeedlogEntry[] // array of objects (feed entries)
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
        const { tomeShip, ourShip, type, isLog } = options
        if (tomeShip === ourShip) {
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
        await DataStore._getCurrentForeignPerms(options)
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
                onLoadChange,
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
            this.onLoadChange = onLoadChange
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
                this.setLoaded(false)
                this.subscribeAll()
            }
            if (this.inRealm) {
                this.watchCurrentSpace()
            }
            this.watchPerms()
            this.setReady(true)
        } else {
            // This should only be called by KeyValueStore.
            super()
        }
    }

    private async watchPerms(): Promise<void> {
        await this.api.subscribe({
            app: agent,
            path: this.permsPath(),
            err: () => {
                console.error(
                    `Tome-${this.type}: unable to watch perms for this bucket.`
                )
            },
            event: async (perms: Perm) => {
                if (perms.write !== 'unset') {
                    const write = perms.write === 'yes'
                    this.setWrite(write)
                }
                if (perms.admin !== 'unset') {
                    const admin = perms.admin === 'yes'
                    this.setAdmin(admin)
                }
            },
            quit: async () => await this.watchPerms(),
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
                            `Tome-${this.type}: spaces cannot be switched while using a locked Tome.`
                        )
                    }
                    await this._wipeAndChangeSpace(tomeShip, space)
                }
            },
            quit: async () => await this.watchCurrentSpace(),
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
            tomeShip === this.ourShip
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
        if (tomeShip !== this.ourShip) {
            await DataStore.checkExistsAndCanRead(options)
        }
        // that succeeded, whether ours or not initialize the bucket.
        await DataStore.initBucket(options)
        // if not us, we want Hoon side to start a subscription.
        if (tomeShip !== this.ourShip) {
            await DataStore.startWatchingForeignBucket(options)
        }

        this.tomeShip = tomeShip
        this.space = space
        this.wipeLocalValues()
        if (this.preload) {
            this.setLoaded(false)
            await this.subscribeAll()
        }

        if (this.isOurStore()) {
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
        try {
            const result = await api.thread({
                inputMark: 'json',
                outputMark: 'json',
                threadName: `${type}-poke-tunnel`,
                body: {
                    ship: tomeShip,
                    json: JSON.stringify(body),
                },
            })
            const success = result === 'success'
            if (!success) {
                throw new Error(
                    `Tome-${type}: the requested bucket does not exist, or you do not have permission to access it.`
                )
            }
        } catch (e) {
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

    // called by subclasses
    protected async getCurrentForeignPerms() {
        // do nothing if not actually foreign
        if (this.isOurStore()) {
            return
        }
        return await DataStore._getCurrentForeignPerms({
            api: this.api,
            tomeShip: this.tomeShip,
            space: this.space,
            app: this.app,
            bucket: this.bucket,
            type: this.type,
            isLog: this.isLog,
        })
    }

    private static async _getCurrentForeignPerms(
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
                    `Tome-${type}: Starting permissions watch failed.  Make sure the ship and Tome agent are both running.\nError: ${error}`
                )
            },
        })
    }

    // subscribe to all values in the store, and keep cache synced.
    protected async subscribeAll(): Promise<void> {
        this.storeSubscriptionID = await this.api.subscribe({
            app: agent,
            path: this.dataPath(),
            err: () => {
                throw new Error(
                    `Tome-${this.type}: the store being used has been removed, or your access has been revoked.`
                )
            },
            event: async (update: SubscribeUpdate) => {
                if (this.type === 'kv') {
                    await this._handleKvUpdates(update)
                } else {
                    await this._handleFeedUpdates(
                        update as FeedlogEntry[] | FeedlogUpdate
                    )
                }
                this.dataUpdateCallback()
                this.setLoaded(true)
            },
            quit: async () => await this.subscribeAll(),
        })
    }

    /**
     * Set new permission levels for a store after initialization.
     *
     * @param permissions the new permissions to set.
     */
    public async setPermissions(permissions: Perm): Promise<void> {
        if (!this.isOurStore()) {
            throw new Error(
                `Tome-${this.type}: You can only set permissions on your own ship's store.`
            )
        }
        const action = `perm-${this.type}`
        const mark = this.type === 'kv' ? kvMark : feedMark
        const body = {
            [action]: {
                ship: this.tomeShip,
                space: this.space,
                app: this.app,
                bucket: this.bucket,
                perm: permissions,
            },
        }
        if (this.type === 'feed') {
            // @ts-expect-error
            body[action].log = this.isLog
        }
        await this.api.poke({
            app: agent,
            mark,
            json: body,
            onError: (error) => {
                throw new Error(
                    `Tome-${this.type}: Updating permissions failed.\nError: ${error}`
                )
            },
        })
    }

    /**
     * Set permission level for a specific ship.  This takes precedence over bucket-level permissions.
     *
     * @param ship The ship to set permissions for.
     * @param level The permission level to set.
     */
    public async inviteShip(ship: string, level: InviteLevel): Promise<void> {
        if (!this.isOurStore()) {
            throw new Error(
                `Tome-${this.type}: You can only manage permissions on your own ship's store.`
            )
        }
        if (!ship.startsWith('~')) {
            ship = `~${ship}`
        }
        const action = `invite-${this.type}`
        const mark = this.type === 'kv' ? kvMark : feedMark
        const body = {
            [action]: {
                ship: this.tomeShip,
                space: this.space,
                app: this.app,
                bucket: this.bucket,
                guy: ship,
                level,
            },
        }
        if (this.type === 'feed') {
            // @ts-expect-error
            body[action].log = this.isLog
        }
        await this.api.poke({
            app: agent,
            mark,
            json: body,
            onError: (error) => {
                throw new Error(
                    `Tome-${this.type}: Setting ship permissions failed.\nError: ${error}`
                )
            },
        })
    }

    /**
     * Block a specific ship from accessing this store.
     *
     * @param ship The ship to block.
     */
    public async blockShip(ship: string): Promise<void> {
        await this.inviteShip(ship, 'block')
    }

    protected dataPath(key?: string): string {
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

    protected permsPath(): string {
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

    protected setLoaded(loaded: boolean): void {
        if (loaded !== this.loaded) {
            this.loaded = loaded
            if (this.onLoadChange) {
                this.onLoadChange(loaded)
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

    protected parseFeedlogEntry(entry: FeedlogEntry): FeedlogEntry {
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
    }

    protected async pokeOrTunnel({ json, onSuccess, onError }) {
        await this.waitForReady()
        let success = false
        if (this.isOurStore()) {
            let result: any // what onSuccess or onError returns
            await this.api.poke({
                app: agent,
                mark: this.type === 'kv' ? kvMark : feedMark,
                json,
                onSuccess: () => {
                    result = onSuccess()
                },
                onError: () => {
                    result = onError()
                },
            })
            return result
        } else {
            // Tunnel poke to Tome ship
            try {
                const result = await this.api.thread({
                    inputMark: 'json',
                    outputMark: 'json',
                    threadName: this.type === 'kv' ? kvThread : feedThread,
                    body: {
                        ship: this.tomeShip,
                        json: JSON.stringify(json),
                    },
                })
                success = result === 'success'
            } catch (e) {}
        }
        return success ? onSuccess() : onError()
    }

    private async _handleKvUpdates(update: object): Promise<void> {
        const entries: Array<[string, string]> = Object.entries(update)
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
    }

    private _handleFeedAll(update: FeedlogEntry[]): void {
        update.map((entry: FeedlogEntry) => {
            // save the IDs in time order so they are easier to find later
            this.order.push(entry.id)
            return this.parseFeedlogEntry(entry)
        })
        this.feedlog = update
    }

    private async _handleFeedUpdate(update: FeedlogUpdate): Promise<void> {
        await this.waitForLoaded()
        // %new, %edit, %delete, %clear, %set-link, %remove-link
        let index: number
        switch (update.type) {
            case 'new': {
                this.order.unshift(update.body.id)
                const ship = update.body.ship.slice(1)
                const entry = {
                    id: update.body.id,
                    createdAt: update.body.time,
                    updatedAt: update.body.time,
                    createdBy: ship,
                    updatedBy: ship,
                    content: JSON.parse(update.body.content),
                    links: {},
                }
                this.feedlog.unshift(entry)
                break
            }
            case 'edit':
                index = this.order.indexOf(update.body.id)
                if (index > -1) {
                    this.feedlog[index] = {
                        ...this.feedlog[index],
                        content: JSON.parse(update.body.content),
                        updatedAt: update.body.time,
                        updatedBy: update.body.ship.slice(1),
                    }
                }
                break
            case 'delete':
                index = this.order.indexOf(update.body.id)
                if (index > -1) {
                    this.feedlog.splice(index, 1)
                    this.order.splice(index, 1)
                }
                break
            case 'clear':
                this.wipeLocalValues()
                break
            case 'set-link':
                index = this.order.indexOf(update.body.id)
                if (index > -1) {
                    this.feedlog[index] = {
                        ...this.feedlog[index],
                        links: {
                            ...this.feedlog[index].links,
                            [update.body.ship.slice(1)]: JSON.parse(
                                update.body.value
                            ),
                        },
                    }
                }
                break
            case 'remove-link':
                index = this.order.indexOf(update.body.id)
                if (index > -1) {
                    this.feedlog[index] = {
                        ...this.feedlog[index],
                        // @ts-expect-error
                        links: (({ [update.body.ship.slice(1)]: _, ...o }) =>
                            o)(this.feedlog[index].links), // remove data.body.ship
                    }
                }
                break
            default:
                console.error('Tome-feed: unknown update type')
        }
    }

    private async _handleFeedUpdates(
        update: FeedlogEntry[] | FeedlogUpdate
    ): Promise<void> {
        if (update.constructor === Array) {
            this._handleFeedAll(update)
        } else {
            await this._handleFeedUpdate(update as FeedlogUpdate)
        }
    }
}
