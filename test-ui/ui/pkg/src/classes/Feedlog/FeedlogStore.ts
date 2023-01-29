import Urbit from '@urbit/http-api'
import { Perm, Tome, DataStore } from '../../index'
import { agent, feedMark, tomeMark } from '../constants'

export abstract class FeedlogStore extends DataStore {}
