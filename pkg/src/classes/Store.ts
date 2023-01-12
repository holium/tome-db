import Urbit from '@urbit/http-api'
import { Tome } from '../index'

export class Store extends Tome {
    protected storeSubscriptionID: number
    protected cache: Map<string, string>

    // subscribe to all values in the store, and keep cache synced.
    private async subscribeAll() {
        this.storeSubscriptionID = await this.api.subscribe({
            app: 'tome-api',
            path: `/store/${this.space}/${this.app}`,
            err: () => {
                throw new Error(
                    'Tome: the key-value store being used has been removed, or your access has been revoked.'
                )
            },
            event: () => {
                // first event should return all current values.
                // next events should return updates
            },
            quit: this.subscribeAll,
        })
    }

    private constructor(
        api?: Urbit,
        tomeShip?: string,
        thisShip?: string,
        space?: string,
        app?: string,
        preload?: boolean
    ) {
        if (typeof api !== 'undefined') {
            super(api, tomeShip, thisShip, space, app, false)
            if (preload) {
                this.subscribeAll()
            }
        } else {
            super()
        }
    }

    private static async initStorePoke(
        api: Urbit,
        ship: string,
        space: string,
        app: string
    ) {
        await api.poke({
            app: 'tome-api',
            mark: 'tome-action',
            json: {
                'init-store': {
                    space: space,
                    app: app,
                },
            },
            ship: ship,
            onError: (error) => {
                throw new Error(
                    `Tome: Initializing key-value store on ship ${ship} failed: ${error}.  Make sure the ship and Tome agent are both running.`
                )
            },
        })
    }

    public static async initStore(
        api?: Urbit,
        tomeShip?: string,
        thisShip?: string,
        space?: string,
        app?: string,
        preload?: boolean
    ) {
        const mars = typeof api !== 'undefined'
        if (mars) {
            // poke to init store
            if (tomeShip === thisShip) {
                await Store.initStorePoke(api, tomeShip, space, app)
                // await Store.initStorePoke...
            }
            return new Store(api, tomeShip, thisShip, space, app, preload)
        }
        return new Store()
    }

    /**
     * Set a key-value pair in the store.
     */
    public async set(key: string, value: string): Promise<void> {
        if (!key || !value) {
            console.error('missing key or value parameter')
            return
        }

        if (!this.mars) {
            try {
                localStorage.setItem(`${this.name}/${key}`, value)
            } catch (error) {
                console.error(error)
            }
        } else {
            await this.api.poke({
                app: 'tome-api',
                mark: 'store-action',
                json: {
                    'set-store': {
                        store: this.name,
                        key: key,
                        val: value,
                    },
                },
                ship: this.ship,
                onError: (error) => {
                    console.error(error)
                },
            })
        }
    }
    /**
     * Remove a specific key-value pair from the store.
     */
    public async remove(key: string): Promise<void> {
        if (!key) {
            console.error('missing key parameter')
            return
        }

        if (!this.mars) {
            localStorage.removeItem(`${this.name}/${key}`)
        } else {
            await this.api.poke({
                app: 'tome-api',
                mark: 'store-action',
                json: {
                    'remove-store': {
                        store: this.name,
                        key: key,
                    },
                },
                ship: this.ship,
                onError: (error) => {
                    console.error(error)
                },
            })
        }
    }

    /**
     * Discard all values in the store.
     */
    public async clear(): Promise<void> {
        if (!this.mars) {
            localStorage.clear()
        } else {
            await this.api.poke({
                app: 'tome-api',
                mark: 'store-action',
                json: {
                    'clear-store': {
                        store: this.name,
                    },
                },
                ship: this.ship,
                onError: (error) => {
                    console.error(error)
                },
            })
        }
    }

    /**
     * Retrieve the value associated with a specific key in the store.
     * @param key  The key to retrieve.
     * @param allowCachedValue  Whether we can check for cached values first.
     * If false, we will always check Urbit for the latest value.
     */
    public get(key: string, allowCachedValue: boolean = true): string {
        if (!key) {
            console.error('missing key parameter')
            return ''
        }

        if (!this.mars) {
            const value = localStorage.getItem(`${this.name}/${key}`)
            if (value === null) {
                console.error(`key ${key} not found`)
                return ''
            }
            return value
        } else {
            // TODO: get the key directly from the local store object
            // instead of scrying
            // return await this.api
            //     .scry({
            //         app: 'tome-api',
            //         path: `/store/${this.name}/${key}/json`,
            //     })
            //     .then((value: string) => value)
            //     .catch(() => {
            //         console.error(`key ${key} not found`)
            //         return ''
            //     })
        }
    }

    /**
     * Get all key-value pairs in the store.
     */
    public async all(): Promise<Map<string, string>> {
        if (!this.mars) {
            const map: Map<string, string> = new Map()
            const len = localStorage.length
            const startIndex = `${this.name}/`.length
            for (let i = 0; i < len; i++) {
                const key = localStorage.key(i)
                if (key.startsWith(`${this.name}/`)) {
                    const keyName = key.substring(startIndex) // get key without prefix
                    map.set(keyName, localStorage.getItem(key))
                }
            }
            return map
        } else {
            // TODO: return the direct map object
            // instead of scrying
            // return await this.api
            //     .scry({
            //         app: 'tome-api',
            //         path: `/store/${this.name}/json`,
            //     })
            //     .then((value: JSON) => new Map(Object.entries(value)))
            //     .catch((error) => {
            //         console.error(error)
            //         return new Map()
            //     })
        }
    }

    public canCreate() {
        console.error(
            'Cannot check permissions on subclasses of Tome. Use the base class instead.'
        )
    }

    public canOverwrite() {
        console.error(
            'Cannot check permissions on subclasses of Tome. Use the base class instead.'
        )
    }
}
