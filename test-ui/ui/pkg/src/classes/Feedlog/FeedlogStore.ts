import { DataStore, InitStoreOptions } from '../../index'
import { agent, feedMark, feedThread } from '../constants'
import { v4 as uuid, validate } from 'uuid'

export abstract class FeedlogStore extends DataStore {
    name: 'feed' | 'log'

    constructor(options: InitStoreOptions) {
        super(options)
        options.isLog ? (this.name = 'log') : (this.name = 'feed')
    }

    private async _postOrEdit(content: JSON, id?: string) {
        let action = typeof id === undefined ? 'new-post' : 'edit-post'
        if (action === 'new-post') {
            id = uuid()
        } else {
            if (!validate(id)) {
                console.error('Invalid ID.')
                return false
            }
        }
        if (
            content.constructor != Array &&
            content.constructor != String &&
            content.constructor != Object
        ) {
            console.error('content must be valid JSON')
            return false
        }
        const contentStr = JSON.stringify(content)
        await this.waitForReady()
        // maybe set in the cache, return, and poke / retry as necesssary?
        let success = false
        const json = {
            [action]: {
                ship: this.tomeShip,
                space: this.space,
                app: this.app,
                bucket: this.bucket,
                log: this.isLog,
                id: id,
                content: contentStr,
            },
        }
        if (this.tomeShip === this.thisShip) {
            await this.api.poke({
                app: agent,
                mark: feedMark,
                json: json,
                onSuccess: () => {
                    this.cache.set(id, content)
                    success = true
                },
                onError: () => {
                    console.error(
                        `Tome-${this.name}: Failed to save content to the ${this.name}.`
                    )
                },
            })
        } else {
            // Tunnel poke to Tome ship
            const result = await this.api
                .thread({
                    inputMark: 'json',
                    outputMark: 'json',
                    threadName: feedThread,
                    body: {
                        ship: this.tomeShip,
                        json: JSON.stringify(json),
                    },
                })
                .catch(() => {
                    console.error(
                        `Tome-${this.name}: Failed to save content to the ${this.name}.`
                    )
                    return undefined
                })
            success = result === 'success'
            if (success) {
                this.cache.set(id, content)
            }
        }
        return success
    }

    private async _setOrRemoveLink(id: string, value?: JSON) {
        if (!validate(id)) {
            console.error('Invalid ID.')
            return false
        }
        let action =
            typeof value !== undefined ? 'set-post-link' : 'remove-post-link'
        if (action === 'set-post-link') {
            if (
                value.constructor != Array &&
                value.constructor != String &&
                value.constructor != Object
            ) {
                console.error('value must be valid JSON')
                return false
            }
        }
        await this.waitForReady()
        // maybe set in the cache, return, and poke / retry as necesssary?
        let success = false
        const json = {
            [action]: {
                ship: this.tomeShip,
                space: this.space,
                app: this.app,
                bucket: this.bucket,
                log: this.isLog,
                id: id,
            },
        }
        if (action === 'set-post-link') {
            json[action]['value'] = JSON.stringify(value)
        }
        if (this.tomeShip === this.thisShip) {
            await this.api.poke({
                app: agent,
                mark: feedMark,
                json: json,
                onSuccess: () => {
                    // TODO update cache with reactions
                    // this.cache.set(id, value)
                    success = true
                },
                onError: () => {
                    console.error(
                        `Tome-${this.name}: Failed to save content to the ${this.name}.`
                    )
                },
            })
        } else {
            // Tunnel poke to Tome ship
            const result = await this.api
                .thread({
                    inputMark: 'json',
                    outputMark: 'json',
                    threadName: feedThread,
                    body: {
                        ship: this.tomeShip,
                        json: JSON.stringify(json),
                    },
                })
                .catch(() => {
                    console.error(
                        `Tome-${this.name}: Failed to save content to the ${this.name}.`
                    )
                    return undefined
                })
            success = result === 'success'
            if (success) {
                // TODO update cache with reactions
                // this.cache.set(id, value)
            }
        }
        return success
    }

    public async post(content: JSON): Promise<boolean> {
        return await this._postOrEdit(content)
    }

    public async edit(id: string, newContent: JSON): Promise<boolean> {
        return await this._postOrEdit(newContent, id)
    }

    public async setLink(id: string, value: JSON): Promise<boolean> {
        return await this._setOrRemoveLink(id, value)
    }

    public async removeLink(id: string): Promise<boolean> {
        return await this._setOrRemoveLink(id)
    }

    public async delete(id: string): Promise<boolean> {
        if (!validate(id)) {
            console.error('Invalid ID.')
            return false
        }
        await this.waitForReady()
        let success = false
        const json = {
            'delete-post': {
                ship: this.tomeShip,
                space: this.space,
                app: this.app,
                bucket: this.bucket,
                log: this.isLog,
                id: id,
            },
        }
        if (this.tomeShip === this.thisShip) {
            await this.api.poke({
                app: agent,
                mark: feedMark,
                json: json,
                onSuccess: () => {
                    this.cache.delete(id)
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
                    threadName: feedThread,
                    body: {
                        ship: this.tomeShip,
                        json: JSON.stringify(json),
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
                this.cache.delete(id)
            }
        }
        return success
    }

    public async clear(): Promise<boolean> {
        await this.waitForReady()
        let success = false
        const json = {
            'clear-feed': {
                ship: this.tomeShip,
                space: this.space,
                app: this.app,
                bucket: this.bucket,
                log: this.isLog,
            },
        }
        if (this.tomeShip === this.thisShip) {
            await this.api.poke({
                app: agent,
                mark: feedMark,
                json: json,
                onSuccess: () => {
                    this.cache.clear()
                    success = true
                },
                onError: () => {
                    console.error(
                        `Tome-${this.name}: Failed to clear ${this.name}.`
                    )
                },
            })
        } else {
            // Tunnel poke to Tome ship
            const result = await this.api
                .thread({
                    inputMark: 'json',
                    outputMark: 'json',
                    threadName: feedThread,
                    body: {
                        ship: this.tomeShip,
                        json: JSON.stringify(json),
                    },
                })
                .catch(() => {
                    console.error(
                        `Tome-${this.name}: Failed to clear ${this.name}.`
                    )
                    return undefined
                })
            success = result === 'success'
            if (success) {
                this.cache.clear()
            }
        }
        return success
    }

    // is this method even useful?
    public async get(id: string): Promise<JSON> {
        if (!validate(id)) {
            console.error('Invalid ID.')
            return undefined
        }
        return await this.retrieveOne(id)
    }

    public async all(useCache: boolean = false): Promise<Map<string, JSON>> {
        return await this.retrieveAll(useCache)
    }

    // other useful methods
    // iterator(page_size = 50) or equivalent for a paginated query
    // since(time: xxx) - returns all posts since time?
}
