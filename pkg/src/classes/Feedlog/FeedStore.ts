import { Content } from '../../index'
import { validate } from 'uuid'
import { FeedlogStore } from './FeedlogStore'
export class FeedStore extends FeedlogStore {
    private async _setOrRemoveLink(
        id: string,
        content?: Content
    ): Promise<boolean> {
        const action =
            typeof content !== 'undefined'
                ? 'set-post-link'
                : 'remove-post-link'
        if (action === 'set-post-link') {
            if (!this.canStore(content)) {
                console.error('value is an invalid type.')
                return false
            }
        }
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
            // @ts-expect-error
            json[action].value = JSON.stringify(content)
        }
        return await this.pokeOrTunnel({
            json,
            onSuccess: () => {
                // cache somewhere?
                return true
            },
            onError: () => {
                console.error(
                    `Tome-${this.name}: Failed to modify link in the ${this.name}.`
                )
                this.getCurrentForeignPerms()
                return false
            },
        })
    }

    /**
     * Associate a link with the feed post corresponding to ID.
     *
     * @param id The ID of the post to link to.
     * @param content The Content to associate with the post.
     * @returns true on success, false on failure.
     */
    public async setLink(id: string, content: Content): Promise<boolean> {
        if (!validate(id)) {
            console.error('Invalid ID.')
            return false
        }
        if (!this.mars) {
            const index = this.order.indexOf(id)
            if (index === -1) {
                console.error('Post does not exist.')
                return false
            }
            this.feedlog[index] = {
                ...this.feedlog[index],
                links: {
                    ...this.feedlog[index].links,
                    [this.ourShip]: content,
                },
            }
            localStorage.setItem(
                this.localDataPrefix(),
                JSON.stringify(this.feedlog)
            )
            this.dataUpdateCallback()
            return true
        }
        return await this._setOrRemoveLink(id, content)
    }

    /**
     * Remove the current ship's link to the feed post corresponding to ID.
     *
     * @param id The ID of the post to remove the link from.
     * @returns true on success, false on failure.  If the post with ID does not exist, returns true.
     */
    public async removeLink(id: string): Promise<boolean> {
        if (!validate(id)) {
            console.error('Invalid ID.')
            return false
        }
        if (!this.mars) {
            const index = this.order.indexOf(id)
            if (index === -1) {
                console.error('Post does not exist.')
                return false
            }
            this.feedlog[index] = {
                ...this.feedlog[index],
                // @ts-expect-error
                links: (({ [this.ourShip]: _, ...o }) => o)(
                    this.feedlog[index].links
                ), // remove data.body.ship
            }
            localStorage.setItem(
                this.localDataPrefix(),
                JSON.stringify(this.feedlog)
            )
            this.dataUpdateCallback()
            return true
        }
        return await this._setOrRemoveLink(id)
    }
}
