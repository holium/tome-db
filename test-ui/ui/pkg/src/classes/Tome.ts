import Urbit from '@urbit/http-api'
import { Perm, Store, StoreOptions, TomeOptions } from '../index'
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

    protected permissionSubscriptionID: number

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
            ship: ship,
            onError: (error) => {
                throw new Error(
                    `Tome: Initializing Tome on ship ${ship} failed.  Make sure the ship and Tome agent are both running.\nError: ${error}`
                )
            },
        })
    }

    protected constructor(
        api?: Urbit,
        tomeShip?: string,
        thisShip?: string,
        space?: string,
        app?: string,
        perm?: Perm,
        locked?: boolean
    ) {
        this.mars = typeof api !== 'undefined'
        if (this.mars) {
            this.api = api
            this.tomeShip = tomeShip
            this.thisShip = thisShip
            this.space = space
            this.app = app
            this.perm = perm
            this.locked = locked
        } else {
            this.app = 'tome-db'
        }
    }

    /**
     * @param api The optional Urbit connection to be used for requests.
     * @param options Optional ship, space, app, and permissions for initializing a Tome.
     * @returns A new Tome instance.
     */
    static async init(api?: Urbit, options: TomeOptions = {}): Promise<Tome> {
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
                        'Tome: you are not in the set ship and space.'
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

            const app = options.app ? options.app : 'all'
            let perm = options.permissions
                ? options.permissions
                : ({ read: 'space', write: 'our', admin: 'our' } as const)
            await Tome.initTomePoke(api, tomeShip, space, app)
            return new Tome(api, tomeShip, thisShip, space, app, perm, locked)
        }
        return new Tome()
    }

    /**
     * Initialize or retrieve the keyvalue Store for this Tome.
     *
     * @param options  Optional bucket name, permissions and preload configuration for the store. `permisssions` will
     * default to the Tome's permissions, `bucket` to `'def'`, and `preload` will default to true. Preload definess whether
     * the frontend should stay subscribed to and cache all data / updates from the store.
     * If false, the frontend will access values from Urbit only when requested, which may take longer.
     * @returns A Store instance.
     */
    public async keyvalue(options: StoreOptions = {}): Promise<Store> {
        if (this.mars) {
            let permissions = options.permissions
                ? options.permissions
                : this.perm
            if (this.app === 'all') {
                console.warn(
                    'Tome: Permissions on `all` are ignored. Using `our` instead...'
                )
                permissions = {
                    read: 'our',
                    write: 'our',
                    admin: 'our',
                } as const
            }
            return await Store.initStore(
                this.api,
                this.tomeShip,
                this.thisShip,
                this.space,
                this.app,
                options.bucket ? options.bucket : 'def',
                permissions,
                options.preload !== undefined ? options.preload : true,
                this.locked
            )
        } else {
            return Store.initStore()
        }
    }
}
