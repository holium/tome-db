import { DataStore, InitStoreOptions } from '../../index'
import { agent, storeMark, localKvPrefix } from '../constants'

const type = 'kv'

export class KeyValueStore extends DataStore {
    public constructor(options?: InitStoreOptions) {
        if (typeof options !== 'undefined') {
            super(options)
        } else {
            super()
        }
    }

    /**
     * Set a key-value pair in the store.
     * @param key The key to set.
     * @param value The JSON value to associate with the key.
     * @returns true if successful, false if not.
     */
    public async set(key: string, value: JSON): Promise<boolean> {
        if (!key) {
            console.error('missing key parameter')
            return false
        }
        if (
            value.constructor != Array &&
            value.constructor != String &&
            value.constructor != Object
        ) {
            console.error('value must be valid JSON')
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
            if (this.tomeShip === this.thisShip) {
                await this.api.poke({
                    app: agent,
                    mark: storeMark,
                    json: {
                        'set-value': {
                            ship: this.tomeShip,
                            space: this.space,
                            app: this.app,
                            bucket: this.bucket,
                            key: key,
                            value: valueStr,
                        },
                    },
                    onSuccess: () => {
                        this.cache.set(key, value)
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
                        threadName: 'poke-tunnel',
                        body: {
                            ship: this.tomeShip,
                            json: JSON.stringify({
                                'set-value': {
                                    ship: this.tomeShip,
                                    space: this.space,
                                    app: this.app,
                                    bucket: this.bucket,
                                    key: key,
                                    value: valueStr,
                                },
                            }),
                        },
                    })
                    .catch((e) => {
                        console.error(
                            'Failed to add key-value pair to the Store.'
                        )
                        return undefined
                    })
                success = result === 'success'
                if (success) {
                    this.cache.set(key, value)
                }
            }
            return success
        }
    }

    /**
     * Remove a specific key-value pair from the store.
     * @param key The key to remove.
     * @returns True if an element in the Store existed and has been removed, or false if the element does not exist.
     */
    public async remove(key: string): Promise<boolean> {
        if (!key) {
            console.error('missing key parameter')
            return
        }

        if (!this.mars) {
            localStorage.removeItem(localKvPrefix + key)
            return true
        } else {
            await this.waitForReady()
            let success = false
            if (this.tomeShip === this.thisShip) {
                await this.api.poke({
                    app: agent,
                    mark: storeMark,
                    json: {
                        'remove-value': {
                            ship: this.tomeShip,
                            space: this.space,
                            app: this.app,
                            bucket: this.bucket,
                            key: key,
                        },
                    },
                    onSuccess: () => {
                        this.cache.delete(key)
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
                        threadName: 'poke-tunnel',
                        body: {
                            ship: this.tomeShip,
                            json: JSON.stringify({
                                'remove-value': {
                                    ship: this.tomeShip,
                                    space: this.space,
                                    app: this.app,
                                    bucket: this.bucket,
                                    key: key,
                                },
                            }),
                        },
                    })
                    .catch((e) => {
                        console.error(
                            'Failed to remove key-value pair from the Store.'
                        )
                        return undefined
                    })
                success = result === 'success'
                if (success) {
                    this.cache.delete(key)
                }
            }
            return success
        }
    }

    /**
     * Discard all values in the store.
     * @returns True on success, false on failure.
     */
    public async clear(): Promise<boolean> {
        if (!this.mars) {
            // TODO - if we're only wiping a bucket, this might be the wrong method.
            localStorage.clear()
            return true
        } else {
            await this.waitForReady()
            let success = false
            if (this.tomeShip === this.thisShip) {
                await this.api.poke({
                    app: agent,
                    mark: storeMark,
                    json: {
                        'clear-kv': {
                            ship: this.tomeShip,
                            space: this.space,
                            app: this.app,
                            bucket: this.bucket,
                        },
                    },
                    onSuccess: () => {
                        this.cache.clear()
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
                        threadName: 'poke-tunnel',
                        body: {
                            ship: this.tomeShip,
                            json: JSON.stringify({
                                'clear-kv': {
                                    ship: this.tomeShip,
                                    space: this.space,
                                    app: this.app,
                                    bucket: this.bucket,
                                },
                            }),
                        },
                    })
                    .catch((e) => {
                        console.error('Failed to clear Store.')
                        return undefined
                    })
                success = result === 'success'
                if (success) {
                    this.cache.clear()
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
    ): Promise<JSON> {
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
                if (value) {
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

    // TODO - does this have race conditions?
    private async _getValueFromUrbit(key: string): Promise<JSON> {
        return await this.api
            .subscribe({
                app: agent,
                path: this.dataSubscribePath(key),
                err: () => {
                    throw new Error(
                        'Tome-KV: the key-value store being used has been removed, or your access has been revoked.'
                    )
                },
                event: (value: string) => {
                    if (value !== null) {
                        this.cache.set(key, JSON.parse(value))
                    } else {
                        this.cache.delete(key)
                    }
                },
                quit: () => this._getValueFromUrbit(key),
            })
            .then(async (id) => {
                await this.api.unsubscribe(id)
                return this.cache.get(key)
            })
    }

    /**
     * Get all key-value pairs in the store.
     * @param useCache return the cache instead of querying Urbit.  Only relevant if preload was set to false.
     * @returns A map of all key-value pairs in the store.
     */
    public async all(useCache: boolean = false): Promise<Map<string, JSON>> {
        if (!this.mars) {
            const map = new Map<string, JSON>()
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
            } else {
                if (useCache) {
                    return this.cache
                }
                return await this._getAllFromUrbit()
            }
        }
    }

    // TODO - does this have race conditions?
    private async _getAllFromUrbit(): Promise<Map<string, JSON>> {
        return await this.api
            .subscribe({
                app: agent,
                path: this.dataSubscribePath(),
                err: () => {
                    throw new Error(
                        'Tome-KV: the key-value store being used has been removed, or your access has been revoked.'
                    )
                },
                event: (data: JSON) => {
                    const entries: [string, string][] = Object.entries(data)
                    const newCache = new Map<string, JSON>()
                    for (const [key, value] of entries) {
                        newCache.set(key, JSON.parse(value))
                    }
                    this.cache = newCache
                },
                quit: () => this._getAllFromUrbit(),
            })
            .then(async (id) => {
                await this.api.unsubscribe(id)
                return this.cache
            })
    }
}
