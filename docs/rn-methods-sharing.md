---
title: "RN Methods: Sharing"
---

Create, update, revoke, and resolve shares for private and public access flows.

## Prerequisites

- SDK client created with `createRNClient(...)`
- User is authenticated for protected share methods
- Item IDs available from drive results

## Module overview

```ts
interface SharingModule {
  listShares(): Promise<ShareRecord[]>;
  listItemAccess(itemId: string, query?: SharingListItemAccessQuery): Promise<SharingItemAccessRecord[]>;
  createShare(body: SharingCreateInput): Promise<ShareRecord>;
  updateShare(shareId: string, body: SharingUpdateInput): Promise<ShareRecord>;
  revokeShare(shareId: string): Promise<ShareRecord>;
  deleteShare(shareId: string): Promise<ShareRecord>;
  resolvePublicShare(token: string, query?: SharingResolvePublicShareQuery): Promise<SharingPublicSharePayload>;
  resolvePublicShareWithPassword(token: string, password: string): Promise<SharingPublicSharePayload>;
  listPublicShareItems(token: string, query?: SharingListPublicItemsQuery): Promise<SharingPublicSharePayload>;
  resolvePublicShareItem(token: string, itemId: string, query?: SharingResolvePublicShareItemQuery): Promise<SharingPublicSharePayload>;
  cleanupExpiredShares(): Promise<SharingCleanupResult>;
}
```

### `sharing.listShares()`

#### What this method does

Lists shares created by or visible to the current authenticated user.

#### When to call it

Call for “My shares” screens and share-management dashboards.

#### Signature

```ts
listShares(): Promise<ShareRecord[]>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `(none)` | - | - | - | - | No request fields are required. |

#### Response fields

`ShareRecord` fields:

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `id` | `string` | Required | non-empty string | Share identifier. |
| `itemId` | `string` | Required | valid item ID | Shared item identifier. |
| `permission` | `string` | Required | permission value | Access level for this share. |
| `expiresAt` | `string \| null` | Required | ISO-8601 or `null` | Expiration timestamp when set. |
| `isRevoked` | `boolean` | Required | boolean | Revocation state. |
| `targetType` | `'LINK' \| 'USER' \| 'GROUP'` | Required | enum | Share target model. |
| `targetEmail` | `string \| null` | Optional | email or `null` | Target user email for user shares. |
| `targetGroupId` | `string \| null` | Optional | group ID or `null` | Target group ID for group shares. |
| `url` | `string` | Optional | URL | Link target URL when applicable. |

#### Errors and handling

- `AuthError`: user must re-authenticate.
- `NetworkError`: keep existing share list and retry.
- `SdkError`: show generic share-list load error.

#### Minimal example

```ts
try {
  const shares = await sdk.client.sharing.listShares();
  console.log('shares', shares.length);
} catch (error) {
  console.error('sharing.listShares failed', error);
}
```

### `sharing.listItemAccess(itemId, query?)`

#### What this method does

Returns access entries for one item, including optional inherited/expired/revoked entries.

#### When to call it

Call when rendering item-level access details in permissions UI.

#### Signature

```ts
listItemAccess(itemId: string, query?: SharingListItemAccessQuery): Promise<SharingItemAccessRecord[]>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `itemId` | `string` | Yes | none | valid item ID | Item whose access records are requested. |
| `includeInherited` | `boolean` | No | `false` | boolean | Include inherited access rules. |
| `includeExpired` | `boolean` | No | `false` | boolean | Include expired shares. |
| `includeRevoked` | `boolean` | No | `false` | boolean | Include revoked shares. |
| `limit` | `number` | No | service default | positive integer | Max records returned. |
| `cursor` | `string` | No | none | opaque cursor string | Pagination cursor. |

#### Response fields

