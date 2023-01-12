type Level = 'our' | 'team' | 'space' | 'open'
export interface Perm {
    read: Level
    create: Level
    overwrite: Level
}
