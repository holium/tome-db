# Key-value API

## Types

```typescript
// store any valid primitive JS type.
// Maintains type on retrieval.
type Value = string | number | boolean | object | Value[]
```

## Methods

### `set`

`kv.set(key: string, value: Value)`

**Params**: a `key` and corresponding `value`.

**Returns**: A promise resolving to <mark style="color:red;">`true`</mark> on success or <mark style="color:red;">`false`</mark> on failure.

Set a key-value pair in the store.  Overwrites existing values.

```typescript
await kv.set('complex', { foo: ['bar', 3, true] })
```

### `get`

`kv.get(key: string, allowCachedValue: boolean = true)`

**Params**: A `key` to retrieve.  If `allowCachedValue` is <mark style="color:red;">`true`</mark>, we will check the cache before querying Urbit.

**Returns**: A promise resolving to a <mark style="color:blue;">`Value`</mark> or <mark style="color:blue;">`undefined`</mark> if the key does not exist.

Get the value associated with a key in the store.

```typescript
await kv.get('foo')
```

### `remove`

`kv.remove(key: string)`

**Params**: a `key` to remove.

**Returns**: A promise resolving to <mark style="color:red;">`true`</mark> on success or <mark style="color:red;">`false`</mark> on failure.

Remove a key-value pair from the store.  If the `key` does not exist, returns <mark style="color:red;">`true`</mark>.

```typescript
await kv.remove('foo')
```

### `clear`

`kv.clear()`

**Returns**: A promise resolving to <mark style="color:red;">`true`</mark> on success or <mark style="color:red;">`false`</mark> on failure.

Clear all key-value pairs from the store.

```typescript
await kv.clear()
```

### `all`

`kv.all(useCache: boolean = false)`

**Params**: If `useCache` is <mark style="color:red;">`true`</mark>, return the current cache instead of querying Urbit.  Only relevant if `preload` was set to <mark style="color:red;">`false`</mark>.

**Returns**: A promise resolving to a <mark style="color:blue;">`Map<string, Value>>`</mark>

Get all key-value pairs in the store.

```typescript
await kv.all()
```
