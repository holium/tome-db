import { DataStore, Value } from '../../index'
import { agent } from '../constants'

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
                app: agent,
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
                app: agent,
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
