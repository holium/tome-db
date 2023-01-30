import { Content, DataStore, InitStoreOptions, Value } from '../../index'
import { agent, feedMark, feedThread } from '../constants'
import { v4 as uuid, validate } from 'uuid'

export abstract class FeedlogStore extends DataStore {
    name: 'feed' | 'log'

    constructor(options: InitStoreOptions) {
        super(options)
        options.isLog ? (this.name = 'log') : (this.name = 'feed')
    }

    private async _postOrEdit(
        content: Content,
        id?: string
    ): Promise<string | undefined> {
        let action = id === undefined ? 'new-post' : 'edit-post'
        if (action === 'new-post') {
            id = uuid()
        } else {
            if (!validate(id)) {
                console.error('Invalid ID.')
                return undefined
            }
        }
        if (!this.canStore(content)) {
            console.error('content is an invalid type.')
            return undefined
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
        if (success) {
            return id
        } else {
            return undefined
        }
    }

    private async _setOrRemoveLink(id: string, value?: Value) {
        if (!validate(id)) {
            console.error('Invalid ID.')
            return false
        }
        let action = value !== undefined ? 'set-post-link' : 'remove-post-link'
        if (action === 'set-post-link') {
            if (!this.canStore(value)) {
                console.error('value is an invalid type.')
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

    public async post(content: Content): Promise<string | undefined> {
        return await this._postOrEdit(content)
    }

    public async edit(
        id: string,
        newContent: Content
    ): Promise<string | undefined> {
        return await this._postOrEdit(newContent, id)
    }

    public async setLink(id: string, value: Value): Promise<boolean> {
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
    public async get(id: string): Promise<Content | undefined> {
        if (!validate(id)) {
            console.error('Invalid ID.')
            return undefined
        }
        return await this.retrieveOne(id)
    }

    public async all(useCache: boolean = false): Promise<Map<string, Content>> {
        return await this.retrieveAll(useCache)
    }

    // other useful methods
    // iterator(page_size = 50) or equivalent for a paginated query
    // since(time: xxx) - returns all posts since time?
}
