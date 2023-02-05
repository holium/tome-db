# Managing Permissions

## Types

```typescript
type InviteLevel = 'read' | 'write' | 'admin' | 'block'

// 'admin' allows read + write + admin
// 'write' allows read + write
// 'read' allows only read
```

## Methods

_These can only be done by the Tome owner._

### `setPermissions`

`store.setPermissions(permissions: Perm)`

**Params**: the new `permissions` to set.

**Returns**: <mark style="color:blue;">`Promise<void>`</mark>

Update a store's permissions after initialization.

```typescript
// store is one of: KeyValueStore, LogStore, or FeedStore
await store.setPermissions({
    read: 'our',
    write: 'our'
    admin: 'our'
})
```

### `inviteShip`

`store.inviteShip(ship: string, level: InviteLevel)`

**Params**: the `ship` to set permissions for and the `level` to set to.

**Returns**: <mark style="color:blue;">`Promise<void>`</mark>

Set permissions for a specific ship.  Invites take precedence over bucket-level permissions.

```typescript
// store is one of: KeyValueStore, LogStore, or FeedStore
await store.inviteShip('timluc-miptev', 'admin')
```

### `blockShip`

`store.blockShip(ship: string)`

**Params**: the `ship` to block.

**Returns**: <mark style="color:blue;">`Promise<void>`</mark>

An alias for `inviteShip(ship, 'block')`.

```typescript
await store.blockShip('sorreg-namtyv')
```
