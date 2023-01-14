## Client Design

```js
import Tome from '@holium/tome-db'

const api = new Urbit('', '', window.desk)
api.ship = window.ship

// If we're running in a space, Tome should find the space, app, and ship associated and set those by default.  Going to need some tuning on the defaults here (likely contact our spaces agent).
const db = await Tome.init(api, {
    ship: 'lomder-librun' // sig will be automatically removed
    space: 'Realm Forerunners',
    app: 'Lexicon', // "app", "agent", "desk" are all synonymous here. This is for keeping data separate from other applications / desks.
    permissions: { read: 'space', write: 'our', overwrite: 'our' }, // this is just a default to use for subclasses.  It's not persisted in Urbit
})

// if no api, it uses localStorage instead.

// current defaults:
// no ship = our ship
// no space = "our" space (personal space?)
// no app = "all" apps.  A %settings-store replacement for Realm
// no permissions: { read: 'space', create: 'our', overwrite: 'our' }

const appPreferences = db.keyvalue({
    bucket: 'app.preferences',
    permissions: ..., // if not set, uses the Tome specified permissions
    preload: true, // preload and cache the bucket values.  (Improve response time.)
})

// use the 'def' bucket if none is specified.
const kv = db.keyvalue()

appPreferences.set('theme', 'dark')
res = appPreferences.get('theme')
//  remove, clear, all..
```

## Backend Design

See sur/tome.hoon for context on backend data structures.

## Permissioning:

### Permission types:

`read`: can view everything in the store, log, feed, etc.

`write`: can add to the store, log, feed. Edit or delete _your own_ values, if supported.

`admin`: can add, edit, or delete anything as supported.

### Permission levels:

`our`: any desk on our ship.

`team`: our ship, or any moon of us.

`space`: all space members.

`open`: anyone on the network.

Invites are stored as separate whitelists / blacklists, and used in addition to the specified permission level.
To use only a list of invited peers, set the relevant permission level to `our`.
