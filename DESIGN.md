## Client Design

```js
import Tome from '@holium/tome-db'

const api = new Urbit('', '', window.desk)
api.ship = window.ship

const db = await Tome(api, {
    ship: '~lomder-librun'
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

const store = db.kvstore()

store.set('theme', 'dark')
res = store.get('theme')
//  remove, clear, all..

// TODO methods for adding upvotes, downvotes, links, etc. if supported
```

## Backend Design

```hoon
:: permissions:   {space: {app: [...permissions]}}
:: kv:            {space: {app: {...keys, ...values}}
:: log:           {space: {app: <log>}
:: feed:          {space: {app: <feed>}

+$  space  @t :: space name.  if no space this is 'our'
+$  app  @t   :: app name (reduce namespace collisions).  if no app this is 'all'
+$  key  @t   :: key name
+$  metadata
  $:  created-by=@p       :: who initially stored this
      updated-by=@p       :: who last updated this
      created-at=@da      :: time of creation
      updated-at=@da      :: time of last update
      :: maybe support these, if spaces-enabled apps would use them frequently
      upvotes=(set @p)    :: set of people who have downvoted
      downvotes=(set @p)  :: set of people who have upvoted
      related=(set key)    :: keys of related values
  ==
+$  value  (pair metadata @t)
```

Apps require unique "keys" in the kvstore: can maybe get away with a title or user-specified key,
or generate one in the frontend.

## Permissioning:

### Permission types:

`read`: can view everything in the store, log, feed, etc.

`create`: can add to the store, log, feed. Edit or delete _your own_ values, if supported.

`overwrite`: can add, edit, or delete anything as supported.

### Permission levels:

`our`: any desk on our ship.

`team`: our ship, or any moon of us.

`invited`: list of @ps.

`space`: all space members.

`open`: anyone on the network.
