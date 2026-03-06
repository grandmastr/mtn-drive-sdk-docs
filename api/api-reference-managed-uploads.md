---
title: "API Reference: Managed Uploads"
---

Use these `/v2/uploads` routes to create, inspect, refresh, reconcile, confirm, complete, and cancel managed upload sessions for both `drive` and `photo_backup` targets.

## Prerequisites

- You already completed [Authentication](/api/authentication).
- You can compute the file SHA-256 `contentHash`.
- You can upload bytes to pre-signed object-storage URLs.
- For `photo_backup` targets, you can send a stable `x-device-id` header.

### POST /v2/uploads/sessions

#### What this endpoint does

Creates a managed upload session and returns either a `deduped`, `single`, or `multipart` upload plan.

#### When to call it

Call it before uploading any bytes for a new drive file or photo-backup asset.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |
| `Content-Type` | Yes | `application/json` |
| `x-device-id` | Conditional | Required for `target.kind = photo_backup`, optional for `target.kind = drive` |

#### Request body / params

Drive example:

```json
{
  "target": {
    "kind": "drive",
    "parentId": "folder-id"
  },
  "file": {
    "filename": "receipt.pdf",
    "mimeType": "application/pdf",
    "byteSize": 10485760,
    "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "modifiedAtMs": 1741251600000
  }
}
```

Photo-backup example:

```json
{
  "target": {
    "kind": "photo_backup",
    "capturedAt": "2026-03-06T09:00:00.000Z",
    "width": 3024,
    "height": 4032
  },
  "file": {
    "filename": "IMG_0001.JPG",
    "mimeType": "image/jpeg",
    "byteSize": 12582912,
    "contentHash": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "modifiedAtMs": 1741251600000
  }
}
```

| Field | Type | Required | Notes |
| - | - | - | - |
| `target.kind` | `drive \| photo_backup` | Yes | Selects upload target type. |
| `target.parentId` | `string \| null` | No | Drive parent folder id for `drive` uploads. |
| `target.capturedAt` | `string` | No | ISO-8601 capture timestamp for `photo_backup`. |
| `target.width` | `number` | No | Image width for `photo_backup`. |
| `target.height` | `number` | No | Image height for `photo_backup`. |
| `file.filename` | `string` | Yes | Source filename. |
| `file.mimeType` | `string` | Yes | Source MIME type. |
| `file.byteSize` | `number` | Yes | Source byte size. |
| `file.contentHash` | `string` | Yes | Lowercase 64-character SHA-256 hex string. |
| `file.modifiedAtMs` | `number` | No | Source modified timestamp in epoch milliseconds. |

#### Response body

Deduped example:

```json
{
  "sessionId": "managed-session-id",
  "state": "completed",
  "strategy": "deduped",
  "expiresAt": "2026-03-13T09:00:00.000Z",
  "result": {
    "kind": "drive",
    "fileId": "file-id"
  }
}
```

Single example:

```json
{
  "sessionId": "managed-session-id",
  "state": "active",
  "strategy": "single",
  "expiresAt": "2026-03-13T09:00:00.000Z",
  "single": {
    "uploadUrl": "https://storage.example.com/upload-url",
    "headers": {
      "Content-Type": "application/pdf"
    },
    "expiresAt": "2026-03-06T10:15:00.000Z"
  }
}
```

Multipart example:

```json
{
  "sessionId": "managed-session-id",
  "state": "active",
  "strategy": "multipart",
  "expiresAt": "2026-03-13T09:00:00.000Z",
  "multipart": {
    "partSize": 8388608,
    "parts": [
      {
        "partNumber": 1,
        "start": 0,
        "endExclusive": 8388608,
        "uploadUrl": "https://storage.example.com/upload-url-part-1",
        "expiresAt": "2026-03-06T10:15:00.000Z"
      }
    ],
    "completedParts": []
  }
}
```

#### Errors and handling

- `400 ValidationError`: fix malformed metadata before retrying.
- `401 AuthError`: bearer token is missing or expired; refresh or re-exchange first.
- `400 DEVICE_ID_REQUIRED` or equivalent device-id validation failure: send `x-device-id` for `photo_backup`.

#### Minimal curl example

```bash
curl -X POST https://youthful-fold.pipeops.app/v2/uploads/sessions \
  -H 'Authorization: Bearer api-access-token' \
  -H 'Content-Type: application/json' \
  -H 'x-device-id: device-123' \
  -d '{
    "target": {
      "kind": "photo_backup",
      "capturedAt": "2026-03-06T09:00:00.000Z",
      "width": 3024,
      "height": 4032
    },
    "file": {
      "filename": "IMG_0001.JPG",
      "mimeType": "image/jpeg",
      "byteSize": 12582912,
      "contentHash": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    }
  }'
```

