import { Value } from '../../index'
import { agent, feedMark, feedThread } from '../constants'
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
        await this.waitForReady()
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
            // @ts-expect-error
            json[action].value = JSON.stringify(value)
        }
        if (this.tomeShip === this.ourShip) {
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
            try {
                const result = await this.api.thread({
                    inputMark: 'json',
                    outputMark: 'json',
                    threadName: feedThread,
                    body: {
                        ship: this.tomeShip,
                        json: JSON.stringify(json),
                    },
                })
                const success = result === 'success'
                if (!success) {
                    console.warn(
                        `Tome-${this.name}: Failed to modify link in the ${this.name}. Checking perms...`
                    )
                    this.getCurrentForeignPerms()
                }
            } catch (e) {
                console.warn(
                    `Tome-${this.name}: Failed to modify link in the ${this.name}. Checking perms...`
                )
                this.getCurrentForeignPerms()
            }
        }
        return success
    }

    public async setLink(id: string, value: Value): Promise<boolean> {
        return await this._setOrRemoveLink(id, value)
    }

    public async removeLink(id: string): Promise<boolean> {
        return await this._setOrRemoveLink(id)
    }
}
