import Urbit from '@urbit/http-api'

type Level = 'our' | 'space' | 'open' | 'unset' | 'yes' | 'no'
export type StoreType = 'kv' | 'feed'

type T = string | number | boolean | object | Array<T>
export type Value = T | JSON
export type Content = T | JSON

export interface Perm {
    read: Level
    write: Level
    admin: Level
}

export interface TomeOptions {
    ship?: string
    space?: string
    permissions?: Perm
}

export interface StoreOptions {
    bucket?: string
    permissions?: Perm
    preload?: boolean
    onReadyChange?: (ready: boolean) => void
    onWriteChange?: (write: boolean) => void
    onAdminChange?: (admin: boolean) => void
}

export interface InitStoreOptions {
    api: Urbit
    tomeShip: string
    space: string
    app: string
    bucket?: string
    type?: StoreType
    isLog?: boolean
    perm?: Perm
    thisShip?: string
    locked?: boolean
    preload?: boolean
    onReadyChange?: (ready: boolean) => void
    onWriteChange?: (write: boolean) => void
    onAdminChange?: (admin: boolean) => void
    write?: boolean
    admin?: boolean
}
