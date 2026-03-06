---
title: "API Reference: Photo Backup"
---

Use these routes for the photo-backup device and media lifecycle. New uploads should go through [Managed Uploads](/api/managed-uploads) with `target.kind = photo_backup`; this reference covers the surrounding device-registration and media-retrieval surfaces.

## Prerequisites

- You already completed [Authentication](/api/authentication).
- You can generate and persist one stable `x-device-id` value per device or installation.
- You will use [Managed Uploads](/api/managed-uploads) for new photo-backup uploads rather than the legacy `/v1/uploads` flow.

### POST /v1/devices/register

#### What this endpoint does

Creates or refreshes the calling photo-backup device record.

#### When to call it

Call it before the first `photo_backup` upload for one installation and again whenever you need to refresh the device record.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |
| `Content-Type` | Yes | `application/json` |
| `x-device-id` | Yes | Stable device identifier for this installation |

#### Request body / params

```json
{
  "platform": "android",
  "name": "Pixel 9 Pro"
}
```

| Field | Type | Required | Notes |
| - | - | - | - |
| `platform` | `ios \| android` | No | Platform hint used by the API. |
| `name` | `string` | No | Optional device label up to 200 characters. |

#### Response body

```json
{
  "id": "device-abc123",
  "platform": "IOS",
  "name": "Jane's iPhone",
  "createdAt": "2026-03-06T10:00:00.000Z",
  "lastSeenAt": "2026-03-06T10:00:00.000Z"
}
```

#### Errors and handling

- `400 DEVICE_ID_REQUIRED`: the `x-device-id` header is missing or invalid.
- `400 ValidationError`: the body contains an invalid platform or name value.
- `401 Unauthorized` or `403 Forbidden`: authentication or permission failure.

#### Minimal curl example

```bash
curl -X POST https://youthful-fold.pipeops.app/v1/devices/register \
  -H 'Authorization: Bearer api-access-token' \
  -H 'Content-Type: application/json' \
  -H 'x-device-id: device-123' \
  -d '{
    "platform": "android",
    "name": "Pixel 9 Pro"
  }'
```

### GET /v1/media

#### What this endpoint does

Lists photo-backup media assets for the current caller.

#### When to call it

Call it when the client needs to render the media library or paginate through backed-up assets.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |

#### Request body / params

| Field | Type | Required | Notes |
| - | - | - | - |
| `cursor` | `string` | No | Pagination cursor from the previous media response. |
| `limit` | `number` | No | Page size from `1` to `200`. |
| `includeDeleted` | `string` | No | Boolean-like flag such as `true`, `1`, `yes`, or `on`. |

This route does not take a request body.

#### Response body

```json
{
  "items": [
    {
      "id": "media-asset-id",
      "createdAt": "2026-03-06T10:00:00.000Z",
      "capturedAt": "2026-03-06T09:55:00.000Z",
      "byteSize": 2457600,
      "mimeType": "image/jpeg",
      "width": 3024,
      "height": 4032,
      "status": "uploaded"
    }
  ],
  "nextCursor": null
}
```

#### Errors and handling

- `400 INVALID_CURSOR`: the cursor or another query value is invalid.
- `401 Unauthorized` or `403 Forbidden`: authentication or permission failure.

#### Minimal curl example

```bash
curl 'https://youthful-fold.pipeops.app/v1/media?limit=50' \
  -H 'Authorization: Bearer api-access-token'
```

### GET /v1/media/:mediaAssetId

#### What this endpoint does

Returns detail for one media asset, including thumbnail metadata when available.

#### When to call it

Call it when the user opens one photo-backup asset or when you need its richer metadata.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |

#### Request body / params

| Field | Type | Required | Notes |
| - | - | - | - |
| `mediaAssetId` | `string` | Yes | Media asset id in the path. |

This route does not take a request body.

#### Response body

```json
{
  "id": "media-asset-id",
  "createdAt": "2026-03-06T10:00:00.000Z",
  "capturedAt": "2026-03-06T09:55:00.000Z",
  "byteSize": 2457600,
  "mimeType": "image/jpeg",
  "width": 3024,
  "height": 4032,
  "status": "uploaded",
  "originalFilename": "IMG_0001.JPG",
  "thumbnails": [
    {
      "variant": "small",
      "byteSize": 28443,
      "createdAt": "2026-03-06T10:03:00.000Z"
    }
  ]
}
```

