import { InitStoreOptions } from '../../types'
import { FeedlogStore } from './FeedlogStore'

export class FeedStore extends FeedlogStore {
    constructor(options: InitStoreOptions) {
        super(options)
    }
}
