# Feed + Log API

## Types

```typescript
// store any valid primitive JS type.
// Maintains type on retrieval.
type Content = string | number | boolean | object | Content[]

interface FeedlogEntry = {
    id: string
    createdAt: number
    updatedAt: number
    createdBy: string
    updatedBy: string
    content: Content
    links: object // authors as keys, Content as values
}
```

## Feedlog Methods

### `post`

`feedlog.post(content: Content)`

**Params**: `content` to post to the feedlog.

**Returns**: A promise resolving to a <mark style="color:blue;">`string`</mark> (the post ID) on success or <mark style="color:blue;">`undefined`</mark> on failure.

Add a new post to the feedlog.  Automatically stores the creation time and author.

```typescript
const id = await feedlog.post({ foo: ['bar', 3, true] })
```

### `edit`

`feedlog.edit(id: string, newContent: Content)`

**Params**: The `id` of the post to edit, and `newContent` to replace it with.

**Returns**: A promise resolving to a <mark style="color:blue;">`string`</mark> (the post ID) on success or <mark style="color:blue;">`undefined`</mark> on failure.

Edit a post in the feedlog.  Automatically stores the updated time and author.

```typescript
const id = await feedlog.post('original post')
if (id) {
    await feedlog.edit(id, 'edited post')
}
```

### `delete`

`feedlog.delete(id: string)`

**Params**: The `id` of the post to delete.

**Returns**: A promise resolving to <mark style="color:red;">`true`</mark> on success or <mark style="color:red;">`false`</mark> on failure.

Delete a post from the feedlog.  If the post with `id` does not exist, returns <mark style="color:red;">`true`</mark>.

```typescript
const id = await feedlog.post('original post')
if (id) {
    await feedlog.delete(id)
}
```

### `clear`

`feedlog.clear()`

**Returns**: A promise resolving to <mark style="color:red;">`true`</mark> on success or <mark style="color:red;">`false`</mark> on failure.

Clear all posts from the feedlog.

```typescript
await feedlog.clear()
```

### `get`

`feedlog.get(id: string, allowCachedValue: boolean = true)`

**Params**: The `id` of the post to retrieve.  If `allowCachedValue` is <mark style="color:red;">`true`</mark>, we will check the cache before querying Urbit.

**Returns**: A promise resolving to a <mark style="color:blue;">`FeedlogEntry`</mark> or <mark style="color:blue;">`undefined`</mark> if the post does not exist.

Get the post from the feedlog with the given `id`.

```typescript
await feedlog.get('foo')
```

### `all`

`feedlog.all(useCache: boolean = false)`

**Params**: If `useCache` is <mark style="color:red;">`true`</mark>, return the current cache instead of querying Urbit.  Only relevant if `preload` was set to <mark style="color:red;">`false`</mark>.

**Returns**: A promise resolving to a <mark style="color:blue;">`FeedlogEntry[]`</mark>

Retrieve all posts from the feedlog, sorted by newest first.

```typescript
await feedlog.all()
```

## Feed Methods

### `setLink`

`feed.setLink(id: string, content: Content)`

**Params**: The `id` of the post to link to, and the `content` to associate with it.

**Returns**: A promise resolving to <mark style="color:red;">`true`</mark> on success or <mark style="color:red;">`false`</mark> on failure.

Associate a "link" (comment, reaction, etc.) with the feed post corresponding to `id`.  Post links are stored as an object where keys are ship names and values are content.  `setLink` will overwrite the link for the current ship, so call `get` first if you would like to append.

```typescript
const id = await feedlog.post('original post')
if (id) {
    await feed.setLink(id, { comment: 'first comment!', time: Date.now() })
}
```

### `removeLink`

`feed.removeLink(id: string)`

**Params**: The `id` of the post to remove the link from.

**Returns**: A promise resolving to <mark style="color:red;">`true`</mark> on success or <mark style="color:red;">`false`</mark> on failure.

Remove the current ship's link to the feed post corresponding to `id`.  If the post with `id` does not exist, returns true.

```typescript
const id = await feedlog.post('original post')
if (id) {
    await feed.setLink(id, { comment: 'first comment!', time: Date.now() })
    await feed.removeLink(id)
}
```
