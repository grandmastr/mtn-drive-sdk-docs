---
title: Drive
---

Use the `/drive` routes to browse, search, download, organize, trash, and restore MTN Drive files and folders after service integration.

## Before You Start

- You already completed [Service Integration](/api/service-integration) and have a valid bearer token.
- If you are creating new drive files, you plan to upload them through [Managed Uploads](/api/managed-uploads).
- You can persist drive item ids such as `parentId`, `fileId`, and `folderId` between requests.

## What `/drive` covers

The drive surface is the content-management layer for MTN Drive.

It covers:

- folder and file listing through `GET /drive/items`
- fuzzy search through `GET /drive/search`
- counters through `GET /drive/stats`
- folder creation through `POST /drive/folders`
- download-link and metadata retrieval through `GET /drive/items/:id/download-url` and `GET /drive/items/:id/metadata`
- rename, move, and star updates through `PATCH /drive/items/:id`
- delete, trash listing, and restore through `DELETE /drive/items/:id`, `GET /drive/trash`, and `POST /drive/trash/:id/restore`

## How drive fits with managed uploads

Use `/v2/uploads` when the user is adding new file bytes to drive.

Once the upload completes and returns `result.kind = "drive"`, switch to `/drive` routes to:

- list the folder that now contains the file
- fetch a download URL or preview URL
- inspect metadata
- rename, move, star, delete, or restore the item later

Legacy direct-upload routes such as `/drive/upload-sessions`, `/drive/multipart-sessions`, and `/drive/upload-complete` still exist for lower-level clients, but new partner integrations should prefer [Managed Uploads](/api/managed-uploads).

## Recommended flow

1. Call `GET /drive/items` to load the current folder or root.
2. Call `POST /drive/folders` if you need a destination folder first.
3. Upload the file through `POST /v2/uploads/sessions` with `target.kind = drive`.
4. Call `GET /drive/items/:id/download-url` or `GET /drive/items/:id/metadata` when you need to read the uploaded object back.
5. Call `PATCH /drive/items/:id` to rename, move, or star the item.
6. Call `DELETE /drive/items/:id` when the item should move to trash, then `POST /drive/trash/:id/restore` if it needs to come back.

## Minimal examples

List the root or one folder:

```bash
curl 'https://youthful-fold.pipeops.app/drive/items?parentId=folder-id&limit=50' \
  -H 'Authorization: Bearer api-access-token'
```

Create a folder:

```bash
curl -X POST https://youthful-fold.pipeops.app/drive/folders \
  -H 'Authorization: Bearer api-access-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "parentId": "folder-id",
    "name": "Receipts"
  }'
```

Fetch a download URL for one file:

```bash
curl 'https://youthful-fold.pipeops.app/drive/items/file-id/download-url?disposition=attachment' \
  -H 'Authorization: Bearer api-access-token'
```

## How to verify this worked

1. Call `GET /drive/items` and confirm you receive `items` and `nextCursor`.
2. Create a folder with `POST /drive/folders` and confirm the returned object has `type: "FOLDER"`.
3. Upload one file through [Managed Uploads](/api/managed-uploads) with `target.kind = drive`.
4. Confirm the completed upload result includes a `fileId`.
5. Call `GET /drive/items/:id/download-url` or `GET /drive/items/:id/metadata` with that `fileId`.
6. Delete the item and confirm it appears in `GET /drive/trash`, then restore it.

## What to read next

- [API Reference: Drive](/api/api-reference-drive)
- [Managed Uploads](/api/managed-uploads)
