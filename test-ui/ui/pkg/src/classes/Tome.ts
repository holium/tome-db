import Urbit from '@urbit/http-api'
import {
    Perm,
    KeyValueStore,
    FeedStore,
    LogStore,
    StoreOptions,
    TomeOptions,
    DataStore,
    InitStoreOptions,
    StoreType,
} from '../index'
import { agent, tomeMark } from './constants'

export class Tome {
    protected api: Urbit
    protected mars: boolean

    protected ourShip: string
    protected tomeShip: string
    protected space: string
    protected app: string
    protected perm: Perm
    protected locked: boolean // if true, Tome is locked to the initial ship and space.
    protected inRealm: boolean

    protected static async initTomePoke(
        api: Urbit,
        ship: string,
        space: string,
        app: string
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
        if (options !== undefined) {
            this.mars = true
            const {
                api,
                tomeShip,
                ourShip,
                space,
                app,
                perm,
                locked,
                inRealm,
            } = options
            this.api = api
            this.tomeShip = tomeShip
            this.ourShip = ourShip
            this.space = space
            this.app = app
            this.perm = perm
            this.locked = locked
            this.inRealm = inRealm
        } else {
            this.mars = false
            this.app = 'tome-db'
        }
    }

    /**
     * @param api The optional Urbit connection to be used for requests.
     * @param app An optional app name to store under. Defaults to `'all'`.
     * @param options Optional ship, space, and permissions for initializing a Tome.
     * @returns A new Tome instance.
     */
    static async init(
        api?: Urbit,
        app?: string,
        options: TomeOptions = {}
    ): Promise<Tome> {
        const mars = api !== undefined
        if (mars) {
            let locked = false
            let tomeShip = `~${api.ship}`
            let space = 'our'
            let inRealm = true

            // verify that spaces agent is installed and configured
            try {
                const current = await api.scry({
                    app: 'spaces',
                    path: '/current',
                })
                const spacePath = current.current.path.split('/')
                tomeShip = spacePath[1]
                space = spacePath[2]
            } catch (e) {
                inRealm = false
                console.warn(
                    'Tome: no current space found. Is Realm installed / configured?'
                )
                console.warn(
                    "Tome: falling back to current ship and 'our' space."
                )
            }

            if (options.ship && options.space) {
                if (options.ship !== tomeShip || options.space !== space) {
                    throw new Error(
                        'Tome: you are not in the preset space-path (space and corresponding ship).'
                    )
                }
                locked = true
                tomeShip = options.ship
                space = options.space
            }
            // save api.ship so we know who we are.
            const ourShip = `~${api.ship}`
            if (app === undefined) {
                app = 'all'
            }
            const perm = options.permissions
                ? options.permissions
                : ({ read: 'space', write: 'our', admin: 'our' } as const)
            await Tome.initTomePoke(api, tomeShip, space, app)
            return new Tome({
                api,
                tomeShip,
                ourShip,
                space,
                app,
                perm,
                locked,
                inRealm,
            })
        }
        return new Tome()
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
            app: this.app,
            perm: permissions,
            locked: this.locked,
            bucket: options.bucket ? options.bucket : 'def',
            preload: options.preload !== undefined ? options.preload : true,
            onReadyChange: options.onReadyChange,
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
     * defaults to the Tome's permissions, `bucket` to `'def'`, and `preload` to true.
     * @returns A `KeyValueStore`.
     */
    public async keyvalue(options: StoreOptions = {}): Promise<KeyValueStore> {
        if (this.mars) {
            return (await this._initStore(
                options,
                'kv',
                false
            )) as KeyValueStore
        } else {
            return new KeyValueStore()
        }
    }

    /**
     * Initialize or connect to a feed store.
     *
     * @param options  Optional bucket, permissions, preload flag, and callbacks for the feed. `permisssions`
     * defaults to the Tome's permissions, `bucket` to `'def'`, and `preload` to true.
     * @returns A `FeedStore`.
     */
    public async feed(options: StoreOptions = {}): Promise<FeedStore> {
        if (this.mars) {
            return (await this._initStore(options, 'feed', false)) as FeedStore
        } else {
            throw new Error(
                'Tome-feed: Feed can only be used with Urbit. Try using `keyvalue` instead.'
            )
        }
    }

    /**
     * Initialize or connect to a log store.
     *
     * @param options  Optional bucket, permissions, preload flag, and callbacks for the log. `permisssions`
     * defaults to the Tome's permissions, `bucket` to `'def'`, and `preload` to true.
     * @returns A `LogStore`.
     */
    public async log(options: StoreOptions = {}): Promise<LogStore> {
        if (this.mars) {
            return (await this._initStore(options, 'feed', true)) as LogStore
        } else {
            throw new Error(
                'Tome-log: Log can only be used with Urbit. Try using `keyvalue` instead.'
            )
        }
    }

    public isOurStore(): boolean {
        return this.tomeShip === this.ourShip
    }
}
