type Level = 'our' | 'space' | 'open' | 'unset' | 'yes' | 'no'
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
}
