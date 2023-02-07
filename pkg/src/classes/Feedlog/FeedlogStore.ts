import { Content, DataStore, FeedlogEntry, InitStoreOptions } from '../../index'
import { agent } from '../constants'
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
        return await this.pokeOrTunnel({
            json,
            onSuccess: () => {
                // cache somewhere?
                return id
            },
            onError: () => {
                console.error(
                    `Tome-${this.name}: Failed to save content to the ${this.name}. Checking perms...`
                )
                this.getCurrentForeignPerms()
                return undefined
            },
        })
    }

    /**
     * Add a new post to the feedlog.  Automatically stores the creation time and author.
     *
     * @param content The Content to post to the feedlog.
     * Can be a string, number, boolean, Array, or JSON.
     * @returns The post ID on success, undefined on failure.
     */
    public async post(content: Content): Promise<string | undefined> {
        return await this._postOrEdit(content)
    }

    /**
     * Edit a post in the feedlog.  Automatically stores the updated time and author.
     *
     * @param id The ID of the post to edit.
     * @param newContent The newContent to replace with.
     * Can be a string, number, boolean, Array, or JSON.
     * @returns The post ID on success, undefined on failure.
     */
    public async edit(
        id: string,
        newContent: Content
    ): Promise<string | undefined> {
        return await this._postOrEdit(newContent, id)
    }

    /**
     * Delete a post from the feedlog.  If the post with ID does not exist, returns true.
     *
     * @param id The ID of the post to delete.
     * @returns true on success, false on failure.
     */
    public async delete(id: string): Promise<boolean> {
        if (!validate(id)) {
            console.error('Invalid ID.')
            return false
        }
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
        return await this.pokeOrTunnel({
            json,
            onSuccess: () => {
                // cache somewhere?
                return true
            },
            onError: () => {
                console.error(
                    `Tome-${this.name}: Failed to delete post from ${this.name}. Checking perms...`
                )
                this.getCurrentForeignPerms()
                return false
            },
        })
    }

    /**
     * Clear all posts from the feedlog.
     *
     * @returns true on success, false on failure.
     */
    public async clear(): Promise<boolean> {
        const json = {
            'clear-feed': {
                ship: this.tomeShip,
                space: this.space,
                app: this.app,
                bucket: this.bucket,
                log: this.isLog,
            },
        }
        return await this.pokeOrTunnel({
            json,
            onSuccess: () => {
                // cache somewhere?
                return true
            },
            onError: () => {
                console.error(
                    `Tome-${this.name}: Failed to clear ${this.name}. Checking perms...`
                )
                this.getCurrentForeignPerms()
                return false
            },
        })
    }

    /**
     * Get the post from the feedlog with the given ID.
     *
     * @param id The ID of the post to retrieve.
     * @param allowCachedValue If true, will return the cached value if it exists.
     * If false, will always fetch from Urbit.  Defaults to true.
     * @returns A FeedlogEntry on success, undefined on failure.
     */
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
            if (index > -1) {
                return this.feedlog[index]
            }
        }
        if (this.preload) {
            await this.waitForLoaded()
            const index = this.order.indexOf(id)
            if (index === -1) {
                console.error(`id ${id} not found`)
                return undefined
            }
            return this.feedlog[index]
        } else {
            return await this._getValueFromUrbit(id)
        }
    }

    /**
     * Retrieve all posts from the feedlog, sorted by newest first.
     *
     * @param useCache If true, return the current cache instead of querying Urbit.
     * Only relevant if preload was set to false.  Defaults to false.
     * @returns A FeedlogEntry on success, undefined on failure.
     */
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

    private async _getValueFromUrbit(id: string): Promise<Content> {
        try {
            let post = await this.api.scry({
                app: agent,
                path: this.dataPath(id),
            })
            if (post === null) {
                return undefined
            }
            post = this.parseFeedlogEntry(post)
            const index = this.order.indexOf(id)
            if (index === -1) {
                // TODO find the actual right place to insert this (based on times)?
                this.order.unshift(id)
                this.feedlog.unshift(post)
            } else {
                this.feedlog[index] = post
            }
            return post
        } catch (e) {
            throw new Error(
                `Tome-${this.type}: the store being used has been removed, or your access has been revoked.`
            )
        }
    }

    private async _getAllFromUrbit(): Promise<Content[]> {
        try {
            const data = await this.api.scry({
                app: agent,
                path: this.dataPath(),
            })
            // wipe and replace feedlog
            this.order.length = 0
            this.feedlog = data.map((entry: FeedlogEntry) => {
                this.order.push(entry.id)
                return this.parseFeedlogEntry(entry)
            })
            return this.feedlog
        } catch (e) {
            throw new Error(
                `Tome-${this.type}: the store being used has been removed, or your access has been revoked.`
            )
        }
    }

    // other useful methods
    // iterator(page_size = 50) or equivalent for a paginated query
    // since(time: xxx) - returns all posts since time?
}
