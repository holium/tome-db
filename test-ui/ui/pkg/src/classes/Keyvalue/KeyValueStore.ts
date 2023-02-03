import { DataStore, InitStoreOptions, Value } from '../../index'
import { agent, kvMark, localKvPrefix, kvThread } from '../constants'

export class KeyValueStore extends DataStore {
    public constructor(options?: InitStoreOptions) {
        if (options !== undefined) {
            super(options)
        } else {
            super()
        }
    }

    /**
     * Set a key-value pair in the store.
     * @param key The key to set.
     * @param value The string or JSON value to associate with the key.
     * @returns true if successful, false if not.
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
                localStorage.setItem(localKvPrefix + key, valueStr)
                return true
            } catch (error) {
                console.error(error)
                return false
            }
        } else {
            await this.waitForReady()
            // maybe set in the cache, return, and poke / retry as necesssary?
            let success = false
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
            if (this.tomeShip === this.ourShip) {
                await this.api.poke({
                    app: agent,
                    mark: kvMark,
                    json,
                    onSuccess: () => {
                        this.cache.set(key, value)
                        this.dataUpdateCallback()
                        success = true
                    },
                    onError: () => {
                        console.error(
                            'Failed to set key-value pair in the Store.'
                        )
                    },
                })
            } else {
                // Tunnel poke to Tome ship
                const result = await this.api
                    .thread({
                        inputMark: 'json',
                        outputMark: 'json',
                        threadName: kvThread,
                        body: {
                            ship: this.tomeShip,
                            json: JSON.stringify(json),
                        },
                    })
                    .catch(() => {
                        console.error(
                            'Failed to add key-value pair to the Store.'
                        )
                        return undefined
                    })
                success = result === 'success'
                if (success) {
                    this.cache.set(key, value)
                    this.dataUpdateCallback()
                } else {
                    // TODO get current foreign perms
                }
            }
            return success
        }
    }

    /**
     * Remove a specific key-value pair from the store.
     * @param key The key to remove.
     * @returns True if an element in the Store existed and has been removed, or False if the element does not exist.
     */
    public async remove(key: string): Promise<boolean> {
        if (!key) {
            console.error('missing key parameter')
            return false
        }

        if (!this.mars) {
            localStorage.removeItem(localKvPrefix + key)
            return true
        } else {
            await this.waitForReady()
            let success = false
            const json = {
                'remove-value': {
                    ship: this.tomeShip,
                    space: this.space,
                    app: this.app,
                    bucket: this.bucket,
                    key,
                },
            }
            if (this.tomeShip === this.ourShip) {
                await this.api.poke({
                    app: agent,
                    mark: kvMark,
                    json,
                    onSuccess: () => {
                        this.cache.delete(key)
                        this.dataUpdateCallback()
                        success = true
                    },
                    onError: (error) => {
                        console.error(error)
                    },
                })
            } else {
                // Tunnel poke to Tome ship
                const result = await this.api
                    .thread({
                        inputMark: 'json',
                        outputMark: 'json',
                        threadName: kvThread,
                        body: {
                            ship: this.tomeShip,
                            json: JSON.stringify(json),
                        },
                    })
                    .catch(() => {
                        console.error(
                            'Failed to remove key-value pair from the Store.'
                        )
                        return undefined
                    })
                success = result === 'success'
                if (success) {
                    this.cache.delete(key)
                    this.dataUpdateCallback()
                }
            }
            return success
        }
    }

    /**
     * Discard all values in the store.
     * @returns True on success, False on failure.
     */
    public async clear(): Promise<boolean> {
        if (!this.mars) {
            // TODO - if we're only wiping a bucket, this might be the wrong method.
            localStorage.clear()
            return true
        } else {
            await this.waitForReady()
            let success = false
            const json = {
                'clear-kv': {
                    ship: this.tomeShip,
                    space: this.space,
                    app: this.app,
                    bucket: this.bucket,
                },
            }
            if (this.tomeShip === this.ourShip) {
                await this.api.poke({
                    app: agent,
                    mark: kvMark,
                    json,
                    onSuccess: () => {
                        this.cache.clear()
                        this.dataUpdateCallback()
                        success = true
                    },
                    onError: () => {
                        console.error('Failed to clear Store')
                    },
                })
            } else {
                // Tunnel poke to Tome ship
                const result = await this.api
                    .thread({
                        inputMark: 'json',
                        outputMark: 'json',
                        threadName: kvThread,
                        body: {
                            ship: this.tomeShip,
                            json: JSON.stringify(json),
                        },
                    })
                    .catch(() => {
                        console.error('Failed to clear Store.')
                        return undefined
                    })
                success = result === 'success'
                if (success) {
                    this.cache.clear()
                    this.dataUpdateCallback()
                }
            }
            return success
        }
    }

    /**
     * Retrieve the value associated with a specific key in the store.
     * @param key  The key to retrieve.
     * @param allowCachedValue  Whether we can check for cached values first.
     * If false, we will always check Urbit for the latest value. Default is true.
     * @returns The JSON value associated with the key, or undefined if the key does not exist.
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
            const value = localStorage.getItem(localKvPrefix + key)
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
                if (value !== undefined) {
                    return value
                }
            }
            if (this.preload) {
                await this.waitForLoaded()
                const value = this.cache.get(key)
                if (value === undefined) {
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
     * @param useCache return the cache instead of querying Urbit.  Only relevant if preload was set to false.
     * @returns A map of all key-value pairs in the store.
     */
    public async all(useCache: boolean = false): Promise<Map<string, Value>> {
        if (!this.mars) {
            const map = new Map<string, Value>()
            const len = localStorage.length
            const startIndex = localKvPrefix.length
            for (let i = 0; i < len; i++) {
                const key = localStorage.key(i)
                if (key.startsWith(localKvPrefix)) {
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

    // TODO - does this have race conditions?
    private async _getValueFromUrbit(key: string): Promise<Value> {
        return await this.api
            .subscribe({
                app: agent,
                path: this.dataSubscribePath(key),
                err: () => {
                    throw new Error(
                        `Tome-${this.type}: the store being used has been removed, or your access has been revoked.`
                    )
                },
                event: (value: string) => {
                    if (value !== null) {
                        // TODO do we need this?
                        if (value.constructor !== String) {
                            value = JSON.parse(value)
                        }
                        this.cache.set(key, value)
                    } else {
                        this.cache.delete(key)
                    }
                },
                quit: async () => await this._getValueFromUrbit(key),
            })
            .then(async (id) => {
                await this.api.unsubscribe(id)
                return this.cache.get(key)
            })
    }

    // TODO - does this have race conditions?
    private async _getAllFromUrbit(): Promise<Map<string, Value>> {
        return await this.api
            .subscribe({
                app: agent,
                path: this.dataSubscribePath(),
                err: () => {
                    throw new Error(
                        `Tome-${this.type}: the store being used has been removed, or your access has been revoked.`
                    )
                },
                event: (data: Value) => {
                    const entries: Array<[string, string]> =
                        Object.entries(data)
                    const newCache = new Map<string, Value>()
                    for (let [key, value] of entries) {
                        // TODO foreign strings are getting stripped of their quotes? This is a workaround.
                        if (value.constructor !== String) {
                            value = JSON.parse(value)
                        }
                        newCache.set(key, value)
                    }
                    this.cache = newCache
                },
                quit: async () => await this._getAllFromUrbit(),
            })
            .then(async (id) => {
                await this.api.unsubscribe(id)
                return this.cache
            })
    }
}
