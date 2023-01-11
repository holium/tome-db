import Urbit from '@urbit/http-api'
import { Perm } from '../index'

interface StoreVals {
    ship?: string
    name?: string
    permissions?: Perm
}

export class Store {
    protected api: Urbit
    protected mars: boolean
    protected perm: Perm
    protected name: string
    protected ship: string

    private static async initStore(api: Urbit, name: string, perm: Perm) {
        await api.poke({
            app: 'tome-api',
            mark: 'tome-action',
            json: {
                'init-store': {
                    store: name,
                    perm: perm,
                },
            },
            onError: (error) => {
                console.error(error)
            },
        })
    }

    // watch our store, or a foreign store.
    // on update: update state in this class?
    // should return the store's contents on the initial watch
    private static async watchStore() {}

    private constructor(api?: Urbit, vals?: StoreVals) {
        this.mars = typeof api !== 'undefined'
        if (this.mars) {
            this.api = api
            this.perm = vals.permissions
                ? vals.permissions
                : { read: 'our', write: 'our' }
            this.ship = vals.ship ? vals.ship : api.ship
            this.name = vals.name ? vals.name : api.desk
        } else {
            this.name = 'tome-db'
        }
    }

    static async create(api?: Urbit, vals?: StoreVals): Promise<Store> {
        await Store.initStore(api, vals.name, vals.permissions)
        await Store.watchStore()
        return new Store(api, vals)
    }

    /**
     * Load a foreign ship's store.
     *
     */
    static async load(api: Urbit, ship: string, name: string): Promise<Store> {
        await Store.watchStore()
        return new Store(api, { ship: ship, name: name })
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
     */
    public get(key: string): string {
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
}
