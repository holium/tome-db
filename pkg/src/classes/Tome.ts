import Urbit from '@holium/urbit-http-api'
import {
    InviteLevel,
    StoreType,
    Value,
    Content,
    SubscribeUpdate,
    FeedlogUpdate,
    FeedlogEntry,
    Perm,
    StoreOptions,
    TomeOptions,
    InitStoreOptions,
} from '../types'
import { tomeMark, kvMark, feedMark, kvThread, feedThread } from './constants'
import { v4 as uuid, validate } from 'uuid'

export class Tome {
    protected api: Urbit
    protected mars: boolean

    protected ourShip: string
    protected tomeShip: string
    protected space: string
    protected spaceForPath: string // space name as woad (encoded)
    protected app: string
    protected agent: string
    protected perm: Perm
    protected locked: boolean // if true, Tome is locked to the initial ship and space.
    protected inRealm: boolean

    protected static async initTomePoke(
        api: Urbit,
        ship: string,
        space: string,
        app: string,
        agent: string
    ) {
        await api.poke({
            app: agent,
            mark: tomeMark,
            json: {
                'init-tome': {
                    ship,
                    space,
                    app,
                },
            },
            onError: (error) => {
                throw new Error(
                    `Tome: Initializing Tome on ship ${ship} failed.  Make sure the ship and Tome agent are both running.\nError: ${error}`
                )
            },
        })
    }

    // maybe use a different (sub) type here?
    protected constructor(options?: InitStoreOptions) {
        if (typeof options.api !== 'undefined') {
            this.mars = true
            const {
                api,
                tomeShip,
                ourShip,
                space,
                spaceForPath,
                app,
                agent,
                perm,
                locked,
                inRealm,
            } = options
            this.api = api
            this.tomeShip = tomeShip
            this.ourShip = ourShip
            this.space = space
            this.spaceForPath = spaceForPath
            this.app = app
            this.agent = agent
            this.perm = perm
            this.locked = locked
            this.inRealm = inRealm
        } else {
            const { app, tomeShip, ourShip } = options ?? {}
            this.mars = false
            this.app = app
            this.tomeShip = tomeShip
            this.ourShip = ourShip
        }
    }

    /**
     * @param api The optional Urbit connection to be used for requests.
     * @param app An optional app name to store under. Defaults to `'all'`.
     * @param options Optional ship, space, agent name, and permissions for initializing a Tome.
     * @returns A new Tome instance.
     */
    static async init(
        api?: Urbit,
        app?: string,
        options: TomeOptions = {}
    ): Promise<Tome> {
        const mars = typeof api !== 'undefined'
        const appName = app ?? 'all'
        if (mars) {
            let locked = false
            const inRealm = options.realm ?? false
            let tomeShip = options.ship ?? api.ship
            let space = options.space ?? 'our'
            const agent = options.agent ?? 'tome'
            let spaceForPath = space

            if (inRealm) {
                if (options.ship && options.space) {
                    locked = true
                } else if (!options.ship && !options.space) {
                    try {
                        const current = await api.scry({
                            app: 'spaces',
                            path: '/current',
                        })
                        space = current.current.space

                        const path = current.current.path.split('/')
                        tomeShip = path[1]
                        spaceForPath = path[2]
                    } catch (e) {
                        throw new Error(
                            'Tome: no current space found. Make sure Realm is installed / configured, ' +
                                'or pass `realm: false` to `Tome.init`.'
                        )
                    }
                } else {
                    throw new Error(
                        'Tome: `ship` and `space` must neither or both be specified when using Realm.'
                    )
                }
            } else {
                if (spaceForPath !== 'our') {
                    throw new Error(
                        "Tome: only the 'our' space is currently supported when not using Realm. " +
                            'If this is needed, please open an issue.'
                    )
                }
            }

            if (!tomeShip.startsWith('~')) {
                tomeShip = `~${tomeShip}`
            }
            // save api.ship so we know who we are.
            const ourShip = `~${api.ship}`
            const perm = options.permissions
                ? options.permissions
                : ({ read: 'our', write: 'our', admin: 'our' } as const)
            await Tome.initTomePoke(api, tomeShip, space, app, agent)
            return new Tome({
                api,
                tomeShip,
                ourShip,
                space,
                spaceForPath,
                app: appName,
                agent,
                perm,
                locked,
                inRealm,
            })
        }
        return new Tome({ app: appName, tomeShip: 'zod', ourShip: 'zod' })
    }

