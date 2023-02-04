import { Value } from '../../index'
import { validate } from 'uuid'
import { FeedlogStore } from './FeedlogStore'
export class FeedStore extends FeedlogStore {
    private async _setOrRemoveLink(
        id: string,
        value?: Value
    ): Promise<boolean> {
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
            json[action].value = JSON.stringify(value)
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

    public async setLink(id: string, value: Value): Promise<boolean> {
        return await this._setOrRemoveLink(id, value)
    }

    public async removeLink(id: string): Promise<boolean> {
        return await this._setOrRemoveLink(id)
    }
}
