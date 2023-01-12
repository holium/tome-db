## Client Design

```js
import Tome from '@holium/tome-db'

const api = new Urbit('', '', window.desk)
api.ship = window.ship

const db = await Tome(api, {
    ship: 'lomder-librun' // sig will be automatically removed
    space: 'Realm Forerunners',
    app: 'Lexicon',
    permissions: { read: 'space', create: 'space', overwrite: 'invited' },
})  // optional ship, space name, app, and permissions.

// if no api, it uses localStorage instead.

// no ship = our ship
// no space = "our" space (personal space?)
// no app = "all" apps.  A %settings-store replacement for Realm
// no permissions: { read: 'our', create: 'our', overwrite: 'our' }

db.addInvites({ overwrite: ['~lomder-librun', '~zod'] })
db.removeInvites({ overwrite: ['~zod'] })

const store = db.keyvalue()

store.set('theme', 'dark')
res = store.get('theme')
//  remove, clear, all..

// TODO methods for adding upvotes, downvotes, links, etc. if supported
```

## Backend Design

See sur/tome.hoon for context on backend data structures.

Apps require unique "keys" in their kvstore. If users are directly specifying keys, make sure they know which ones aren't already used

## Permissioning:

### Permission types:

`read`: can view everything in the store, log, feed, etc.

`create`: can add to the store, log, feed. Edit or delete _your own_ values, if supported.

`overwrite`: can add, edit, or delete anything as supported.

### Permission levels:

`our`: any desk on our ship.

`team`: our ship, or any moon of us.

`space`: all space members.

`open`: anyone on the network.

`invited`: This is **not** a real permissions level. Apps maintain a list of invites for the different types, which are used in addition to the permission level. To use only that list, set the level to `our`.

Future work could be to split this into separate whitelists / blacklists.
