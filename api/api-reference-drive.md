---
title: "API Reference: Drive"
---

Use these `/drive` routes for the core drive file and folder lifecycle after authentication. This first reference pass focuses on browsing, folder creation, metadata, download URLs, updates, trash, and restore. For new file ingestion, use [Managed Uploads](/api/managed-uploads) instead of the legacy direct upload-session routes.

## Prerequisites

- You already completed [Authentication](/api/authentication).
- You understand the parent folder ids and item ids your integration persists.
- You will use [Managed Uploads](/api/managed-uploads) for new file bytes and `/drive` for post-upload lifecycle work.

### GET /drive/items

#### What this endpoint does

Lists drive items for the root, one folder, or a predefined view such as recents or starred.

#### When to call it

Call it when you need to render a folder view, root listing, or a paginated drive feed.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |
| `Accept` | No | `application/json` |

#### Request body / params

| Field | Type | Required | Notes |
| - | - | - | - |
| `parentId` | `string` | No | Folder to list. Omit for root or view-based listing. |
| `view` | `all \| recents \| starred` | No | Server-defined list mode. |
| `cursor` | `string` | No | Pagination cursor from the previous response. |
| `limit` | `number` | No | Page size from `1` to `1000`. |
| `includeItems` | `string` | No | Advanced expansion string used by the current API surface. |
| `includeItemsLimit` | `number` | No | Expansion limit from `1` to `200`. |

This route does not take a request body.

#### Response body

```json
{
  "items": [
    {
      "id": "item-id",
      "name": "Docs",
      "type": "FOLDER",
      "parentId": null,
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "nextCursor": null
}
```

#### Errors and handling

- `400 ValidationError`: one of the query parameters is malformed or out of range.
- `401 Unauthorized`: bearer token is missing or expired; refresh or re-exchange first.
- `403 Forbidden`: caller is authenticated but not allowed to read the requested context.

#### Minimal curl example

```bash
curl 'https://youthful-fold.pipeops.app/drive/items?parentId=folder-id&limit=50' \
  -H 'Authorization: Bearer api-access-token'
```

### GET /drive/search

#### What this endpoint does

Searches files and folders with fuzzy matching and returns the best matches first.

#### When to call it

Call it when the user is searching by name rather than browsing a known folder.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |
| `Accept` | No | `application/json` |

#### Request body / params

| Field | Type | Required | Notes |
| - | - | - | - |
| `q` | `string` | Yes | Case-insensitive search text. |
| `parentId` | `string` | No | Required only when you intentionally scope the search to one folder. |
| `view` | `all \| recents \| starred \| shared \| shared_by_me` | No | Search view mode. |
| `scope` | `all \| folder` | No | Set `folder` for folder-scoped search behavior. |
| `type` | `all \| file \| folder` | No | Restrict result type. |
| `cursor` | `string` | No | Pagination cursor. |
| `limit` | `number` | No | Page size from `1` to `1000`. |
| `includeItems` | `string` | No | Advanced expansion string used by the current API surface. |
| `includeItemsLimit` | `number` | No | Expansion limit from `1` to `200`. |

This route does not take a request body.

#### Response body

```json
{
  "items": [
    {
      "id": "item-id",
      "name": "invoice-2026.pdf",
      "type": "FILE",
      "sizeBytes": 102400,
      "mimeType": "application/pdf",
      "parentId": "folder-id",
      "updatedAt": "2026-03-06T10:00:00.000Z",
      "isStarred": false,
      "uploadStatus": "COMPLETE",
      "ownerName": "Jane Doe",
      "score": 0.97
    }
  ],
  "nextCursor": null
}
```

#### Errors and handling

- `400 ValidationError`: `q` is missing or an enum or pagination value is invalid.
- `401 Unauthorized`: bearer token is missing or expired.
- `403 Forbidden`: search scope is not accessible to the caller.

#### Minimal curl example

```bash
curl 'https://youthful-fold.pipeops.app/drive/search?q=invoice&type=file&limit=20' \
  -H 'Authorization: Bearer api-access-token'
```

### GET /drive/stats

