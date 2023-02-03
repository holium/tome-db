import { FeedlogStore } from './FeedlogStore'
import { InitStoreOptions } from '../../types'

export class LogStore extends FeedlogStore {
    constructor(options: InitStoreOptions) {
        super(options)
    }
}
