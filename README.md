## Client Design

```js
import Tome from '@holium/tome-db'

const api = new Urbit('', '', window.desk)
api.ship = window.ship

// If we're running in a space, Tome finds the space and ship associated and sets those by default.
// If ship and space are hardcoded, the Tome is "locked" i.e. will throw an error if changed to outside the correct space. (maybe useful for DAO tools?)
// "app", "agent", "desk" are all synonymous here. This keeps data separate from other applications / desks.  If not set, it's a "free-for-all" a la Settings Store.
const db = await Tome.init(api, app: 'Lexicon', {
    ship: 'lomder-librun', // sig will be automatically removed
    space: 'Realm Forerunners',
    permissions: { read: 'space', write: 'our', overwrite: 'our' }, // this is just a default to use for subclasses.  It's not persisted in Urbit.
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
    preload: true, // preload and cache the bucket values.  (Improves response time.)
})

// uses 'def' as bucket name if none is specified.
const kv = db.keyvalue()

appPreferences.set('theme', 'dark')
res = appPreferences.get('theme')
//  remove, clear, all..
```

## Backend Design

### Subscriptions

Where `type` is one of `kv`, `log`, `feed`, etc:

`/${type}/${space}/${app}/${bucket}/perm`: Get whether you are a writer and/or admin.
NACK if can't read. Kicks after the first response.

If a poke errors, you should check this again to see if your privileges have been revoked.

`/kv/~${ship}/${space}/${app}/${bucket}/data/all`: Get all values and live updates.

`/kv/~${ship}/${space}/${app}/${bucket}/data/key/${key}`: Get the value of a key.

These don't exist yet:

`/kv/~${ship}/${space}/${app}/${bucket}/meta/all`: Get all metadata and live updates.

`/kv/~${ship}/${space}/${app}/${bucket}/meta/key/${key}`: Get the metadata of a key.

## Permissioning:

### Permission types:

`read`: can view everything in the store, log, feed, etc.

`write`: can add to the store, log, feed. Edit or delete _your own_ values, if supported.

`admin`: can add, edit, or delete anything as supported.

### Permission levels:

`our`: any desk on our ship.

`space`: all space members.

`open`: anyone on the network.

Invites are stored as separate whitelists / blacklists, and used in addition to the specified permission level.
To use only a list of invited peers, set the relevant permission level to `our`.

### Random notes

User-facing ship names will always be specified and returned without the leading sig. i.e. `zod` instead of `~zod`.

In the javascript client we store them as `'~zod'`, and in Hoon they are an @p.

## OLD

### Tome-level permissioning:

In the actual settings for a Realm space I'd like to eventually be able to set Tome's permissions like so:

`permissions: { visible: 'space', new: 'our' }`

Visible: who is allowed to know the Tome exists for a space, whether it has stores / logs / feeds, and what the names of them are. Visible does not mean they can actually read the values associated, however.

New: Who is allowed to create new apps and buckets in our space. In the default case, `our`, the space owner must download an app for it to be available to others. With a list of invites, any invited users could use an app in the space, and they would be allowed to initialize the necessary buckets for it to work.

New gives any of the listed ships ability to download apps that store arbitrary data on the host ship, so it should be admins only. This could tie into admins for a space.