#### What this endpoint does

Returns lightweight counters for files, folders, and shared content in the current drive context.

#### When to call it

Call it when you need dashboard counters without fetching full item lists.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |

#### Request body / params

This route does not take query parameters or a request body.

#### Response body

```json
{
  "files": 128,
  "folders": 24,
  "shared": 9
}
```

#### Errors and handling

- `401 Unauthorized`: bearer token is missing or expired.
- `403 Forbidden`: caller is not allowed to read drive counters in the current context.

#### Minimal curl example

```bash
curl https://youthful-fold.pipeops.app/drive/stats \
  -H 'Authorization: Bearer api-access-token'
```

### POST /drive/folders

#### What this endpoint does

Creates a drive folder under the root or under one existing parent folder.

#### When to call it

Call it before a new upload or move operation when the destination folder does not already exist.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |
| `Content-Type` | Yes | `application/json` |

#### Request body / params

```json
{
  "parentId": "folder-id",
  "name": "Receipts"
}
```

| Field | Type | Required | Notes |
| - | - | - | - |
| `parentId` | `string` | No | Parent folder id. Omit to create at root. |
| `name` | `string` | Yes | Non-empty folder name. |

#### Response body

```json
{
  "id": "folder-id",
  "name": "Receipts",
  "parentId": "folder-id",
  "type": "FOLDER",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### Errors and handling

- `400 ValidationError`: the folder name is missing or malformed.
- `404 NotFound`: the parent folder does not exist or is not accessible.
- `401 Unauthorized` or `403 Forbidden`: authentication or permission failure.

#### Minimal curl example

```bash
curl -X POST https://youthful-fold.pipeops.app/drive/folders \
  -H 'Authorization: Bearer api-access-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "parentId": "folder-id",
    "name": "Receipts"
  }'
```

### GET /drive/items/:id/download-url

#### What this endpoint does

Creates a presigned download URL for one drive file.

#### When to call it

Call it when the client needs to download or hand off one stored file without proxying the file through your own service.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |

#### Request body / params

| Field | Type | Required | Notes |
| - | - | - | - |
| `id` | `string` | Yes | Drive item id in the path. |
| `disposition` | `inline \| attachment` | No | Download-disposition hint. |

This route does not take a request body.

#### Response body

```json
{
  "url": "https://storage.example.com/download-url",
  "expiresIn": 900,
  "contentType": "application/pdf",
  "contentLength": 1024,
  "etag": "etag"
}
```

#### Errors and handling

- `404 NotFound`: the file id does not exist or is not accessible.
- `400 ValidationError`: the disposition value is invalid.
- `401 Unauthorized` or `403 Forbidden`: authentication or permission failure.

#### Minimal curl example

```bash
curl 'https://youthful-fold.pipeops.app/drive/items/file-id/download-url?disposition=attachment' \
  -H 'Authorization: Bearer api-access-token'
```

### GET /drive/items/:id/metadata

#### What this endpoint does

Returns object-storage metadata for one drive item.

#### When to call it

Call it when you need object size, type, ETag, or storage-key information without downloading the file.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |

#### Request body / params

| Field | Type | Required | Notes |
| - | - | - | - |
| `id` | `string` | Yes | Drive item id in the path. |

This route does not take a request body.

#### Response body

```json
{
  "key": "org/orgId/user/userId/2025/01/01/uuid",
  "contentType": "application/pdf",
  "contentLength": 1024,
  "etag": "etag",
  "lastModified": "2025-01-01T00:00:00Z"
}
```

#### Errors and handling

- `404 NotFound`: the file id does not exist or cannot be read.
- `401 Unauthorized` or `403 Forbidden`: authentication or permission failure.

#### Minimal curl example

```bash
curl https://youthful-fold.pipeops.app/drive/items/file-id/metadata \
  -H 'Authorization: Bearer api-access-token'