`SharingItemAccessRecord` fields:

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `id` | `string` | Optional | string | Access record ID. |
| `itemId` | `string` | Optional | string | Item ID reference. |
| `permission` | `string` | Optional | permission value | Access level. |
| `targetType` | `SharingTargetType \| string` | Optional | enum/string | Target type metadata. |
| `targetEmail` | `string \| null` | Optional | email or `null` | Target email when applicable. |
| `targetGroupId` | `string \| null` | Optional | group ID or `null` | Target group when applicable. |
| `expiresAt` | `string \| null` | Optional | ISO-8601 or `null` | Expiration state. |
| `isRevoked` | `boolean` | Optional | boolean | Revocation state. |
| `inherited` | `boolean` | Optional | boolean | Whether access is inherited. |

#### Errors and handling

- `NotFoundError`: item may no longer exist; refresh drive list.
- `AuthError`: require sign-in.
- `NetworkError`: preserve current access panel and retry.

#### Minimal example

```ts
try {
  const access = await sdk.client.sharing.listItemAccess(itemId, {
    includeInherited: true,
    limit: 20,
  });
  console.log('access entries', access.length);
} catch (error) {
  console.error('sharing.listItemAccess failed', error);
}
```

### `sharing.createShare(body)`

#### What this method does

Creates a new share for link, user, or group targets.

#### When to call it

Call when user submits a “Share” action.

#### Signature

```ts
createShare(body: SharingCreateInput): Promise<ShareRecord>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `itemId` | `string` | Yes | none | valid item ID | Item to share. |
| `targetType` | `'LINK' \| 'USER' \| 'GROUP'` | Yes | none | enum | Share target model. |
| `permission` | `string` | No | service default | permission value | Permission for share. |
| `targetEmail` | `string \| null` | Conditional | none | email or `null` | Required for user-target shares. |
| `targetGroupId` | `string \| null` | Conditional | none | group ID or `null` | Required for group-target shares. |
| `expiresAt` | `string \| null` | No | none | ISO-8601 or `null` | Optional expiration time. |
| `password` | `string` | No | none | non-empty string | Optional password for public-link access. |

#### Response fields

Response is `ShareRecord` (fields documented in `sharing.listShares()`).

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `id` | `string` | Required | non-empty string | Created share ID. |
| `itemId` | `string` | Required | valid item ID | Shared item. |
| `targetType` | `'LINK' \| 'USER' \| 'GROUP'` | Required | enum | Target type for created share. |
| `permission` | `string` | Required | permission value | Applied permission. |
| `isRevoked` | `boolean` | Required | boolean | Revocation flag. |

#### Errors and handling

- `ValidationError`: show field-level guidance (target, permission, expiration).
- `ConflictError`: refresh share list and retry if necessary.
- `AuthError`: require sign-in.

#### Minimal example

```ts
try {
  const share = await sdk.client.sharing.createShare({
    itemId,
    targetType: 'LINK',
    permission: 'VIEW',
  });
  console.log('created share', share.id);
} catch (error) {
  console.error('sharing.createShare failed', error);
}
```

### `sharing.updateShare(shareId, body)`

#### What this method does

Updates permission, expiration, revocation, or password values for an existing share.

#### When to call it

Call from share-edit forms and admin controls.

#### Signature

```ts
updateShare(shareId: string, body: SharingUpdateInput): Promise<ShareRecord>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `shareId` | `string` | Yes | none | valid share ID | Share to update. |
| `permission` | `string` | No | unchanged | permission value | New permission. |
| `expiresAt` | `string \| null` | No | unchanged | ISO-8601 or `null` | New expiry or clear expiry. |
| `isRevoked` | `boolean` | No | unchanged | boolean | Revocation toggle. |
| `password` | `string \| null` | No | unchanged | string or `null` | New password or clear password. |

#### Response fields

Response is `ShareRecord`.

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `id` | `string` | Required | non-empty string | Updated share ID. |
| `permission` | `string` | Required | permission value | Effective permission after update. |
| `expiresAt` | `string \| null` | Required | ISO-8601 or `null` | Effective expiration value. |
| `isRevoked` | `boolean` | Required | boolean | Effective revocation state. |

#### Errors and handling

- `NotFoundError`: share no longer exists; refresh share list.
- `ValidationError`: reject invalid form values.
- `NetworkError`: keep pending form and retry.

