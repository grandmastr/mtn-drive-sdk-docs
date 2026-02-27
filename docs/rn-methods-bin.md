---
title: "RN Methods: Bin"
---

Manage trashed items with simplified helper methods that map to drive trash operations.

## Prerequisites

- SDK client created with `createRNClient(...)`
- User is authenticated

## Module overview

```ts
interface BinModule {
  list(query?: BinListQuery): Promise<CursorListResponse<DriveItem>>;
  restore(itemId: string): Promise<DriveTrashRestoreResult>;
  bulkRestore(itemIds: string[]): Promise<DriveMutationResult>;
  purgeAll(): Promise<DrivePurgeResult>;
  purgeOne(itemId: string): Promise<DrivePurgeResult>;
  bulkPurge(itemIds: string[]): Promise<DriveMutationResult>;
}
```

### `bin.list(query?)`

#### What this method does

Lists items currently in trash.

#### When to call it

Call when loading the trash/bin screen and while paginating.

#### Signature

```ts
list(query?: BinListQuery): Promise<CursorListResponse<DriveItem>>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `limit` | `number` | No | service default | positive integer | Max items in page. |
| `cursor` | `string` | No | none | opaque pagination token | Next page cursor. |

#### Response fields

`CursorListResponse<DriveItem>`:

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `items` | `DriveItem[]` | Required | array | Trash items page. |
| `nextCursor` | `string \| null` | Required | cursor token or `null` | Next page cursor. |

#### Errors and handling

- `AuthError`: force re-authentication.
- `NetworkError`: keep existing list and allow retry.
- `SdkError`: show generic trash load error.

#### Minimal example

```ts
try {
  const trash = await sdk.client.bin.list({ limit: 20 });
  console.log('trash items', trash.items.length);
} catch (error) {
  console.error('bin.list failed', error);
}
```

### `bin.restore(itemId)`

#### What this method does

Restores one trashed item back to active drive state.

#### When to call it

Call when user taps restore on a single trash entry.

#### Signature

```ts
restore(itemId: string): Promise<DriveTrashRestoreResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `itemId` | `string` | Yes | none | valid drive item ID | Trashed item to restore. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `id` | `string` | Optional | non-empty string | Restored item ID. |
| `name` | `string` | Optional | string | Restored item name. |
| `type` | `'FILE' \| 'FOLDER'` | Optional | enum | Restored item type. |
| `parentId` | `string \| null` | Optional | ID or `null` | Restored parent folder. |
| `updatedAt` | `string` | Optional | ISO-8601 timestamp | Last update timestamp after restore. |

#### Errors and handling

- `NotFoundError`: refresh trash list; item may already be restored or deleted.
- `ConflictError`: refresh list and retry once.
- `NetworkError`: keep item visible and provide retry action.

#### Minimal example

```ts
try {
  await sdk.client.bin.restore(itemId);
} catch (error) {
  console.error('bin.restore failed', error);
}
```

### `bin.bulkRestore(itemIds)`

#### What this method does

Restores multiple trashed items in one call.

#### When to call it

Call for multi-select restore actions in trash UI.

#### Signature

```ts
bulkRestore(itemIds: string[]): Promise<DriveMutationResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `itemIds` | `string[]` | Yes | none | one or more item IDs | Trashed items to restore. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `ok` | `boolean` | Optional | `true` or `false` | General success indicator. |
| `deleted` | `boolean` | Optional | `true` or `false` | Legacy mutation flag. |
| `purged` | `number` | Optional | non-negative integer | Present when payload includes purge metadata. |
| `removedObjects` | `number` | Optional | non-negative integer | Count of removed objects when returned. |

#### Errors and handling

- `ValidationError`: validate selection is non-empty.
- `ConflictError`: refresh and rerun selection.
- `NetworkError`: preserve selection and retry.

#### Minimal example

```ts
try {
  await sdk.client.bin.bulkRestore(selectedIds);
} catch (error) {
  console.error('bin.bulkRestore failed', error);
}
```

### `bin.purgeAll()`

#### What this method does

Permanently removes all items currently in trash.

#### When to call it

Call only behind explicit destructive confirmation.

#### Signature

```ts
purgeAll(): Promise<DrivePurgeResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `(none)` | - | - | - | - | No request fields are required. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `purged` | `number` | Optional | non-negative integer | Count of purged items when provided. |
| `ok` | `boolean` | Optional | `true` or `false` | General success flag. |

#### Errors and handling

- `ValidationError`: block action when user confirmation is missing.
- `NetworkError`: retry safely after reconnect.
- `SdkError`: show destructive-action failure state.

#### Minimal example

```ts
try {
  const result = await sdk.client.bin.purgeAll();
  console.log('purged', result.purged ?? 0);
} catch (error) {
  console.error('bin.purgeAll failed', error);
}
```

### `bin.purgeOne(itemId)`

#### What this method does

Permanently removes one trashed item.

#### When to call it

Call for single-item permanent delete actions in bin UI.

#### Signature

```ts
purgeOne(itemId: string): Promise<DrivePurgeResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `itemId` | `string` | Yes | none | valid drive item ID | Trashed item to purge permanently. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `purged` | `number` | Optional | non-negative integer | Purged count when provided. |
| `ok` | `boolean` | Optional | `true` or `false` | Success flag when provided. |

#### Errors and handling

- `NotFoundError`: item may already be gone; refresh list.
- `ConflictError`: refresh and retry once.
- `NetworkError`: keep item selected for retry.

#### Minimal example

```ts
try {
  await sdk.client.bin.purgeOne(itemId);
} catch (error) {
  console.error('bin.purgeOne failed', error);
}
```

### `bin.bulkPurge(itemIds)`

#### What this method does

Permanently removes multiple trashed items.

#### When to call it

Call for multi-select permanent delete actions.

#### Signature

```ts
bulkPurge(itemIds: string[]): Promise<DriveMutationResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `itemIds` | `string[]` | Yes | none | one or more item IDs | Trashed items to purge permanently. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `ok` | `boolean` | Optional | `true` or `false` | General success indicator. |
| `purged` | `number` | Optional | non-negative integer | Number of purged items when provided. |
| `removedObjects` | `number` | Optional | non-negative integer | Removed object count when provided. |

#### Errors and handling

- `ValidationError`: enforce non-empty selection.
- `RateLimitError`: apply backoff and retry.
- `NetworkError`: preserve selection and retry.

#### Minimal example

```ts
try {
  await sdk.client.bin.bulkPurge(selectedIds);
} catch (error) {
  console.error('bin.bulkPurge failed', error);
}
```