```

### PATCH /drive/items/:id

#### What this endpoint does

Updates one drive item by renaming it, moving it to another folder, or changing its starred state.

#### When to call it

Call it after an item already exists and the user changes metadata or organization state.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |
| `Content-Type` | Yes | `application/json` |

#### Request body / params

```json
{
  "name": "Q1 Report.pdf",
  "parentId": "folder-id",
  "isStarred": true
}
```

| Field | Type | Required | Notes |
| - | - | - | - |
| `id` | `string` | Yes | Drive item id in the path. |
| `name` | `string` | No | New item name. |
| `parentId` | `string \| null` | No | New parent folder id or `null` for root when the API accepts that move. |
| `isStarred` | `boolean` | No | Starred state toggle. |

#### Response body

```json
{
  "id": "item-id",
  "name": "Q1 Report.pdf",
  "parentId": "folder-id",
  "isStarred": true,
  "updatedAt": "2026-03-06T10:00:00.000Z"
}
```

#### Errors and handling

- `400 ValidationError`: the request body is empty or contains invalid values.
- `404 NotFound`: the item or destination folder does not exist.
- `401 Unauthorized` or `403 Forbidden`: authentication or permission failure.

#### Minimal curl example

```bash
curl -X PATCH https://youthful-fold.pipeops.app/drive/items/item-id \
  -H 'Authorization: Bearer api-access-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Q1 Report.pdf",
    "isStarred": true
  }'
```

### DELETE /drive/items/:id

#### What this endpoint does

Soft-deletes one file or folder and moves it to the drive trash.

#### When to call it

Call it when the item should leave the active drive view but still be recoverable through trash.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |

#### Request body / params

| Field | Type | Required | Notes |
| - | - | - | - |
| `id` | `string` | Yes | Drive item id in the path. |
| `isFolder` | `string` | No | Boolean-like query flag such as `true`, `1`, `yes`, or `on` when deleting a folder tree. |

This route does not take a request body.

#### Response body

```json
{
  "deleted": true,
  "removedObjects": 1
}
```

#### Errors and handling

- `404 NotFound`: the item does not exist or is already unavailable.
- `400 ValidationError`: the delete request is malformed for the current item.
- `401 Unauthorized` or `403 Forbidden`: authentication or permission failure.

#### Minimal curl example

```bash
curl -X DELETE 'https://youthful-fold.pipeops.app/drive/items/item-id?isFolder=false' \
  -H 'Authorization: Bearer api-access-token'
```

### GET /drive/trash

#### What this endpoint does

Lists trashed items for the current caller.

#### When to call it

Call it when you need a recoverable-delete view or a restore workflow.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |

#### Request body / params

| Field | Type | Required | Notes |
| - | - | - | - |
| `limit` | `number` | No | Page size for the trash listing. |
| `cursor` | `string` | No | Pagination cursor from a previous trash response. |

This route does not take a request body.

#### Response body

```json
{
  "items": [
    {
      "id": "item-id",
      "name": "old.pdf",
      "type": "FILE",
      "deletedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "nextCursor": null
}
```

#### Errors and handling

- `400 ValidationError`: pagination values are invalid.
- `401 Unauthorized` or `403 Forbidden`: authentication or permission failure.

#### Minimal curl example

```bash
curl 'https://youthful-fold.pipeops.app/drive/trash?limit=50' \
  -H 'Authorization: Bearer api-access-token'
```

### POST /drive/trash/:id/restore

#### What this endpoint does

Restores one trashed drive item back into the active drive view.

#### When to call it

Call it when a previously deleted file or folder should become visible again.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |

#### Request body / params

| Field | Type | Required | Notes |
| - | - | - | - |
| `id` | `string` | Yes | Trashed drive item id in the path. |

This route does not take a request body.

#### Response body

```json
{
  "id": "item-id",
  "name": "restored.pdf",
  "parentId": null,
  "type": "FILE",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

#### Errors and handling

- `404 NotFound`: the trashed item does not exist or is no longer recoverable.
- `409 Conflict`: the restore target cannot be reattached cleanly in the current server state.
- `401 Unauthorized` or `403 Forbidden`: authentication or permission failure.

#### Minimal curl example

```bash
curl -X POST https://youthful-fold.pipeops.app/drive/trash/item-id/restore \
  -H 'Authorization: Bearer api-access-token'
```