#### Minimal example

```ts
try {
  const updated = await sdk.client.sharing.updateShare(shareId, {
    permission: 'EDIT',
  });
  console.log('updated share', updated.id);
} catch (error) {
  console.error('sharing.updateShare failed', error);
}
```

### `sharing.revokeShare(shareId)`

#### What this method does

Revokes an existing share without deleting the share record.

#### When to call it

Call when user disables active access for a share.

#### Signature

```ts
revokeShare(shareId: string): Promise<ShareRecord>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `shareId` | `string` | Yes | none | valid share ID | Share to revoke. |

#### Response fields

Response is `ShareRecord`.

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `id` | `string` | Required | non-empty string | Revoked share ID. |
| `isRevoked` | `boolean` | Required | expected `true` | Revocation result. |

#### Errors and handling

- `NotFoundError`: refresh and remove stale share item.
- `AuthError`: prompt sign-in.
- `NetworkError`: let user retry revoke action.

#### Minimal example

```ts
try {
  await sdk.client.sharing.revokeShare(shareId);
} catch (error) {
  console.error('sharing.revokeShare failed', error);
}
```

### `sharing.deleteShare(shareId)`

#### What this method does

Deletes a share record.

#### When to call it

Call when user permanently removes a share entry.

#### Signature

```ts
deleteShare(shareId: string): Promise<ShareRecord>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `shareId` | `string` | Yes | none | valid share ID | Share to delete. |

#### Response fields

Response is `ShareRecord` representing the deleted share record state.

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `id` | `string` | Required | non-empty string | Deleted share ID. |
| `itemId` | `string` | Required | valid item ID | Related item. |

#### Errors and handling

- `NotFoundError`: share already removed; refresh list.
- `AuthError`: require sign-in.
- `NetworkError`: preserve UI state and retry.

#### Minimal example

```ts
try {
  await sdk.client.sharing.deleteShare(shareId);
} catch (error) {
  console.error('sharing.deleteShare failed', error);
}
```

### `sharing.resolvePublicShare(token, query?)`

#### What this method does

Resolves a public share token, optionally including password data.

#### When to call it

Call when loading a public share landing page.

#### Signature

```ts
resolvePublicShare(token: string, query?: SharingResolvePublicShareQuery): Promise<SharingPublicSharePayload>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `token` | `string` | Yes | none | share token string | Public share token. |
| `password` | `string` | No | none | non-empty string | Password for protected public share. |

#### Response fields

`SharingPublicSharePayload` fields:

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `token` | `string` | Optional | non-empty string | Resolved token value. |
| `item` | `unknown` | Optional | object payload | Top-level item payload. |
| `items` | `unknown[]` | Optional | array payload | Child items payload. |
| `passwordRequired` | `boolean` | Optional | boolean | Indicates whether password is required. |
| `nextCursor` | `string \| null` | Optional | cursor or `null` | Pagination cursor for large share listings. |

#### Errors and handling

- `ValidationError`: invalid token/password format.
- `NotFoundError`: token may be invalid or expired.
- `RateLimitError`: back off retries.

#### Minimal example

```ts
try {
  const payload = await sdk.client.sharing.resolvePublicShare(token);
  console.log('password required', payload.passwordRequired);
} catch (error) {
  console.error('sharing.resolvePublicShare failed', error);
}
```

### `sharing.resolvePublicShareWithPassword(token, password)`

#### What this method does

Resolves a password-protected public share with explicit password input.

#### When to call it

Call after user submits password for a protected public share.

#### Signature

```ts
resolvePublicShareWithPassword(token: string, password: string): Promise<SharingPublicSharePayload>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `token` | `string` | Yes | none | share token string | Public share token. |
| `password` | `string` | Yes | none | non-empty string | Password entered by user. |

#### Response fields

Response is `SharingPublicSharePayload` (fields documented above).

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `passwordRequired` | `boolean` | Optional | boolean | Usually `false` when password is accepted. |
| `item` | `unknown` | Optional | object payload | Public share root item payload. |
| `items` | `unknown[]` | Optional | array payload | Public share child items. |