    private async _initStore(
        options: StoreOptions,
        type: StoreType,
        isLog: boolean
    ) {
        let permissions = options.permissions ? options.permissions : this.perm
        if (this.app === 'all' && this.isOurStore()) {
            console.warn(
                `Tome-${type}: Permissions on 'all' are ignored. Setting permissions levels to 'our' instead...`
            )
            permissions = {
                read: 'our',
                write: 'our',
                admin: 'our',
            } as const
        }
        return await DataStore.initDataStore({
            type,
            api: this.api,
            tomeShip: this.tomeShip,
            ourShip: this.ourShip,
            space: this.space,
            spaceForPath: this.spaceForPath,
            app: this.app,
            agent: this.agent,
            perm: permissions,
            locked: this.locked,
            bucket: options.bucket ?? 'def',
            preload: options.preload ?? true,
            onReadyChange: options.onReadyChange,
            onLoadChange: options.onLoadChange,
            onWriteChange: options.onWriteChange,
            onAdminChange: options.onAdminChange,
            onDataChange: options.onDataChange,
            isLog,
            inRealm: this.inRealm,
        })
    }

    /**
     * Initialize or connect to a key-value store.
     *
     * @param options  Optional bucket, permissions, preload flag, and callbacks for the store. `permisssions`
     * defaults to the Tome's permissions, `bucket` to `'def'`, and `preload` to `true`.
     * @returns A `KeyValueStore`.
     */
    public async keyvalue(options: StoreOptions = {}): Promise<KeyValueStore> {
        if (this.mars) {
            return (await this._initStore(
                options,
                'kv',
                false
            )) as KeyValueStore
        }
        return new KeyValueStore({
            app: this.app,
            bucket: options.bucket ?? 'def',
            preload: options.preload ?? true,
            onDataChange: options.onDataChange,
            onLoadChange: options.onLoadChange,
            type: 'kv',
        })
    }

    /**
     * Initialize or connect to a feed store.
     *
     * @param options  Optional bucket, permissions, preload flag, and callbacks for the feed. `permisssions`
     * defaults to the Tome's permissions, `bucket` to `'def'`, and `preload` to `true`.
     * @returns A `FeedStore`.
     */
    public async feed(options: StoreOptions = {}): Promise<FeedStore> {
        if (this.mars) {
            return (await this._initStore(options, 'feed', false)) as FeedStore
        }
        return new FeedStore({
            app: this.app,
            bucket: options.bucket ?? 'def',
            preload: options.preload ?? true,
            onDataChange: options.onDataChange,
            onLoadChange: options.onLoadChange,
            isLog: false,
            type: 'feed',
            ourShip: 'zod',
        })
    }

    /**
     * Initialize or connect to a log store.
     *
     * @param options  Optional bucket, permissions, preload flag, and callbacks for the log. `permisssions`
     * defaults to the Tome's permissions, `bucket` to `'def'`, and `preload` to `true`.
     * @returns A `LogStore`.
     */
    public async log(options: StoreOptions = {}): Promise<LogStore> {
        if (this.mars) {
            return (await this._initStore(options, 'feed', true)) as LogStore
        }
        return new LogStore({
            app: this.app,
            bucket: options.bucket ?? 'def',
            preload: options.preload ?? true,
            onDataChange: options.onDataChange,
            onLoadChange: options.onLoadChange,
            isLog: true,
            type: 'feed',
            ourShip: 'zod',
        })
    }

