# Initializing Stores

## Permissions

It's recommended to specify `permissions` on either `Tome` or its subclasses.  The schema is:

```typescript
interface Perm {
    read: 'our' | 'space' | 'open'
    write: 'our' | 'space' | 'open'
    admin: 'our' | 'space' | 'open'
}
```

* `our` is our ship only (`src.bowl`)
* `space` is any ship in the current Holium space.  If Realm is not installed, this becomes `our`.
* `open` is anyone, including comets.

`read` / `write` / `admin` mean slightly different things based on the store type, so they will be described below.

## `Tome`

`Tome.init(api?: Urbit, app?: string, options?)`

* `api`: The optional Urbit connection to be used for requests.  If not set, TomeDB will attempt to use [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) for storing key-value pairs.
* `app`: An optional app name to store under.  Defaults to `'all'`.  It's recommended to set this to the name of your application (be wary of collisions, though!)

<details>

<summary>options</summary>

Optional `ship`, `space`, `agent`, `permissions`, and `realm` flag for initializing a Tome.

```typescript
options: {
    realm?: boolean = false
    ship?: string = api.ship
    space?: string = 'our'
    agent?: string = 'tome'
    permissions?: Perm
}
```

* `ship` can be specified with or without the `~`.
* `agent` specifies both the desk and agent name that the JavaScript client will use.  This is useful if you want to distribute a copy of TomeDB in the desk alongside your application.
* If `realm` is `false` , Tome will use `ship` and `space` as specified.
* If `realm` is `true`, `ship` and `space` must be either set together or not at all. &#x20;
  * If neither are set, Tome will automatically detect and use the current Realm space and corresponding host ship, as well as handle switching application data when a user changes spaces in Realm.
  * To create a "locked" Tome, specify `ship` and `space` together.  A locked Tome will work only in that specific space (think internal DAO tooling).

<!---->

* `permissions` is a default permissions level to be used by sub-classes.  When creating many store instances with the same permissions, simply specify them once here.

</details>

**Returns**: <mark style="color:blue;">`Promise<Tome>`</mark>

All storage types must be created from a `Tome` instance, so do this first.

```typescript
const api = new Urbit('', '', window.desk)
api.ship = window.ship

const db = await Tome.init(api, 'demo', {
    realm: true,
    ship: 'lomder-librun',
    space: 'Realm Forerunners',
    agent: 'tome',
    permissions: { read: 'space', write: 'space', admin: 'our' }
})
```

## `Key-value`

`db.keyvalue(options?)`

<details>

<summary>options</summary>

Optional `bucket`, `permissions`, `preload` flag, and callbacks for the key-value store.

```typescript
options: {
    bucket?: string = 'def'
    preload?: boolean = true
    permissions?: Perm
    onDataChange?: (data: Map<string, Value>()) => void
    onLoadChange?: (loaded: boolean) => void
    onReadyChange?: (ready: boolean) => void
    onWriteChange?: (write: boolean) => void
    onAdminChange?: (admin: boolean) => void
}
```

* `bucket` is the bucket name to store key-value pairs under.  If your app needs multiple key-value stores with different permissions, they should be different buckets.  Separating buckets can also save on download sizes depending on the application.
* `preload` is whether the client should fetch and cache all key-value pairs in the bucket, and subscribe to live updates.  This helps with responsiveness when using an application, since most requests won't go to Urbit.
* `permissions` is the permissions for the key-value store.  If not set, defaults to the Tome-level permissions.
  * `read` can read any key-value pairs from the bucket.
  * `write` can create new key-value pairs or update their own values.
  * `admin` can create or overwrite any values in the bucket.
* `onDataChange` is called whenever data in the key-value store changes, and can be used to re-render an application with new data.
* `onReadyChange` is called whenever the store changes `ready` state: after initial app configuration, and whenever a user changes between spaces in Realm.  Use combined with `preload` set to `false` to know when to show a loading screen, and when to start making requests.
* If preload is `true`, use `onLoadChange` instead to be notified when all data has been loaded and is addressable.  This also handles the case of switching between Realm spaces.
* `onWriteChange` and `onAdminChange` are called when the current user's `write` and `admin` permissions have been detected to change.

</details>

**Returns**: <mark style="color:blue;">`Promise<KeyValueStore>`</mark>

Initialize or connect to a key-value store.  It uses [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) if the corresponding `Tome` has no Urbit connection.

```typescript
const db = await Tome.init(api, 'demo', {
    realm: true
})

const kv = await db.keyvalue({
    bucket: 'preferences',
    permissions: { read: 'space', write: 'space', admin: 'our' },
    preload: true,
    onDataChange: setData,
    onReadyChange: setReady,
    onWriteChange: setWrite,
    onAdminChange: setAdmin
})
```

{% content-ref url="key-value-api.md" %}
[key-value-api.md](key-value-api.md)
{% endcontent-ref %}

## `Feed + Log`

`db.feed(options?)` or `db.log(options?)`

<details>

<summary>options</summary>

Optional `bucket`, `permissions`, `preload` flag, and callbacks for the log or feed store.

```typescript
options: {
    bucket?: string = 'def'
    preload?: boolean = true
    permissions?: Perm
    onDataChange?: (data: FeedlogEntry[]) => void
    onLoadChange?: (loaded: boolean) => void
    onReadyChange?: (ready: boolean) => void
    onWriteChange?: (write: boolean) => void
    onAdminChange?: (admin: boolean) => void
}
```

`permissions` is the permissions for the feedlog store.  If not set, defaults to the Tome-level permissions.

* `read` can read any posts and metadata from the bucket.
* For a `feed`, `write` can create or update their own posts / links.  For a `log`, `write` only allows creating new posts.
* `admin` can create or overwrite any posts / links in the bucket.

Refer to the options under [key-value](initializing-stores.md#key-value) for more information, as the rest are functionally identical.

</details>

**Returns**: <mark style="color:blue;">`Promise<FeedStore>`</mark> or <mark style="color:blue;">`Promise<LogStore>`</mark>

Initialize a feed or log store.  These must be created from a `Tome` with a valid Urbit connection. &#x20;

{% hint style="info" %}
`feed` and `log` are very similar, the only differences are:

* `write` for a log can't update any values.  This makes a log more similar to an "append-only" data structure.
* "Links" (comments, reactions, etc.) currently aren't supported for logs but are for feeds.
{% endhint %}

```typescript
const db = await Tome.init(api, 'demo', {
    realm: true
})

const feed = await db.feed({
    bucket: 'posts',
    preload: true,
    permissions: { read: 'space', write: 'space', admin: 'our' },
    onLoadChange: setLoaded,
    onDataChange: (data) => {
        // newest records first.
        // if you want a different order, you can sort the data here.
        // need to spread array to trigger re-render
        setData([...data])
    },
    onWriteChange: setWrite,
    onAdminChange: setAdmin
})
```

{% content-ref url="feed-+-log-api.md" %}
[feed-+-log-api.md](feed-+-log-api.md)
{% endcontent-ref %}