### GET /v2/uploads/sessions/:sessionId

#### What this endpoint does

Returns the current server view of one managed upload session.

#### When to call it

Call it when you need the latest session state without changing the session.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |
| `x-device-id` | Conditional | Optional for drive sessions, required when the session belongs to `photo_backup` |

#### Request body / params

| Field | Type | Required | Notes |
| - | - | - | - |
| `sessionId` | `string` | Yes | Managed upload session id in the path. |

This route does not take a request body.

#### Response body

```json
{
  "sessionId": "managed-session-id",
  "state": "active",
  "strategy": "multipart",
  "expiresAt": "2026-03-13T09:00:00.000Z",
  "multipart": {
    "partSize": 8388608,
    "parts": [],
    "completedParts": [
      {
        "partNumber": 1,
        "etag": "\"etag-part-1\"",
        "byteSize": 8388608
      }
    ]
  }
}
```

#### Errors and handling

- `404 NOT_FOUND`: the session is gone or invalid; recreate the upload session if needed.
- `400 UPLOAD_SESSION_EXPIRED`: the session expired; start a fresh upload session.
- `400 UPLOAD_SESSION_CANCELED`: treat the upload as canceled and stop retries.

#### Minimal curl example

```bash
curl https://youthful-fold.pipeops.app/v2/uploads/sessions/managed-session-id \
  -H 'Authorization: Bearer api-access-token'
```

### POST /v2/uploads/sessions/:sessionId/refresh

#### What this endpoint does

Refreshes the upload descriptors for an active managed upload session.

#### When to call it

Call it when upload URLs expire or when you need fresh multipart descriptors while the session is still active.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |
| `x-device-id` | Conditional | Optional for drive sessions, required when the session belongs to `photo_backup` |

#### Request body / params

| Field | Type | Required | Notes |
| - | - | - | - |
| `sessionId` | `string` | Yes | Managed upload session id in the path. |

This route does not take a request body.

#### Response body

```json
{
  "sessionId": "managed-session-id",
  "state": "active",
  "strategy": "multipart",
  "expiresAt": "2026-03-13T09:00:00.000Z",
  "multipart": {
    "partSize": 8388608,
    "parts": [
      {
        "partNumber": 2,
        "start": 8388608,
        "endExclusive": 12582912,
        "uploadUrl": "https://storage.example.com/upload-url-part-2",
        "expiresAt": "2026-03-06T10:15:00.000Z"
      }
    ],
    "completedParts": [
      {
        "partNumber": 1,
        "etag": "\"etag-part-1\"",
        "byteSize": 8388608
      }
    ]
  }
}
```

#### Errors and handling

- `400 UPLOAD_SESSION_EXPIRED`: stop using this session and create a new one.
- `400 UPLOAD_SESSION_CANCELED`: treat the session as canceled.
- `404 NOT_FOUND`: the session no longer exists.

#### Minimal curl example

```bash
curl -X POST https://youthful-fold.pipeops.app/v2/uploads/sessions/managed-session-id/refresh \
  -H 'Authorization: Bearer api-access-token'
```

### POST /v2/uploads/sessions/:sessionId/parts/:partNumber/confirm

#### What this endpoint does

Confirms one uploaded multipart part using the storage ETag and uploaded byte size.

#### When to call it

Call it after each successful multipart part upload.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |
| `Content-Type` | Yes | `application/json` |
| `x-device-id` | Conditional | Optional for drive sessions, required when the session belongs to `photo_backup` |

#### Request body / params

```json
{
  "etag": "\"etag-part-1\"",
  "byteSize": 8388608
}
```

| Field | Type | Required | Notes |
| - | - | - | - |
| `sessionId` | `string` | Yes | Managed upload session id in the path. |
| `partNumber` | `number` | Yes | Multipart part number in the path. |
| `etag` | `string` | Yes | ETag returned by object storage for the uploaded part. |
| `byteSize` | `number` | Yes | Uploaded part size in bytes. |

#### Response body

```json
{
  "ok": true
}
```

#### Errors and handling

- `409 PART_CONFLICT`: the part was already confirmed with different metadata; reconcile or refresh before retrying.
- `400 UPLOAD_SESSION_EXPIRED`: the session expired before confirmation.
- `404 NOT_FOUND`: the session or part no longer exists.