    public isOurStore(): boolean {
        return this.tomeShip === this.ourShip
    }
}

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
        } = options ?? {}
        this.bucket = bucket
        this.preload = preload
        this.type = type
        this.write = write
        this.admin = admin
        this.onDataChange = onDataChange
        this.onLoadChange = onLoadChange
        this.onReadyChange = onReadyChange
        this.onWriteChange = onWriteChange
        this.onAdminChange = onAdminChange
        this.cache = new Map<string, Value>()
        this.feedlog = []
        this.order = []
        if (preload) {
            this.setLoaded(false)
        }
        if (type === 'feed') {
            this.isLog = isLog
        } else {
            this.isLog = false
        }
        if (this.mars) {
            if (preload) {
                this.subscribeAll()
            }
            if (this.inRealm) {
                this.watchCurrentSpace()
            }
            this.watchPerms()
            this.setReady(true)
        } else {
            if (preload) {
                this.getAllLocalValues()
            }
        }
    }

    private async watchPerms(): Promise<void> {
        await this.api.subscribe({
            app: this.agent,
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
            event: async (current: {
                current: { path: string; space: string }
            }) => {
                const space = current.current.space
                const path = current.current.path.split('/')
                const tomeShip = path[1]
                const spaceForPath = path[2]
                if (tomeShip !== this.tomeShip || space !== this.space) {
                    if (this.locked) {
                        throw new Error(
                            `Tome-${this.type}: spaces cannot be switched while using a locked Tome.`
                        )
                    }
                    await this._wipeAndChangeSpace(
                        tomeShip,
                        space,
                        spaceForPath
                    )
                }
            },
            quit: async () => await this.watchCurrentSpace(),
        })
    }

    // this seems like pretty dirty update method, is there a better way?
    private async _wipeAndChangeSpace(
        tomeShip: string,
        space: string,
        spaceForPath: string
    ): Promise<void> {
        this.setReady(false)
        if (this.storeSubscriptionID) {
            await this.api.unsubscribe(this.storeSubscriptionID)
        }
        // changing the top level tome, so we reinitialize
        await Tome.initTomePoke(this.api, tomeShip, space, this.app, this.agent)
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
        this.spaceForPath = spaceForPath
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
        const { api, tomeShip, space, app, agent, bucket, type, isLog } =
            options
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
                desk: agent,
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
        const { api, tomeShip, space, app, agent, bucket, type, isLog, perm } =
            options
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
        const { api, tomeShip, space, app, agent, bucket, type, isLog } =
            options
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
        const { api, tomeShip, space, app, agent, bucket, type, isLog } =
            options
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
            app: this.agent,
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

    // TODO duplicate logic in KV ALL method
    protected getAllLocalValues(): void {
        if (this.type === 'kv') {
            const map = new Map<string, Value>()
            const len = localStorage.length
            const startIndex = this.localDataPrefix().length
            for (let i = 0; i < len; i++) {
                const key = localStorage.key(i)
                if (key.startsWith(this.localDataPrefix())) {
                    const keyName = key.substring(startIndex) // get key without prefix
                    map.set(keyName, JSON.parse(localStorage.getItem(key)))
                }
            }
            this.cache = map
            this.dataUpdateCallback()
            this.setLoaded(true)
        } else if (this.type === 'feed') {
            const feedlog = localStorage.getItem(this.localDataPrefix())
            if (feedlog !== null) {
                this.feedlog = JSON.parse(feedlog)
                this.feedlog.map((entry: FeedlogEntry) => {
                    this.order.push(entry.id)
                    return entry
                })
                this.dataUpdateCallback()
            }
            this.setLoaded(true)
        }
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
            app: this.agent,
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
            app: this.agent,
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
        let path = `/${this.type}/${this.tomeShip}/${this.spaceForPath}/${this.app}/${this.bucket}/`
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

    protected localDataPrefix(key?: string): string {
        let type: string = this.type
        if (this.isLog) {
            type = 'log'
        }
        let path = `/tome-db/${type}/${this.app}/${this.bucket}/`
        if (key) {
            path += key
        }
        return path
    }

    protected permsPath(): string {
        let path = `/${this.type}/${this.tomeShip}/${this.spaceForPath}/${this.app}/${this.bucket}/`
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

    // called when switching spaces
    protected wipeLocalValues(): void {
        this.cache.clear()
        this.order.length = 0
        this.feedlog.length = 0
        this.dataUpdateCallback()
    }

    protected parseFeedlogEntry(entry: FeedlogEntry): FeedlogEntry {
        entry.createdBy = entry.createdBy.slice(1)
        entry.updatedBy = entry.updatedBy.slice(1)
        //  @ts-ignore
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
                app: this.agent,
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
                    desk: this.agent,
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
                    // @ts-ignore
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
                        // @ts-ignore
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
                        // @ts-ignore
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

export abstract class FeedlogStore extends DataStore {
    name: 'feed' | 'log'

    constructor(options: InitStoreOptions) {
        super(options)
        options.isLog ? (this.name = 'log') : (this.name = 'feed')
    }

    private async _postOrEdit(
        content: Content,
        id?: string
    ): Promise<string | undefined> {
        const action = typeof id === 'undefined' ? 'new-post' : 'edit-post'
        if (action === 'new-post') {
            id = uuid()
        } else {
            if (!validate(id)) {
                console.error('Invalid ID.')
                return undefined
            }
        }
        if (!this.canStore(content)) {
            console.error('content is an invalid type.')
            return undefined
        }
        const contentStr = JSON.stringify(content)
        const json = {
            [action]: {
                ship: this.tomeShip,
                space: this.space,
                app: this.app,
                bucket: this.bucket,
                log: this.isLog,
                id,
                content: contentStr,
            },
        }
        return await this.pokeOrTunnel({
            json,
            onSuccess: () => {
                // cache somewhere?
                return id
            },
            onError: () => {
                console.error(
                    `Tome-${this.name}: Failed to save content to the ${this.name}. Checking perms...`
                )
                this.getCurrentForeignPerms()
                return undefined
            },
        })
    }

    /**
     * Add a new post to the feedlog.  Automatically stores the creation time and author.
     *
     * @param content The Content to post to the feedlog.
     * Can be a string, number, boolean, Array, or JSON.
     * @returns The post ID on success, undefined on failure.
     */
    public async post(content: Content): Promise<string | undefined> {
        if (!this.mars) {
            const now = new Date().getTime()
            const id = uuid()
            this.order.unshift(id)
            const entry = {
                id,
                createdAt: now,
                updatedAt: now,
                createdBy: this.ourShip,
                updatedBy: this.ourShip,
                content,
                links: {},
            }
            this.feedlog.unshift(entry)
            localStorage.setItem(
                this.localDataPrefix(),
                JSON.stringify(this.feedlog)
            )
            this.dataUpdateCallback()
            return id
        }
        return await this._postOrEdit(content)
    }

    /**
     * Edit a post in the feedlog.  Automatically stores the updated time and author.
     *
     * @param id The ID of the post to edit.
     * @param newContent The newContent to replace with.
     * Can be a string, number, boolean, Array, or JSON.
     * @returns The post ID on success, undefined on failure.
     */
    public async edit(
        id: string,
        newContent: Content
    ): Promise<string | undefined> {
        if (!this.mars) {
            const index = this.order.indexOf(id)
            if (index === -1) {
                console.error('ID not found.')
                return undefined
            }
            this.feedlog[index] = {
                ...this.feedlog[index],
                updatedAt: new Date().getTime(),
                content: newContent,
            }
            localStorage.setItem(
                this.localDataPrefix(),
                JSON.stringify(this.feedlog)
            )
            this.dataUpdateCallback()
            return id
        } else {
            return await this._postOrEdit(newContent, id)
        }
    }

    /**
     * Delete a post from the feedlog.  If the post with ID does not exist, returns true.
     *
     * @param id The ID of the post to delete.
     * @returns true on success, false on failure.
     */
    public async delete(id: string): Promise<boolean> {
        if (!validate(id)) {
            console.error('Invalid ID.')
            return false
        }
        if (!this.mars) {
            const index = this.order.indexOf(id)
            if (index === -1) {
                return true
            }
            this.order.splice(index, 1)
            this.feedlog.splice(index, 1)
            localStorage.setItem(
                this.localDataPrefix(),
                JSON.stringify(this.feedlog)
            )
            this.dataUpdateCallback()
            return true
        }
        const json = {
            'delete-post': {
                ship: this.tomeShip,
                space: this.space,
                app: this.app,
                bucket: this.bucket,
                log: this.isLog,
                id,
            },
        }
        return await this.pokeOrTunnel({
            json,
            onSuccess: () => {
                // cache somewhere?
                return true
            },
            onError: () => {
                console.error(
                    `Tome-${this.name}: Failed to delete post from ${this.name}. Checking perms...`
                )
                this.getCurrentForeignPerms()
                return false
            },
        })
    }

    /**
     * Clear all posts from the feedlog.
     *
     * @returns true on success, false on failure.
     */
    public async clear(): Promise<boolean> {
        if (!this.mars) {
            this.wipeLocalValues()
            localStorage.removeItem(this.localDataPrefix())
            this.dataUpdateCallback()
            return true
        }
        const json = {
            'clear-feed': {
                ship: this.tomeShip,
                space: this.space,
                app: this.app,
                bucket: this.bucket,
                log: this.isLog,
            },
        }
        return await this.pokeOrTunnel({
            json,
            onSuccess: () => {
                // cache somewhere?
                return true
            },
            onError: () => {
                console.error(
                    `Tome-${this.name}: Failed to clear ${this.name}. Checking perms...`
                )
                this.getCurrentForeignPerms()
                return false
            },
        })
    }

    /**
     * Get the post from the feedlog with the given ID.
     *
     * @param id The ID of the post to retrieve.
     * @param allowCachedValue If true, will return the cached value if it exists.
     * If false, will always fetch from Urbit.  Defaults to true.
     * @returns A FeedlogEntry on success, undefined on failure.
     */
    public async get(
        id: string,
        allowCachedValue: boolean = true
    ): Promise<Content | undefined> {
        if (!this.mars) {
            throw new Error(
                'Tome: get() is not supported in local mode.  Please create an issue on GitHub if you need this feature.'
            )
        }
        if (!validate(id)) {
            console.error('Invalid ID.')
            return undefined
        }
        await this.waitForReady()
        if (allowCachedValue) {
            const index = this.order.indexOf(id)
            if (index > -1) {
                return this.feedlog[index]
            }
        }
        if (this.preload) {
            await this.waitForLoaded()
            const index = this.order.indexOf(id)
            if (index === -1) {
                console.error(`id ${id} not found`)
                return undefined
            }
            return this.feedlog[index]
        } else {
            return await this._getValueFromUrbit(id)
        }
    }

    /**
     * Retrieve all posts from the feedlog, sorted by newest first.
     *
     * @param useCache If true, return the current cache instead of querying Urbit.
     * Only relevant if preload was set to false.  Defaults to false.
     * @returns A FeedlogEntry on success, undefined on failure.
     */
    public async all(useCache: boolean = false): Promise<Content[]> {
        if (!this.mars) {
            const posts = localStorage.getItem(this.localDataPrefix())
            if (posts === null) {
                return undefined
            }
            return JSON.parse(posts)
        }
        await this.waitForReady()
        if (this.preload) {
            await this.waitForLoaded()
            return this.feedlog
        }
        if (useCache) {
            return this.feedlog
        }
        return await this._getAllFromUrbit()
    }

    private async _getValueFromUrbit(id: string): Promise<Content> {
        try {
            let post = await this.api.scry({
                app: this.agent,
                path: this.dataPath(id),
            })
            if (post === null) {
                return undefined
            }
            post = this.parseFeedlogEntry(post)
            const index = this.order.indexOf(id)
            if (index === -1) {
                // TODO find the actual right place to insert this (based on times)?
                this.order.unshift(id)
                this.feedlog.unshift(post)
            } else {
                this.feedlog[index] = post
            }
            return post
        } catch (e) {
            throw new Error(
                `Tome-${this.type}: the store being used has been removed, or your access has been revoked.`
            )
        }
    }

    private async _getAllFromUrbit(): Promise<Content[]> {
        try {
            const data = await this.api.scry({
                app: this.agent,
                path: this.dataPath(),
            })
            // wipe and replace feedlog
            this.order.length = 0
            this.feedlog = data.map((entry: FeedlogEntry) => {
                this.order.push(entry.id)
                return this.parseFeedlogEntry(entry)
            })
            return this.feedlog
        } catch (e) {
            throw new Error(
                `Tome-${this.type}: the store being used has been removed, or your access has been revoked.`
            )
        }
    }

    // other useful methods
    // iterator(page_size = 50) or equivalent for a paginated query
    // since(time: xxx) - returns all posts since time?
}

export class FeedStore extends FeedlogStore {
    private async _setOrRemoveLink(
        id: string,
        content?: Content
    ): Promise<boolean> {
        const action =
            typeof content !== 'undefined'
                ? 'set-post-link'
                : 'remove-post-link'
        if (action === 'set-post-link') {
            if (!this.canStore(content)) {
                console.error('value is an invalid type.')
                return false
            }
        }
        const json = {
            [action]: {
                ship: this.tomeShip,
                space: this.space,
                app: this.app,
                bucket: this.bucket,
                log: this.isLog,
                id,
            },
        }
        if (action === 'set-post-link') {
            // @ts-expect-error
            json[action].value = JSON.stringify(content)
        }
        return await this.pokeOrTunnel({
            json,
            onSuccess: () => {
                // cache somewhere?
                return true
            },
            onError: () => {
                console.error(
                    `Tome-${this.name}: Failed to modify link in the ${this.name}.`
                )
                this.getCurrentForeignPerms()
                return false
            },
        })
    }

    /**
     * Associate a link with the feed post corresponding to ID.
     *
     * @param id The ID of the post to link to.
     * @param content The Content to associate with the post.
     * @returns true on success, false on failure.
     */
    public async setLink(id: string, content: Content): Promise<boolean> {
        if (!validate(id)) {
            console.error('Invalid ID.')
            return false
        }
        if (!this.mars) {
            const index = this.order.indexOf(id)
            if (index === -1) {
                console.error('Post does not exist.')
                return false
            }
            this.feedlog[index] = {
                ...this.feedlog[index],
                links: {
                    ...this.feedlog[index].links,
                    [this.ourShip]: content,
                },
            }
            localStorage.setItem(
                this.localDataPrefix(),
                JSON.stringify(this.feedlog)
            )
            this.dataUpdateCallback()
            return true
        }
        return await this._setOrRemoveLink(id, content)
    }

    /**
     * Remove the current ship's link to the feed post corresponding to ID.
     *
     * @param id The ID of the post to remove the link from.
     * @returns true on success, false on failure.  If the post with ID does not exist, returns true.
     */
    public async removeLink(id: string): Promise<boolean> {
        if (!validate(id)) {
            console.error('Invalid ID.')
            return false
        }
        if (!this.mars) {
            const index = this.order.indexOf(id)
            if (index === -1) {
                console.error('Post does not exist.')
                return false
            }
            this.feedlog[index] = {
                ...this.feedlog[index],
                // @ts-expect-error
                links: (({ [this.ourShip]: _, ...o }) => o)(
                    this.feedlog[index].links
                ), // remove data.body.ship
            }
            localStorage.setItem(
                this.localDataPrefix(),
                JSON.stringify(this.feedlog)
            )
            this.dataUpdateCallback()
            return true
        }
        return await this._setOrRemoveLink(id)
    }
}

export class LogStore extends FeedlogStore {}

export class KeyValueStore extends DataStore {
    /**
     * Set a key-value pair in the store.
     *
     * @param key The key to set.
     * @param value The value to associate with the key.  Can be a string, number, boolean, Array, or JSON.
     * @returns true on success, false on failure.
     */
    public async set(key: string, value: Value): Promise<boolean> {
        if (!key) {
            console.error('missing key parameter')
            return false
        }
        if (!this.canStore(value)) {
            console.error('value is an invalid type.')
            return false
        }
        const valueStr = JSON.stringify(value)

        if (!this.mars) {
            try {
                localStorage.setItem(this.localDataPrefix(key), valueStr)
                this.cache.set(key, value)
                this.dataUpdateCallback()
                return true
            } catch (error) {
                console.error(error)
                return false
            }
        } else {
            const json = {
                'set-value': {
                    ship: this.tomeShip,
                    space: this.space,
                    app: this.app,
                    bucket: this.bucket,
                    key,
                    value: valueStr,
                },
            }
            return await this.pokeOrTunnel({
                json,
                onSuccess: () => {
                    this.cache.set(key, value)
                    this.dataUpdateCallback()
                    return true
                },
                onError: () => {
                    console.error('Failed to set key-value pair in the Store.')
                    this.getCurrentForeignPerms()
                    return false
                },
            })
        }
    }

    /**
     * Remove a key-value pair from the store.
     *
     * @param key The key to remove.
     * @returns true on success, false on failure.  If the key does not exist, returns true.
     */
    public async remove(key: string): Promise<boolean> {
        if (!key) {
            console.error('missing key parameter')
            return false
        }
        if (!this.mars) {
            localStorage.removeItem(this.localDataPrefix(key))
            this.cache.delete(key)
            this.dataUpdateCallback()
            return true
        } else {
            const json = {
                'remove-value': {
                    ship: this.tomeShip,
                    space: this.space,
                    app: this.app,
                    bucket: this.bucket,
                    key,
                },
            }
            return await this.pokeOrTunnel({
                json,
                onSuccess: () => {
                    this.cache.delete(key)
                    this.dataUpdateCallback()
                    return true
                },
                onError: () => {
                    console.error(
                        'Failed to remove key-value pair from the Store.'
                    )
                    this.getCurrentForeignPerms()
                    return false
                },
            })
        }
    }

    /**
     * Discard all values in the store.
     *
     * @returns true on success, false on failure.
     */
    public async clear(): Promise<boolean> {
        if (!this.mars) {
            // TODO - only clear certain keys
            localStorage.clear()
            this.cache.clear()
            this.dataUpdateCallback()
            return true
        } else {
            const json = {
                'clear-kv': {
                    ship: this.tomeShip,
                    space: this.space,
                    app: this.app,
                    bucket: this.bucket,
                },
            }
            return await this.pokeOrTunnel({
                json,
                onSuccess: () => {
                    this.cache.clear()
                    this.dataUpdateCallback()
                    return true
                },
                onError: () => {
                    console.error('Failed to clear Store.')
                    this.getCurrentForeignPerms()
                    return false
                },
            })
        }
    }

    /**
     * Get the value associated with a key in the store.
     *
     * @param key  The key to retrieve.
     * @param allowCachedValue  Whether we can check for cached values first.
     * If false, we will always check Urbit for the latest value. Default is true.
     * @returns The value associated with the key, or undefined if the key does not exist.
     */
    public async get(
        key: string,
        allowCachedValue: boolean = true
    ): Promise<Value | undefined> {
        if (!key) {
            console.error('missing key parameter')
            return undefined
        }

        if (!this.mars) {
            const value = localStorage.getItem(this.localDataPrefix(key))
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
                if (typeof value !== 'undefined') {
                    return value
                }
            }
            if (this.preload) {
                await this.waitForLoaded()
                const value = this.cache.get(key)
                if (typeof value === 'undefined') {
                    console.error(`key ${key} not found`)
                }
                return value
            } else {
                return await this._getValueFromUrbit(key)
            }
        }
    }

    /**
     * Get all key-value pairs in the store.
     *
     * @param useCache return the cache instead of querying Urbit.  Only relevant if preload was set to false.
     * @returns A map of all key-value pairs in the store.
     */
    public async all(useCache: boolean = false): Promise<Map<string, Value>> {
        if (!this.mars) {
            const map = new Map<string, Value>()
            const len = localStorage.length
            const startIndex = this.localDataPrefix().length
            for (let i = 0; i < len; i++) {
                const key = localStorage.key(i)
                if (key.startsWith(this.localDataPrefix())) {
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
            }
            if (useCache) {
                return this.cache
            }
            return await this._getAllFromUrbit()
        }
    }

    private async _getValueFromUrbit(key: string): Promise<Value> {
        try {
            let value = await this.api.scry({
                app: this.agent,
                path: this.dataPath(key),
            })
            // TODO value is null when it shouldn't be.
            if (value === null) {
                this.cache.delete(key)
                return undefined
            }
            value = JSON.parse(value)
            this.cache.set(key, value)
            return value
        } catch (e) {
            throw new Error(
                `Tome-${this.type}: the store being used has been removed, or your access has been revoked.`
            )
        }
    }

    private async _getAllFromUrbit(): Promise<Map<string, Value>> {
        try {
            const data = await this.api.scry({
                app: this.agent,
                path: this.dataPath(),
            })
            this.cache.clear()
            const entries: Array<[string, string]> = Object.entries(data)
            for (const [key, value] of entries) {
                this.cache.set(key, JSON.parse(value))
            }
            return this.cache
        } catch (e) {
            throw new Error(
                `Tome-${this.type}: the store being used has been removed, or your access has been revoked.`
            )
        }
    }
}
