import Urbit from '@urbit/http-api'
import { Perm, Store, TomeOptions } from '../index'
import { agent, tomeMark } from './constants'

export class Tome {
    protected api: Urbit
    protected mars: boolean

    protected thisShip: string
    protected tomeShip: string
    protected space: string
    protected app: string
    protected perm: Perm

    protected _canCreate: boolean
    protected _canOverwrite: boolean
    protected permissionSubscriptionID: number

    private static async initTomePoke(
        api: Urbit,
        ship: string,
        space: string,
        app: string,
        perm: Perm
    ) {
        await api.poke({
            app: agent,
            mark: tomeMark,
            json: {
                'init-tome': {
                    space: space,
                    app: app,
                    perm: perm,
                },
            },
            ship: ship,
            onError: (error) => {
                throw new Error(
                    `Tome: Initializing Tome on ship ${ship} failed: ${error}.  Make sure the ship and Tome agent are both running.`
                )
            },
        })
    }

    private watchPerms = async () => {
        const id = await this.api.subscribe({
            app: agent,
            path: `/perm/${this.space}/${this.app}/${this.thisShip}`,
            err: () => {
                throw new Error(
                    'Tome: the requested Tome has since been removed, or your access has been revoked.'
                )
            },
            event: (event: { create: boolean; overwrite: boolean }) => {
                this._canCreate = event.create
                this._canOverwrite = event.overwrite
            },
        })
        this.permissionSubscriptionID = id
    }

    protected constructor(
        api?: Urbit,
        tomeShip?: string,
        thisShip?: string,
        space?: string,
        app?: string,
        shouldWatchPerms?: boolean,
        perm?: Perm,
        canCreate?: boolean,
        canOverwrite?: boolean
    ) {
        this.mars = typeof api !== 'undefined'
        if (this.mars) {
            this.api = api
            this.tomeShip = tomeShip
            this.thisShip = thisShip
            this.space = space
            this.app = app
            this.perm = perm
            if (canCreate !== undefined && canOverwrite !== undefined) {
                this._canCreate = canCreate
                this._canOverwrite = canOverwrite
            }
            // subscribe to permission updates
            if (shouldWatchPerms) {
                this.watchPerms()
            }
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
            let tomeShip = options.ship ? options.ship : api.ship
            if (tomeShip.startsWith('~')) {
                tomeShip = tomeShip.slice(1) // remove leading sig
            }
            // save api.ship so we know who we are.
            const thisShip = api.ship
            // overwrite it so subscriptions will go to the right place
            api.ship = tomeShip

            const space = options.space ? options.space : 'our'
            const app = options.app ? options.app : 'all'
            const perm = options.permissions
                ? options.permissions
                : ({ read: 'our', create: 'our', overwrite: 'our' } as const)
            if (tomeShip === thisShip) {
                // this is our tome, so create it
                await Tome.initTomePoke(api, tomeShip, space, app, perm)
                return new Tome(
                    api,
                    tomeShip,
                    thisShip,
                    space,
                    app,
                    true,
                    perm,
                    true,
                    true
                )
            } else {
                // get our create and overwrite permissions.
                // NACK if Tome DNE, or we don't have read permissions.
                const getPermsAndInitTome = async () => {
                    const id = await api.subscribe({
                        app: agent,
                        path: `/perm/${space}/${app}/${thisShip}`,
                        err: () => {
                            throw new Error(
                                'Tome: the requested Tome does not exist, or you do not have permission to access it.'
                            )
                        },
                        event: async (event: {
                            create: boolean
                            overwrite: boolean
                        }) => {
                            // close the subscription.  We will re-subscribe for permission updates in the class instance
                            await api.unsubscribe(id)
                            return new Tome(
                                api,
                                tomeShip,
                                thisShip,
                                space,
                                app,
                                true,
                                perm,
                                event.create,
                                event.overwrite
                            )
                        },
                        quit: getPermsAndInitTome,
                    })
                }
                await getPermsAndInitTome()
            }
        }
        return new Tome()
    }

    /**
     * Initialize or retrieve the keyvalue Store for this Tome.
     *
     * @param preload  Whether the frontend should stay subscribed to and cache all data / updates from the store.
     *  If false, the frontend will access values from Urbit only when requested, which may take longer.
     * @returns A Store instance.
     */
    public async keyvalue(preload: boolean = true): Promise<Store> {
        if (this.mars) {
            return await Store.initStore(
                this.api,
                this.tomeShip,
                this.thisShip,
                this.space,
                this.app,
                preload
            )
        } else {
            return Store.initStore()
        }
    }

    /**
     * Whether the current ship has permission to create new entries in this Tome, or overwrite it's own entries.
     */
    public canCreate(): boolean | void {
        return this._canCreate
    }

    /**
     * Whether the current ship has permission to overwrite or delete any entry in this Tome.
     */
    public canOverwrite(): boolean | void {
        return this._canOverwrite
    }
}
