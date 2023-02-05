# Quick Start

## Client Install

{% tabs %}
{% tab title="Node" %}
```bash
# Install via NPM
npm install --save @holium/tome-db

# Install via Yarn
yarn add @holium/tome-db
```
{% endtab %}
{% endtabs %}

Pair with [create-landscape-app](https://github.com/urbit/create-landscape-app) for a bootstrapped React application to build Urbit apps from.

## Urbit Setup

Visit Urbit's [command-line install](https://urbit.org/getting-started/cli) page to install the binary for your system.  Afterwards, boot a fresh ship:

```hoon
$ ./urbit -F zod
... this can take a few minutes

~zod:dojo> |new-desk %tome
~zod:dojo> |mount %tome
```

Next, you'll need to copy the Tome desk into your ship:

```bash
$ git clone https://github.com/holium/tome-db
$ cp -R tome-db/desk/* zod/tome/
```

Finally, commit the Tome back-end:

```hoon
~zod:dojo> |commit %tome
```

If you want to develop a spaces-enabled application for [Realm](https://www.holium.com/) (currently in private alpha), you'll also need to configure the ship with Realm's desks.

## Basic Usage

### Key-value

```typescript
const db = await Tome.init(api, 'lexicon')
const kv = await db.keyvalue({
    bucket: 'preferences',
    permissions: { read: 'open', write: 'space', admin: 'our' },
    preload: false,
})

await kv.set('foo', 'bar')
await kv.set('complex', { foo: ['bar', 3, true] })
await kv.all()
await kv.remove('foo')
await kv.get('complex')
await kv.clear()
```

### Feed + Log

```typescript
// ... React app boilerplate
const [data, setData] = useState([])

const db = await Tome.init(api, 'racket')
// use db.log(...) for a log
const feed = await db.feed({
    preload: true,
    permissions: { read: 'space', write: 'space', admin: 'our' },
    onDataChange: (data) => {
        // data comes back sorted, newest entries first.
        // if you want a different order, you can sort the data here.
        setData([...data])
    },
})

const id = await feed.post(
    'https://pbs.twimg.com/media/FmHxG_UX0AACbZY?format=png&name=900x900'
)
await feed.edit(id, 'new-post-url')
await feed.setLink(id, {reaction: ':smile:', comment: 'amazing!'})
await feed.delete(id)
```
