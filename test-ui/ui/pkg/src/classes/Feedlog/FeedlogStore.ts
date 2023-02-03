import {
    Content,
    DataStore,
    FeedlogEntry,
    InitStoreOptions,
    Value,
} from '../../index'
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
        const action = id === undefined ? 'new-post' : 'edit-post'
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
                id,
                content: contentStr,
            },
        }
        if (this.tomeShip === this.thisShip) {
            await this.api.poke({
                app: agent,
                mark: feedMark,
                json,
                onSuccess: () => {
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
        const action =
            value !== undefined ? 'set-post-link' : 'remove-post-link'
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
                id,
            },
        }
        if (action === 'set-post-link') {
            json[action].value = JSON.stringify(value)
        }
        if (this.tomeShip === this.thisShip) {
            await this.api.poke({
                app: agent,
                mark: feedMark,
                json,
                onSuccess: () => {
                    success = true
                },
                onError: () => {
                    console.error(
                        `Tome-${this.name}: Failed to modify link in the ${this.name}.`
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
                        `Tome-${this.name}: Failed to modify link in the ${this.name}.`
                    )
                    return undefined
                })
            success = result === 'success'
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
                id,
            },
        }
        if (this.tomeShip === this.thisShip) {
            await this.api.poke({
                app: agent,
                mark: feedMark,
                json,
                onSuccess: () => {
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
                json,
                onSuccess: () => {
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
        }
        return success
    }

    public async get(
        id: string,
        allowCachedValue: boolean = true
    ): Promise<Content | undefined> {
        if (!validate(id)) {
            console.error('Invalid ID.')
            return undefined
        }
        await this.waitForReady()
        if (allowCachedValue) {
            const index = this.order.indexOf(id)
            if (index !== undefined) {
                return this.feedlog[index]
            }
        }
        if (this.preload) {
            await this.waitForLoaded()
            const index = this.order.indexOf(id)
            if (index === undefined) {
                console.error(`id ${id} not found`)
                return undefined
            }
            return this.feedlog[index]
        } else {
            return await this._getValueFromUrbit(id)
        }
    }

    public async all(useCache: boolean = false): Promise<Content[]> {
        await this.waitForReady()
        if (this.preload) {
            await this.waitForLoaded()
            return this.feedlog
        }
        if (useCache) {
            return this.feedlog
        }
        return await this._getAllFromUrbit()
    }

    // TODO just make this a scry (same for get and for KVStore)
    // TODO - does this have race conditions?
    private async _getAllFromUrbit(): Promise<Content[]> {
        return await this.api
            .subscribe({
                app: agent,
                path: this.dataSubscribePath(),
                err: () => {
                    throw new Error(
                        `Tome-${this.type}: the store being used has been removed, or your access has been revoked.`
                    )
                },
                event: (data: FeedlogEntry[]) => {
                    // TODO loop over feedlog and add ids to order
                    this.feedlog = data
                },
                quit: async () => await this._getAllFromUrbit(),
            })
            .then(async (id) => {
                await this.api.unsubscribe(id)
                return this.feedlog
            })
    }

    // TODO - does this have race conditions?
    private async _getValueFromUrbit(id: string): Promise<Content> {
        return await this.api
            .subscribe({
                app: agent,
                path: this.dataSubscribePath(id),
                err: () => {
                    throw new Error(
                        `Tome-${this.type}: the store being used has been removed, or your access has been revoked.`
                    )
                },
                event: (value: string) => {
                    // TODO
                    console.log(value)
                },
                quit: async () => await this._getValueFromUrbit(id),
            })
            .then(async (id) => {
                await this.api.unsubscribe(id)
                return 'placeholder!'
            })
    }

    // other useful methods
    // iterator(page_size = 50) or equivalent for a paginated query
    // since(time: xxx) - returns all posts since time?
}
