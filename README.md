---
description: Urbit's web3 and composability bridge
---

# TomeDB

TomeDB is an **Urbit database and JavaScript client package** with native permissioning and subscription support.  With TomeDB, developers can build full-stack Urbit applications entirely in JavaScript **(no Hoon)**.  Tome currently supports multiple storage types, including key-value, log, and feed.

## **Features**

* _Designed for migration from preexisting dApps_:  With the key-value store, TomeDB can dynamically use JavaScript local storage if an Urbit connection is not made. This means that developers can prepare and **distribute applications both on and off Urbit from a single codebase**.
* _Enables app composability_:  With Urbit, your users' data is theirs, forever.  Applications using TomeDB can directly read and write from other data stores, with the simplicity of saving files to disk.
* _Preload, caching, and callback system_:  TomeDB supports both preloading and caching values directly in JavaScript, reducing the number of requests to Urbit and making it easy to deliver a snappy user experience.  Callback functions are also provided to make re-rendering and state management a breeze.
* _Fully integrated and modular permissions_:  Developers can specify exactly which users or groups have read / write / overwrite access for each data store.
* _Bootstraps Automatically_:  Applications using TomeDB will create and set access to data stores on launch - no user or developer configuration required.

## Example

Here’s a simple example of setting and retrieving a value with Tome and an Urbit connection:

```tsx
import Urbit from '@urbit/http-api'
import Tome from '@holium/tome-db'

const api = new Urbit('', '', window.desk)
api.ship = window.ship

const db = await Tome.init(api)
const store = await db.keyvalue()

const result = await store.set('foo', 'bar')
// result === true

const value = await store.get('foo')
// value === 'bar'
```

## Limitations

* TomeDB currently cannot support large datasets or concurrent user counts.  All data is stored and delivered by the host ship, whose max capacity is \~2-8 GB.  Future plans include support for load balancing and data distribution.
* Data stores are somewhat static (key-value, log, or feed). TomeDB is not a full graph or relational database replacement.  It can still be useful for rapid prototyping, however.

## Quick Links

* [How to install](https://tomedb.gitbook.io/tomedb/quick-start)
* [GitHub](https://github.com/holium/tome-db)
* [Documentation](https://tomedb.gitbook.io/tomedb/)
* [Example application](https://github.com/ajlamarc/racket)
* [Report bugs or request new features](https://github.com/holium/tome-db/issues)
