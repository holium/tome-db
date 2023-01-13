type Level = 'our' | 'team' | 'space' | 'open'
export interface Perm {
    read: Level
    create: Level
    overwrite: Level
}

export interface TomeOptions {
    ship?: string
    space?: string
    app?: string
    permissions?: Perm
}
