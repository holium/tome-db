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
} from '../index'
import { agent, tomeMark } from './constants'

export class Tome {
    protected api: Urbit
    protected mars: boolean

    protected thisShip: string
    protected tomeShip: string
    protected space: string
    protected app: string
    protected perm: Perm
    protected locked: boolean // if true, Tome is locked to the initial ship and space.

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
                    ship: ship,
                    space: space,
                    app: app,
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
        if (typeof options !== 'undefined') {
            this.mars = true
            const { api, tomeShip, thisShip, space, app, perm, locked } =
                options
            this.api = api
            this.tomeShip = tomeShip
            this.thisShip = thisShip
            this.space = space
            this.app = app
            this.perm = perm
            this.locked = locked
        } else {
            this.mars = false
            this.app = 'tome-db'
        }
    }

    /**
     * @param api The optional Urbit connection to be used for requests.
     * @param app An optional app name to be used for requests. Defaults to `'all'`.
     * @param options Optional ship, space, and permissions for initializing a Tome.
     * @returns A new Tome instance.
     */
    static async init(
        api?: Urbit,
        app?: string,
        options: TomeOptions = {}
    ): Promise<Tome> {
        const mars = typeof api !== 'undefined'
        if (mars) {
            let locked = false
            let tomeShip = api.ship
            let space = 'our'

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
            if (tomeShip.startsWith('~')) {
                tomeShip = tomeShip.slice(1) // remove leading sig
            }
            // save api.ship so we know who we are.
            const thisShip = api.ship
            if (app === undefined) {
                app = 'all'
            }
            let perm = options.permissions
                ? options.permissions
                : ({ read: 'space', write: 'our', admin: 'our' } as const)
            await Tome.initTomePoke(api, tomeShip, space, app)
            return new Tome({
                api,
                tomeShip,
                thisShip,
                space,
                app,
                perm,
                locked,
            })
        }
        return new Tome()
    }

    /**
     * Initialize or retrieve the keyvalue Store for this Tome.
     *
     * @param options  Optional bucket name, permissions, preload configuration, and callbacks for the store. `permisssions` will
     * default to the Tome's permissions, `bucket` to `'def'`, and `preload` will default to true. Preload definess whether
     * the frontend should stay subscribed to and cache all data / updates from the store.
     * If false, the frontend will access values from Urbit only when requested, which may take longer.
     * @returns A Store instance.
     */
    public async keyvalue(options: StoreOptions = {}): Promise<KeyValueStore> {
        if (this.mars) {
            let permissions = options.permissions
                ? options.permissions
                : this.perm
            if (this.app === 'all' && this.tomeShip === this.thisShip) {
                console.warn(
                    'Tome-KV: Permissions on `all` are ignored. Setting all permissions levels to `our` instead...'
                )
                permissions = {
                    read: 'our',
                    write: 'our',
                    admin: 'our',
                } as const
            }
            return await DataStore.initDataStore({
                type: 'kv',
                api: this.api,
                tomeShip: this.tomeShip,
                thisShip: this.thisShip,
                space: this.space,
                app: this.app,
                perm: permissions,
                locked: this.locked,
                bucket: options.bucket ? options.bucket : 'def',
                preload: options.preload !== undefined ? options.preload : true,
                onReadyChange: options.onReadyChange,
                onWriteChange: options.onWriteChange,
                onAdminChange: options.onAdminChange,
                isLog: false,
            })
        } else {
            return new KeyValueStore()
        }
    }

    // public async feed(options: Options = {}): Promise<FeedStore> {
    //     if (!this.mars) {
    //         throw new Error(
    //             'Tome-Feed: Feed can only be used on Urbit. Try using `keyvalue` instead.'
    //         )
    //     }
    //     let permissions = options.permissions ? options.permissions : this.perm
    //     if (this.app === 'all' && this.tomeShip === this.thisShip) {
    //         console.warn(
    //             'Tome-KV: Permissions on `all` are ignored. Setting all permissions levels to `our` instead...'
    //         )
    //         permissions = {
    //             read: 'our',
    //             write: 'our',
    //             admin: 'our',
    //         } as const
    //     }
    //     return await FeedStore.initFeed()
    // }

    // public async log(options: Options = {}): Promise<LogStore> {
    //     if (!this.mars) {
    //         throw new Error(
    //             'Tome-Log: Log can only be used on Urbit. Try using `keyvalue` instead.'
    //         )
    //     }
    // }
}
