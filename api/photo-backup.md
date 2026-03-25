---
title: Photo Backup
---

Use the photo-backup routes to register a device, upload media with managed uploads, list media assets, retrieve original or thumbnail URLs, and soft-delete assets.

## Before You Start

- You already completed [Service Integration](/api/service-integration) and have a valid bearer token.
- You can generate and persist one stable `x-device-id` value per installation or device.
- If you are uploading new assets, you plan to use [Managed Uploads](/api/managed-uploads) with `target.kind = photo_backup`.

## What the photo-backup surface covers

This section focuses on the device and media routes that sit around the upload flow.

It covers:

- device registration through `POST /v1/devices/register`
- media listing through `GET /v1/media`
- media detail lookup through `GET /v1/media/:mediaAssetId`
- original download URLs through `POST /v1/media/:mediaAssetId/download-url`
- thumbnail URLs through `POST /v1/media/:mediaAssetId/thumbnail-url`
- thumbnail regeneration through `POST /v1/media/:mediaAssetId/requeue-thumbnails`
- asset deletion through `DELETE /v1/media/:mediaAssetId`

## Device identity rule

The `x-device-id` header is part of the photo-backup contract.

- It is required on `POST /v1/devices/register`.
- It is required on `photo_backup` managed upload calls under `/v2/uploads`.
- It should remain stable for the same installation so the API can associate media and backup state with the correct device.

The media browsing routes under `/v1/media` use bearer auth and do not require `x-device-id`.

## How photo backup fits with managed uploads

Use `/v2/uploads` with `target.kind = photo_backup` for new uploads.

Once the upload completes and returns `result.kind = "photo_backup"`, switch to `/v1/media` routes to:

- list the media library
- inspect one media asset
- create original-download and thumbnail URLs
- requeue thumbnails if needed
- soft-delete the asset

Legacy routes under `/v1/uploads` still exist for older photo-backup clients, but new partner integrations should prefer [Managed Uploads](/api/managed-uploads).

## Recommended flow

1. Call `POST /v1/devices/register` with a stable `x-device-id`.
2. Create an upload session through `POST /v2/uploads/sessions` with `target.kind = photo_backup` and the same `x-device-id`.
3. Upload, confirm, and complete the managed upload session.
4. Call `GET /v1/media` to list the newly available media asset.
5. Call `POST /v1/media/:mediaAssetId/download-url` or `POST /v1/media/:mediaAssetId/thumbnail-url` when you need a retrievable URL.
6. Call `POST /v1/media/:mediaAssetId/requeue-thumbnails` or `DELETE /v1/media/:mediaAssetId` when maintenance actions are needed.

## Minimal examples

Register the device:

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

List media assets:

```bash
curl 'https://youthful-fold.pipeops.app/v1/media?limit=50' \
  -H 'Authorization: Bearer api-access-token'
```

Create a thumbnail URL:

```bash
curl -X POST 'https://youthful-fold.pipeops.app/v1/media/media-asset-id/thumbnail-url?variant=small' \
  -H 'Authorization: Bearer api-access-token'
```

## How to verify this worked

1. Call `POST /v1/devices/register` and confirm the response includes a device `id` and `lastSeenAt`.
2. Upload one asset through [Managed Uploads](/api/managed-uploads) with `target.kind = photo_backup`.
3. Confirm the completed upload result includes a `mediaAssetId`.
4. Call `GET /v1/media` and confirm the asset appears in `items`.
5. Call `POST /v1/media/:mediaAssetId/download-url` or `POST /v1/media/:mediaAssetId/thumbnail-url`.
6. Optionally call `DELETE /v1/media/:mediaAssetId` and confirm the delete response is `{ "ok": true }`.

## What to read next

- [API Reference: Photo Backup](/api/api-reference-photo-backup)
- [Managed Uploads](/api/managed-uploads)