#### Minimal curl example

```bash
curl -X POST https://youthful-fold.pipeops.app/v2/uploads/sessions/managed-session-id/parts/1/confirm \
  -H 'Authorization: Bearer api-access-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "etag": "\"etag-part-1\"",
    "byteSize": 8388608
  }'
```

### POST /v2/uploads/sessions/:sessionId/reconcile

#### What this endpoint does

Reconciles server-side session state after interruption and returns the authoritative next step.

#### When to call it

Call it after restarts, uncertain network outcomes, or when you need the server to tell you which parts or results already exist.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |
| `x-device-id` | Conditional | Optional for drive sessions, required when the session belongs to `photo_backup` |

#### Request body / params

| Field | Type | Required | Notes |
| - | - | - | - |
| `sessionId` | `string` | Yes | Managed upload session id in the path. |

This route does not take a request body.

#### Response body

```json
{
  "sessionId": "managed-session-id",
  "state": "active",
  "strategy": "multipart",
  "expiresAt": "2026-03-13T09:00:00.000Z",
  "multipart": {
    "partSize": 8388608,
    "parts": [
      {
        "partNumber": 2,
        "start": 8388608,
        "endExclusive": 12582912,
        "uploadUrl": "https://storage.example.com/upload-url-part-2",
        "expiresAt": "2026-03-06T10:15:00.000Z"
      }
    ],
    "completedParts": [
      {
        "partNumber": 1,
        "etag": "\"etag-part-1\"",
        "byteSize": 8388608
      }
    ]
  }
}
```

A reconciled completed response can also return `state: "completed"` plus `result`.

#### Errors and handling

- `400 UPLOAD_SESSION_EXPIRED`: the session can no longer be resumed.
- `400 UPLOAD_SESSION_CANCELED`: the session was canceled.
- `404 NOT_FOUND`: recreate the session if the upload still needs to continue.

#### Minimal curl example

```bash
curl -X POST https://youthful-fold.pipeops.app/v2/uploads/sessions/managed-session-id/reconcile \
  -H 'Authorization: Bearer api-access-token'
```

### POST /v2/uploads/sessions/:sessionId/complete

#### What this endpoint does

Marks the managed upload session complete after all required upload work is already in storage and confirmed.

#### When to call it

Call it after a `single` upload finishes or after all multipart parts are uploaded and confirmed.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |
| `x-device-id` | Conditional | Optional for drive sessions, required when the session belongs to `photo_backup` |

#### Request body / params

| Field | Type | Required | Notes |
| - | - | - | - |
| `sessionId` | `string` | Yes | Managed upload session id in the path. |

This route does not take a request body.

#### Response body

```json
{
  "sessionId": "managed-session-id",
  "state": "completed",
  "strategy": "multipart",
  "expiresAt": "2026-03-13T09:00:00.000Z",
  "result": {
    "kind": "photo_backup",
    "mediaAssetId": "media-asset-id"
  }
}
```

Drive completions return `result.kind = "drive"` and `fileId`.

#### Errors and handling

- `400 INCOMPLETE_UPLOAD`: not all bytes or parts are ready; refresh or reconcile before retrying.
- `400 UPLOAD_SESSION_EXPIRED`: the session expired.
- `400 UPLOAD_SESSION_CANCELED`: the session was canceled and should not be retried.

#### Minimal curl example

```bash
curl -X POST https://youthful-fold.pipeops.app/v2/uploads/sessions/managed-session-id/complete \
  -H 'Authorization: Bearer api-access-token'
```

### POST /v2/uploads/sessions/:sessionId/cancel

#### What this endpoint does

Cancels the managed upload session and tells the API to stop treating it as an active upload.

#### When to call it

Call it when the user intentionally stops the upload or when your integration wants to abandon the session completely.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |
| `x-device-id` | Conditional | Optional for drive sessions, required when the session belongs to `photo_backup` |

#### Request body / params

| Field | Type | Required | Notes |
| - | - | - | - |
| `sessionId` | `string` | Yes | Managed upload session id in the path. |

This route does not take a request body.

#### Response body

```json
{
  "ok": true
}
```

#### Errors and handling

- `404 NOT_FOUND`: if the session is already gone, treat the upload as finished cleanup on the client.
- `401 AuthError`: refresh or re-exchange before retrying a protected cancel request.

#### Minimal curl example

```bash
curl -X POST https://youthful-fold.pipeops.app/v2/uploads/sessions/managed-session-id/cancel \
  -H 'Authorization: Bearer api-access-token'
```
