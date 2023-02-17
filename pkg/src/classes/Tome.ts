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
    protected spaceForPath: string // space name as woad (encoded)
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
                spaceForPath,
                app,
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
            const inRealm = options.realm !== undefined ? options.realm : false
            let tomeShip = options.ship !== undefined ? options.ship : api.ship
            let space = options.space !== undefined ? options.space : 'our'
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
            if (app === undefined) {
                app = 'all'
            }
            const perm = options.permissions
                ? options.permissions
                : ({ read: 'our', write: 'our', admin: 'our' } as const)
            await Tome.initTomePoke(api, tomeShip, space, app)
            return new Tome({
                api,
                tomeShip,
                ourShip,
                space,
                spaceForPath,
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
            spaceForPath: this.spaceForPath,
            app: this.app,
            perm: permissions,
            locked: this.locked,
            bucket: options.bucket ? options.bucket : 'def',
            preload: options.preload !== undefined ? options.preload : true,
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