#### Errors and handling

- `404 NotFound`: the media asset does not exist or is not accessible.
- `401 Unauthorized` or `403 Forbidden`: authentication or permission failure.

#### Minimal curl example

```bash
curl https://youthful-fold.pipeops.app/v1/media/media-asset-id \
  -H 'Authorization: Bearer api-access-token'
```

### POST /v1/media/:mediaAssetId/download-url

#### What this endpoint does

Creates a presigned download URL for the original uploaded media asset.

#### When to call it

Call it when the client needs the original image or video bytes.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |

#### Request body / params

| Field | Type | Required | Notes |
| - | - | - | - |
| `mediaAssetId` | `string` | Yes | Media asset id in the path. |

This route does not take a request body.

#### Response body

```json
{
  "url": "https://storage.example.com/original-download-url",
  "expiresAt": "2026-03-06T10:15:00.000Z"
}
```

#### Errors and handling

- `404 NotFound`: the media asset does not exist or is not accessible.
- `401 Unauthorized` or `403 Forbidden`: authentication or permission failure.

#### Minimal curl example

```bash
curl -X POST https://youthful-fold.pipeops.app/v1/media/media-asset-id/download-url \
  -H 'Authorization: Bearer api-access-token'
```

### POST /v1/media/:mediaAssetId/thumbnail-url

#### What this endpoint does

Creates a presigned download URL for one generated thumbnail variant.

#### When to call it

Call it when the client needs a small, medium, or large thumbnail URL for display.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |

#### Request body / params

| Field | Type | Required | Notes |
| - | - | - | - |
| `mediaAssetId` | `string` | Yes | Media asset id in the path. |
| `variant` | `string` | No | Thumbnail variant such as `small`, `medium`, or `large`. |

This route does not take a request body.

#### Response body

```json
{
  "url": "https://storage.example.com/thumbnail-download-url",
  "expiresAt": "2026-03-06T10:15:00.000Z"
}
```

#### Errors and handling

- `400 INVALID_REQUEST`: the thumbnail variant is invalid.
- `404 NotFound`: the media asset or requested thumbnail is not available.
- `401 Unauthorized` or `403 Forbidden`: authentication or permission failure.

#### Minimal curl example

```bash
curl -X POST 'https://youthful-fold.pipeops.app/v1/media/media-asset-id/thumbnail-url?variant=small' \
  -H 'Authorization: Bearer api-access-token'
```

### POST /v1/media/:mediaAssetId/requeue-thumbnails

#### What this endpoint does

Requeues thumbnail generation for an uploaded media asset.

#### When to call it

Call it when thumbnails are missing or need to be regenerated after an interrupted processing flow.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |

#### Request body / params

| Field | Type | Required | Notes |
| - | - | - | - |
| `mediaAssetId` | `string` | Yes | Media asset id in the path. |

This route does not take a request body.

#### Response body

```json
{
  "ok": true
}
```

#### Errors and handling

- `404 NotFound`: the media asset does not exist or is not accessible.
- `400 ValidationError`: the asset is not in a state that can be requeued.
- `401 Unauthorized` or `403 Forbidden`: authentication or permission failure.

#### Minimal curl example

```bash
curl -X POST https://youthful-fold.pipeops.app/v1/media/media-asset-id/requeue-thumbnails \
  -H 'Authorization: Bearer api-access-token'
```

### DELETE /v1/media/:mediaAssetId

#### What this endpoint does

Soft-deletes one photo-backup media asset.

#### When to call it

Call it when the asset should leave the active media library while following the API's delete behavior.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |

#### Request body / params

| Field | Type | Required | Notes |
| - | - | - | - |
| `mediaAssetId` | `string` | Yes | Media asset id in the path. |

This route does not take a request body.

#### Response body

```json
{
  "ok": true
}
```

#### Errors and handling

- `404 NotFound`: the media asset does not exist or is already unavailable.
- `401 Unauthorized` or `403 Forbidden`: authentication or permission failure.

#### Minimal curl example

```bash
curl -X DELETE https://youthful-fold.pipeops.app/v1/media/media-asset-id \
  -H 'Authorization: Bearer api-access-token'
```