#### Errors and handling

- `ValidationError`: password missing/invalid format.
- `AuthError`: not expected for public token routes; treat as generic failure.
- `RateLimitError`: back off after repeated failures.

#### Minimal example

```ts
try {
  const payload = await sdk.client.sharing.resolvePublicShareWithPassword(token, password);
  console.log('resolved public share', !!payload.item);
} catch (error) {
  console.error('sharing.resolvePublicShareWithPassword failed', error);
}
```

### `sharing.listPublicShareItems(token, query?)`

#### What this method does

Lists items available within a public share token context.

#### When to call it

Call for paginated listing inside a public-share viewer.

#### Signature

```ts
listPublicShareItems(token: string, query?: SharingListPublicItemsQuery): Promise<SharingPublicSharePayload>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `token` | `string` | Yes | none | share token string | Public share token. |
| `password` | `string` | No | none | non-empty string | Password for protected share. |
| `limit` | `number` | No | service default | positive integer | Max items in page. |
| `cursor` | `string` | No | none | opaque cursor | Pagination cursor. |

#### Response fields

Response is `SharingPublicSharePayload`.

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `items` | `unknown[]` | Optional | array payload | Public-share items page. |
| `nextCursor` | `string \| null` | Optional | cursor or `null` | Next page token. |
| `passwordRequired` | `boolean` | Optional | boolean | Password requirement signal. |

#### Errors and handling

- `ValidationError`: bad query or token format.
- `NotFoundError`: token invalid/expired.
- `NetworkError`: keep current page and retry.

#### Minimal example

```ts
try {
  const payload = await sdk.client.sharing.listPublicShareItems(token, { limit: 20 });
  console.log('items', payload.items?.length ?? 0);
} catch (error) {
  console.error('sharing.listPublicShareItems failed', error);
}
```

### `sharing.resolvePublicShareItem(token, itemId, query?)`

#### What this method does

Resolves one item under a public share token, optionally with password data.

#### When to call it

Call when opening a specific public-share file or folder.

#### Signature

```ts
resolvePublicShareItem(token: string, itemId: string, query?: SharingResolvePublicShareItemQuery): Promise<SharingPublicSharePayload>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `token` | `string` | Yes | none | share token string | Public share token. |
| `itemId` | `string` | Yes | none | valid item ID | Target item inside shared scope. |
| `password` | `string` | No | none | non-empty string | Password for protected share. |

#### Response fields

Response is `SharingPublicSharePayload`.

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `item` | `unknown` | Optional | object payload | Resolved item payload. |
| `passwordRequired` | `boolean` | Optional | boolean | Indicates password is still required. |

#### Errors and handling

- `NotFoundError`: item or token is invalid.
- `ValidationError`: malformed token/itemId/password input.
- `NetworkError`: keep context and retry.

#### Minimal example

```ts
try {
  const payload = await sdk.client.sharing.resolvePublicShareItem(token, itemId);
  console.log('resolved item', !!payload.item);
} catch (error) {
  console.error('sharing.resolvePublicShareItem failed', error);
}
```

### `sharing.cleanupExpiredShares()`

#### What this method does

Cleans up expired shares and returns number of revoked entries.

#### When to call it

Call from maintenance flows or admin cleanup actions.

#### Signature

```ts
cleanupExpiredShares(): Promise<SharingCleanupResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `(none)` | - | - | - | - | No request fields are required. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `revoked` | `number` | Required | non-negative integer | Number of expired shares revoked by cleanup. |

#### Errors and handling

- `AuthError`: require authenticated admin/user context.
- `NetworkError`: retry later; operation is safe to rerun.
- `SdkError`: log operation and surface generic failure.

#### Minimal example

```ts
try {
  const result = await sdk.client.sharing.cleanupExpiredShares();
  console.log('revoked expired shares', result.revoked);
} catch (error) {
  console.error('sharing.cleanupExpiredShares failed', error);
}
```
