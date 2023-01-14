type Level = 'our' | 'team' | 'space' | 'open'
export interface Perm {
    read: Level
    write: Level
    admin: Level
}

export interface TomeOptions {
    ship?: string
    space?: string
    app?: string
    permissions?: Perm
}

export interface StoreOptions {
    bucket?: string
    permissions?: Perm
    preload?: boolean
}
