import Urbit from '@urbit/http-api'

type PermLevel = 'our' | 'space' | 'open' | 'unset' | 'yes' | 'no'
export type InviteLevel = 'read' | 'write' | 'admin' | 'block'
export type StoreType = 'kv' | 'feed'

type T = string | number | boolean | object | T[]
export type Value = object | object[] | T
export type Content = T | JSON

export type SubscribeUpdate = object | FeedlogEntry[] | FeedlogUpdate

export interface FeedlogUpdate {
    type: 'new' | 'edit' | 'delete' | 'clear'
}

export interface FeedlogEntry {
    id: string
    createdAt: number
    updatedAt: number
    createdBy: string
    updatedBy: string
    content: string
    links: object
}

export interface Perm {
    read: PermLevel
    write: PermLevel
    admin: PermLevel
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
    onDataChange?: (data: any) => void
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
    ourShip?: string
    locked?: boolean
    inRealm?: boolean
    preload?: boolean
    onReadyChange?: (ready: boolean) => void
    onWriteChange?: (write: boolean) => void
    onAdminChange?: (admin: boolean) => void
    onDataChange?: (data: any) => void
    write?: boolean
    admin?: boolean
}
