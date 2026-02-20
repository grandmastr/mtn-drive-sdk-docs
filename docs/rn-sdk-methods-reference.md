---
title: React Native SDK Methods Reference
---

This page is the full runtime contract for React Native consumers.

- It covers `sdk.client.*` module methods and `sdk.photoBackupUploadManager.backupAsset(...)`.
- Every method includes a request example, success response example, and failure example.
- All protected methods require a valid MTN user token through your `tokenStore`.

## Shared Error Shape

When a request fails, the SDK throws an `Error` subclass from `@pipeopshq/mtn-core`.
Most failures include this shape:

```json
{
  "name": "AuthError",
  "status": 401,
  "code": "MISSING_MTN_ACCESS_TOKEN",
  "message": "Missing MTN access token",
  "details": null
}
```

Common error names:

- `AuthError`
- `AuthExchangeError`
- `ValidationError`
- `NotFoundError`
- `ConflictError`
- `RateLimitError`
- `NetworkError`

## Shared Models

### `SessionInfo`

```json
{
  "id": "sess_current",
  "deviceName": "iPhone 15",
  "deviceType": "IOS",
  "isCurrent": true,
  "lastActiveAt": "2026-02-20T10:00:00.000Z",
  "expiresAt": "2026-02-20T10:30:00.000Z"
}
```

### `DriveItem`

```json
{
  "id": "item_123",
  "name": "contract.pdf",
  "type": "FILE",
  "parentId": "folder_001",
  "sizeBytes": 382112,
  "mimeType": "application/pdf",
  "storageKey": "org_1/user_1/contract.pdf",
  "updatedAt": "2026-02-20T08:00:00.000Z"
}
```

### `CursorListResponse<T>`

```json
{
  "items": [],
  "nextCursor": null
}
```

### `ShareRecord`

```json
{
  "id": "share_123",
  "itemId": "item_123",
  "permission": "VIEW",
  "expiresAt": "2026-03-01T00:00:00.000Z",
  "isRevoked": false,
  "targetType": "LINK",
  "url": "https://share.example/token"
}
```

### `StorageSummary`

```json
{
  "userUsedBytes": 1048576,
  "userLimitBytes": 1073741824,
  "orgUsedBytes": 5242880,
  "orgLimitBytes": 10737418240,
  "ok": true
}
```

### `PhotoBackupUploadSessionResult`

```json
{
  "deduped": false,
  "sessionId": "pbs_001",
  "strategy": "multipart",
  "partSize": 5242880,
  "parts": [
    {
      "partNumber": 1,
      "putUrl": "https://upload.example/part-1",
      "expiresAt": "2026-02-20T09:00:00.000Z"
    }
  ],
  "expiresAt": "2026-02-20T09:30:00.000Z"
}
```

## Sessions Module

### `sessions.list()`

Request example:

```ts
const sessions = await sdk.client.sessions.list();
```

Success response example:

```json
[
  {
    "id": "sess_current",
    "deviceName": "iPhone 15",
    "deviceType": "IOS",
    "isCurrent": true
  }
]
```

Failure example:

```json
{
  "name": "AuthExchangeError",
  "status": 401,
  "code": "EXTERNAL_TOKEN_VALIDATION_FAILED",
  "message": "Auth exchange failed"
}
```

### `sessions.revoke(sessionId)`

Request example:

```ts
const result = await sdk.client.sessions.revoke('sess_old_001');
```

Success response example:

```json
{ "ok": true }
```

Failure example:

```json
{
  "name": "NotFoundError",
  "status": 404,
  "code": "SESSION_NOT_FOUND",
  "message": "Session not found"
}
```

### `sessions.logoutOthers()`

Request example:

```ts
const result = await sdk.client.sessions.logoutOthers();
```

Success response example:

```json
{ "ok": true }
```

Failure example:

```json
{
  "name": "NetworkError",
  "code": "BACKEND_UNAVAILABLE",
  "message": "fetch failed"
}
```

## Drive Module

### `drive.listItems(query?)`

Request example:

```ts
const page = await sdk.client.drive.listItems({
  limit: 20,
  cursor: null,
  parentId: 'folder_001',
});
```

Success response example:

```json
{
  "items": [{ "id": "item_123", "name": "contract.pdf", "type": "FILE" }],
  "nextCursor": "cursor_002"
}
```

Failure example:

```json
{
  "name": "ValidationError",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "limit must be positive"
}
```

### `drive.search(query)`

Request example:

```ts
const page = await sdk.client.drive.search({ q: 'contract', limit: 20 });
```

Success response example:

```json
{
  "items": [{ "id": "item_123", "name": "contract.pdf", "type": "FILE" }],
  "nextCursor": null
}
```

Failure example:

```json
{
  "name": "RateLimitError",
  "status": 429,
  "code": "RATE_LIMIT",
  "message": "Too many requests"
}
```

### `drive.listShared(query?)`

Request example:

```ts
const shared = await sdk.client.drive.listShared({ limit: 20 });
```

Success response example:

```json
{
  "items": [{ "id": "item_shared_1", "name": "Team Plan.docx", "type": "FILE" }],
  "nextCursor": null
}
```

Failure example:

```json
{
  "name": "AuthError",
  "status": 401,
  "code": "AUTH_ERROR",
  "message": "Unauthorized"
}
```

### `drive.listSharedByMe(query?)`

Request example:

```ts
const sharedByMe = await sdk.client.drive.listSharedByMe({ limit: 20 });
```

Success response example:

```json
{
  "items": [{ "id": "item_owned_1", "name": "Budget.xlsx", "type": "FILE" }],
  "nextCursor": null
}
```

Failure example:

```json
{
  "name": "AuthError",
  "status": 403,
  "code": "AUTH_ERROR",
  "message": "Forbidden"
}
```

### `drive.stats()`

Request example:

```ts
const stats = await sdk.client.drive.stats();
```

Success response example:

```json
{
  "itemsCount": 348,
  "foldersCount": 22,
  "filesCount": 326,
  "totalBytes": 734003200
}
```

Failure example:

```json
{
  "name": "SdkError",
  "status": 500,
  "code": "SDK_ERROR",
  "message": "Unexpected backend response"
}
```

### `drive.createFolder(body)`

Request example:

```ts
const folder = await sdk.client.drive.createFolder({
  name: 'Invoices',
  parentId: 'folder_001',
});
```

Success response example:

```json
{
  "ok": true,
  "id": "folder_002",
  "name": "Invoices",
  "parentId": "folder_001"
}
```

Failure example:

```json
{
  "name": "ConflictError",
  "status": 409,
  "code": "CONFLICT",
  "message": "Folder name already exists"
}
```

### `drive.createUploadSession(body)`

Request example:

```ts
const session = await sdk.client.drive.createUploadSession({
  filename: 'invoice.pdf',
  sizeBytes: 200000,
  mimeType: 'application/pdf',
  contentHash: '7c9f0b6f0f3a8e9f95c0f3d7d95c3f2d4a2a3d5d0c7a8d8f2b6c1e4f7a9b0c1d',
  parentId: 'folder_001',
});
```

Success response example:

```json
{
  "fileId": "item_upload_1",
  "putUrl": "https://upload.example/single",
  "headers": { "Content-Type": "application/pdf" },
  "expiresAt": "2026-02-20T10:45:00.000Z"
}
```

Failure example:

```json
{
  "name": "ValidationError",
  "status": 400,
  "code": "INVALID_INPUT",
  "message": "contentHash must be 64-char hex"
}
```

### `drive.createMultipartSession(body)`

Request example:

```ts
const multipart = await sdk.client.drive.createMultipartSession({
  filename: 'video.mp4',
  sizeBytes: 25000000,
  mimeType: 'video/mp4',
  contentHash: '7c9f0b6f0f3a8e9f95c0f3d7d95c3f2d4a2a3d5d0c7a8d8f2b6c1e4f7a9b0c1d',
});
```

Success response example:

```json
{
  "fileId": "item_upload_2",
  "uploadId": "up_001",
  "partSize": 5242880,
  "parts": [{ "partNumber": 1, "putUrl": "https://upload.example/part-1" }]
}
```

Failure example:

```json
{
  "name": "SdkError",
  "status": 422,
  "code": "UPLOAD_STRATEGY_ERROR",
  "message": "Multipart session could not be initialized"
}
```

### `drive.createMultipartPartUrl(fileId, body)`

Request example:

```ts
const partUrl = await sdk.client.drive.createMultipartPartUrl('item_upload_2', {
  uploadId: 'up_001',
  partNumber: 2,
});
```

Success response example:

```json
{
  "putUrl": "https://upload.example/part-2"
}
```

Failure example:

```json
{
  "name": "NotFoundError",
  "status": 404,
  "code": "UPLOAD_SESSION_NOT_FOUND",
  "message": "Upload session not found"
}
```

### `drive.completeMultipartSession(fileId, body)`

Request example:

```ts
const completed = await sdk.client.drive.completeMultipartSession('item_upload_2', {
  uploadId: 'up_001',
  parts: [
    { partNumber: 1, etag: 'etag-1', byteSize: 5242880 },
    { partNumber: 2, etag: 'etag-2', byteSize: 5242880 },
  ],
});
```

Success response example:

```json
{ "ok": true, "uploadId": "up_001" }
```

Failure example:

```json
{
  "name": "ValidationError",
  "status": 400,
  "code": "INVALID_PARTS",
  "message": "Missing part etag"
}
```

### `drive.abortMultipartSession(fileId, body)`

Request example:

```ts
const aborted = await sdk.client.drive.abortMultipartSession('item_upload_2', {
  uploadId: 'up_001',
});
```

Success response example:

```json
{ "ok": true }
```

Failure example:

```json
{
  "name": "NotFoundError",
  "status": 404,
  "code": "UPLOAD_SESSION_NOT_FOUND",
  "message": "Upload session not found"
}
```

### `drive.uploadEncrypted(body)`

Request example:

```ts
const encrypted = await sdk.client.drive.uploadEncrypted({
  filename: 'sensitive.pdf',
  encryptedBlob: 'base64-payload',
  encryptionKeyId: 'key_001',
});
```

Success response example:

```json
{ "ok": true, "fileId": "item_enc_1", "uploadStatus": "completed" }
```

Failure example:

```json
{
  "name": "ValidationError",
  "status": 422,
  "code": "ENCRYPTION_PAYLOAD_INVALID",
  "message": "Encrypted payload missing fields"
}
```

### `drive.completeUpload(body)`

Request example:

```ts
const complete = await sdk.client.drive.completeUpload({ fileId: 'item_upload_2' });
```

Success response example:

```json
{ "ok": true, "etag": "etag-final", "size": 10485760 }
```

Failure example:

```json
{
  "name": "ConflictError",
  "status": 409,
  "code": "UPLOAD_NOT_READY",
  "message": "Upload parts are incomplete"
}
```

### `drive.getDownloadUrl(itemId, query?)`

Request example:

```ts
const urlPayload = await sdk.client.drive.getDownloadUrl('item_123', {
  disposition: 'attachment',
});
```

Success response example:

```json
{
  "url": "https://download.example/file",
  "expiresAt": "2026-02-20T11:00:00.000Z"
}
```

Failure example:

```json
{
  "name": "NotFoundError",
  "status": 404,
  "code": "FILE_NOT_FOUND",
  "message": "Item not found"
}
```

### `drive.getEncryptedDownload(itemId)`

Request example:

```ts
const payload = await sdk.client.drive.getEncryptedDownload('item_enc_1');
```

Success response example:

```json
{
  "url": "https://download.example/encrypted",
  "keyId": "key_001",
  "iv": "base64-iv"
}
```

Failure example:

```json
{
  "name": "AuthError",
  "status": 403,
  "code": "AUTH_ERROR",
  "message": "Not permitted to access encrypted item"
}
```

### `drive.getVersions(itemId)`

Request example:

```ts
const versions = await sdk.client.drive.getVersions('item_123');
```

Success response example:

```json
{
  "items": [
    { "versionId": "v3", "createdAt": "2026-02-20T09:00:00.000Z", "sizeBytes": 382112 },
    { "versionId": "v2", "createdAt": "2026-02-19T07:00:00.000Z", "sizeBytes": 380000 }
  ]
}
```

Failure example:

```json
{
  "name": "NotFoundError",
  "status": 404,
  "code": "VERSION_HISTORY_NOT_FOUND",
  "message": "No versions found"
}
```

### `drive.getShareLink(itemId)`

Request example:

```ts
const shareLink = await sdk.client.drive.getShareLink('item_123');
```

Success response example:

```json
{ "url": "https://share.example/tok_abc" }
```

Failure example:

```json
{
  "name": "ConflictError",
  "status": 409,
  "code": "SHARE_DISABLED",
  "message": "Sharing disabled for this item"
}
```

### `drive.getPreviewUrl(itemId)`

Request example:

```ts
const preview = await sdk.client.drive.getPreviewUrl('item_123');
```

Success response example:

```json
{
  "url": "https://preview.example/item_123",
  "expiresAt": "2026-02-20T11:00:00.000Z"
}
```

Failure example:

```json
{
  "name": "ValidationError",
  "status": 422,
  "code": "PREVIEW_NOT_SUPPORTED",
  "message": "Preview is not available for this file type"
}
```

### `drive.getMetadata(itemId)`

Request example:

```ts
const metadata = await sdk.client.drive.getMetadata('item_123');
```

Success response example:

```json
{
  "id": "item_123",
  "name": "contract.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 382112,
  "contentHash": "7c9f0b6f0f3a8e9f95c0f3d7d95c3f2d4a2a3d5d0c7a8d8f2b6c1e4f7a9b0c1d"
}
```

Failure example:

```json
{
  "name": "NotFoundError",
  "status": 404,
  "code": "FILE_NOT_FOUND",
  "message": "Item not found"
}
```

### `drive.updateItem(itemId, body)`

Request example:

```ts
const updated = await sdk.client.drive.updateItem('item_123', { name: 'contract-v2.pdf' });
```

Success response example:

```json
{ "ok": true, "id": "item_123", "name": "contract-v2.pdf" }
```

Failure example:

```json
{
  "name": "ValidationError",
  "status": 400,
  "code": "INVALID_INPUT",
  "message": "name is required"
}
```

### `drive.deleteItem(itemId, query?)`

Request example:

```ts
const deleted = await sdk.client.drive.deleteItem('item_123', { hard: 'false' });
```

Success response example:

```json
{ "ok": true }
```

Failure example:

```json
{
  "name": "NotFoundError",
  "status": 404,
  "code": "FILE_NOT_FOUND",
  "message": "Item not found"
}
```

### `drive.bulkDeleteItems(body)`

Request example:

```ts
const bulk = await sdk.client.drive.bulkDeleteItems({ ids: ['item_123', 'item_124'] });
```

Success response example:

```json
{ "ok": true, "deleted": 2 }
```

Failure example:

```json
{
  "name": "ValidationError",
  "status": 422,
  "code": "INVALID_INPUT",
  "message": "ids must contain at least one item"
}
```

### `drive.listTrash(query?)`

Request example:

```ts
const trash = await sdk.client.drive.listTrash({ limit: 20 });
```

Success response example:

```json
{
  "items": [{ "id": "item_trashed_1", "name": "old.csv", "type": "FILE" }],
  "nextCursor": null
}
```

Failure example:

```json
{
  "name": "AuthError",
  "status": 401,
  "code": "AUTH_ERROR",
  "message": "Unauthorized"
}
```

### `drive.restoreTrashItem(itemId)`

Request example:

```ts
const restored = await sdk.client.drive.restoreTrashItem('item_trashed_1');
```

Success response example:

```json
{ "ok": true, "id": "item_trashed_1" }
```

Failure example:

```json
{
  "name": "ConflictError",
  "status": 409,
  "code": "RESTORE_CONFLICT",
  "message": "Target folder already has an item with this name"
}
```

### `drive.bulkRestoreTrash(body)`

Request example:

```ts
const bulkRestore = await sdk.client.drive.bulkRestoreTrash({ ids: ['item_trashed_1'] });
```

Success response example:

```json
{ "ok": true, "restored": 1 }
```

Failure example:

```json
{
  "name": "ValidationError",
  "status": 422,
  "code": "INVALID_INPUT",
  "message": "ids must contain at least one item"
}
```

### `drive.purgeTrash()`

Request example:

```ts
const purged = await sdk.client.drive.purgeTrash();
```

Success response example:

```json
{ "ok": true, "purged": 4 }
```

Failure example:

```json
{
  "name": "RateLimitError",
  "status": 429,
  "code": "RATE_LIMIT",
  "message": "Too many purge requests"
}
```

### `drive.purgeTrashItem(itemId)`

Request example:

```ts
const purgedOne = await sdk.client.drive.purgeTrashItem('item_trashed_1');
```

Success response example:

```json
{ "ok": true }
```

Failure example:

```json
{
  "name": "NotFoundError",
  "status": 404,
  "code": "TRASH_ITEM_NOT_FOUND",
  "message": "Trash item not found"
}
```

### `drive.bulkPurgeTrash(body)`

Request example:

```ts
const bulkPurge = await sdk.client.drive.bulkPurgeTrash({
  ids: ['item_trashed_1', 'item_trashed_2'],
});
```

Success response example:

```json
{ "ok": true, "purged": 2 }
```

Failure example:

```json
{
  "name": "ValidationError",
  "status": 422,
  "code": "INVALID_INPUT",
  "message": "ids must be a non-empty array"
}
```

## Sharing Module

### `sharing.listShares()`

Request example:

```ts
const shares = await sdk.client.sharing.listShares();
```

Success response example:

```json
[
  {
    "id": "share_123",
    "itemId": "item_123",
    "permission": "VIEW",
    "targetType": "LINK",
    "isRevoked": false,
    "url": "https://share.example/tok_abc"
  }
]
```

Failure example:

```json
{
  "name": "AuthError",
  "status": 401,
  "code": "AUTH_ERROR",
  "message": "Unauthorized"
}
```

### `sharing.listItemAccess(itemId, query?)`

Request example:

```ts
const accessList = await sdk.client.sharing.listItemAccess('item_123', { limit: 20 });
```

Success response example:

```json
[{ "id": "acc_1", "principalType": "USER", "principal": "user@example.com", "permission": "VIEW" }]
```

Failure example:

```json
{
  "name": "NotFoundError",
  "status": 404,
  "code": "FILE_NOT_FOUND",
  "message": "Item not found"
}
```

### `sharing.createShare(body)`

Request example:

```ts
const share = await sdk.client.sharing.createShare({
  itemId: 'item_123',
  permission: 'VIEW',
  targetType: 'LINK',
});
```

Success response example:

```json
{
  "id": "share_123",
  "itemId": "item_123",
  "permission": "VIEW",
  "targetType": "LINK",
  "isRevoked": false,
  "url": "https://share.example/tok_abc"
}
```

Failure example:

```json
{
  "name": "ConflictError",
  "status": 409,
  "code": "SHARE_ALREADY_EXISTS",
  "message": "Share already exists"
}
```

### `sharing.updateShare(shareId, body)`

Request example:

```ts
const updated = await sdk.client.sharing.updateShare('share_123', {
  permission: 'EDIT',
  expiresAt: '2026-03-15T00:00:00.000Z',
});
```

Success response example:

```json
{
  "id": "share_123",
  "itemId": "item_123",
  "permission": "EDIT",
  "expiresAt": "2026-03-15T00:00:00.000Z",
  "targetType": "LINK",
  "isRevoked": false
}
```

Failure example:

```json
{
  "name": "ValidationError",
  "status": 422,
  "code": "INVALID_INPUT",
  "message": "permission value is invalid"
}
```

### `sharing.revokeShare(shareId)`

Request example:

```ts
const revoked = await sdk.client.sharing.revokeShare('share_123');
```

Success response example:

```json
{
  "id": "share_123",
  "isRevoked": true,
  "targetType": "LINK"
}
```

Failure example:

```json
{
  "name": "NotFoundError",
  "status": 404,
  "code": "SHARE_NOT_FOUND",
  "message": "Share not found"
}
```

### `sharing.deleteShare(shareId)`

Request example:

```ts
const removed = await sdk.client.sharing.deleteShare('share_123');
```

Success response example:

```json
{
  "id": "share_123",
  "isRevoked": true
}
```

Failure example:

```json
{
  "name": "NotFoundError",
  "status": 404,
  "code": "SHARE_NOT_FOUND",
  "message": "Share not found"
}
```

### `sharing.resolvePublicShare(token, query?)`

Request example:

```ts
const sharedRoot = await sdk.client.sharing.resolvePublicShare('public_token_abc', {
  password: 'optional-password',
});
```

Success response example:

```json
{
  "share": { "id": "share_123", "permission": "VIEW" },
  "item": { "id": "item_123", "name": "contract.pdf", "type": "FILE" }
}
```

Failure example:

```json
{
  "name": "NotFoundError",
  "status": 404,
  "code": "PUBLIC_SHARE_NOT_FOUND",
  "message": "Invalid public share token"
}
```

### `sharing.resolvePublicShareWithPassword(token, password)`

Request example:

```ts
const unlocked = await sdk.client.sharing.resolvePublicShareWithPassword(
  'public_token_abc',
  'CorrectHorseBatteryStaple',
);
```

Success response example:

```json
{
  "share": { "id": "share_123", "permission": "VIEW" },
  "unlocked": true
}
```

Failure example:

```json
{
  "name": "AuthError",
  "status": 401,
  "code": "PUBLIC_SHARE_PASSWORD_INVALID",
  "message": "Invalid share password"
}
```

### `sharing.listPublicShareItems(token, query?)`

Request example:

```ts
const publicItems = await sdk.client.sharing.listPublicShareItems('public_token_abc', {
  cursor: null,
  limit: 50,
});
```

Success response example:

```json
{
  "items": [{ "id": "item_1", "name": "photo.jpg", "type": "FILE" }],
  "nextCursor": null
}
```

Failure example:

```json
{
  "name": "RateLimitError",
  "status": 429,
  "code": "RATE_LIMIT",
  "message": "Too many requests"
}
```

### `sharing.resolvePublicShareItem(token, itemId, query?)`

Request example:

```ts
const publicItem = await sdk.client.sharing.resolvePublicShareItem('public_token_abc', 'item_1', {
  password: 'optional-password',
});
```

Success response example:

```json
{
  "id": "item_1",
  "name": "photo.jpg",
  "type": "FILE",
  "downloadUrl": "https://download.example/public/item_1"
}
```

Failure example:

```json
{
  "name": "NotFoundError",
  "status": 404,
  "code": "PUBLIC_ITEM_NOT_FOUND",
  "message": "Item not found in shared folder"
}
```

### `sharing.cleanupExpiredShares()`

Request example:

```ts
const cleanup = await sdk.client.sharing.cleanupExpiredShares();
```

Success response example:

```json
{ "revoked": 12 }
```

Failure example:

```json
{
  "name": "AuthError",
  "status": 403,
  "code": "AUTH_ERROR",
  "message": "Operation requires higher privileges"
}
```

## Bin Module

### `bin.list(query?)`

Request example:

```ts
const trash = await sdk.client.bin.list({ limit: 20 });
```

Success response example:

```json
{
  "items": [{ "id": "item_trashed_1", "name": "old.csv", "type": "FILE" }],
  "nextCursor": null
}
```

Failure example:

```json
{
  "name": "AuthError",
  "status": 401,
  "code": "AUTH_ERROR",
  "message": "Unauthorized"
}
```

### `bin.restore(itemId)`

Request example:

```ts
const restored = await sdk.client.bin.restore('item_trashed_1');
```

Success response example:

```json
{ "ok": true }
```

Failure example:

```json
{
  "name": "ConflictError",
  "status": 409,
  "code": "RESTORE_CONFLICT",
  "message": "Item name already exists at destination"
}
```

### `bin.bulkRestore(itemIds)`

Request example:

```ts
const restoredMany = await sdk.client.bin.bulkRestore(['item_trashed_1', 'item_trashed_2']);
```

Success response example:

```json
{ "ok": true, "restored": 2 }
```

Failure example:

```json
{
  "name": "ValidationError",
  "status": 422,
  "code": "INVALID_INPUT",
  "message": "itemIds must be non-empty"
}
```

### `bin.purgeAll()`

Request example:

```ts
const purged = await sdk.client.bin.purgeAll();
```

Success response example:

```json
{ "ok": true, "purged": 11 }
```

Failure example:

```json
{
  "name": "RateLimitError",
  "status": 429,
  "code": "RATE_LIMIT",
  "message": "Too many purge operations"
}
```

### `bin.purgeOne(itemId)`

Request example:

```ts
const purgedOne = await sdk.client.bin.purgeOne('item_trashed_1');
```

Success response example:

```json
{ "ok": true }
```

Failure example:

```json
{
  "name": "NotFoundError",
  "status": 404,
  "code": "TRASH_ITEM_NOT_FOUND",
  "message": "Item not found"
}
```

### `bin.bulkPurge(itemIds)`

Request example:

```ts
const purgedMany = await sdk.client.bin.bulkPurge(['item_trashed_1', 'item_trashed_2']);
```

Success response example:

```json
{ "ok": true, "purged": 2 }
```

Failure example:

```json
{
  "name": "ValidationError",
  "status": 422,
  "code": "INVALID_INPUT",
  "message": "itemIds must be non-empty"
}
```

## Photo Backup Module

### `photoBackup.registerDevice(body)`

Request example:

```ts
const registration = await sdk.client.photoBackup.registerDevice({
  platform: 'ios',
  name: 'iPhone 15 Pro',
});
```

Success response example:

```json
{ "ok": true, "deviceId": "dev_001" }
```

Failure example:

```json
{
  "name": "ValidationError",
  "status": 400,
  "code": "INVALID_INPUT",
  "message": "platform is invalid"
}
```

### `photoBackup.createSession(body)`

Request example:

```ts
const session = await sdk.client.photoBackup.createSession({
  contentHash: '7c9f0b6f0f3a8e9f95c0f3d7d95c3f2d4a2a3d5d0c7a8d8f2b6c1e4f7a9b0c1d',
  byteSize: 7864320,
  mimeType: 'image/jpeg',
  filename: 'IMG_1001.jpg',
  capturedAt: '2026-02-20T08:15:00.000Z',
  width: 4032,
  height: 3024,
});
```

Success response example:

```json
{
  "deduped": false,
  "sessionId": "pbs_001",
  "strategy": "single",
  "putUrl": "https://upload.example/photo",
  "expiresAt": "2026-02-20T10:30:00.000Z"
}
```

Failure example:

```json
{
  "name": "ConflictError",
  "status": 409,
  "code": "UPLOAD_ALREADY_IN_PROGRESS",
  "message": "Another upload session exists for this asset"
}
```

### `photoBackup.refreshSession(sessionId)`

Request example:

```ts
const refreshed = await sdk.client.photoBackup.refreshSession('pbs_001');
```

Success response example:

```json
{
  "sessionId": "pbs_001",
  "parts": [{ "partNumber": 2, "putUrl": "https://upload.example/part-2" }],
  "expiresAt": "2026-02-20T10:45:00.000Z"
}
```

Failure example:

```json
{
  "name": "NotFoundError",
  "status": 404,
  "code": "UPLOAD_SESSION_NOT_FOUND",
  "message": "Session not found"
}
```

### `photoBackup.confirmPart(sessionId, partNumber, body)`

Request example:

```ts
const confirmed = await sdk.client.photoBackup.confirmPart('pbs_001', 1, {
  etag: 'part-etag-1',
  byteSize: 5242880,
});
```

Success response example:

```json
{ "ok": true }
```

Failure example:

```json
{
  "name": "ValidationError",
  "status": 422,
  "code": "INVALID_PART",
  "message": "Part byteSize mismatch"
}
```

### `photoBackup.completeSession(sessionId, body)`

Request example:

```ts
const completed = await sdk.client.photoBackup.completeSession('pbs_001', {
  contentHash: '7c9f0b6f0f3a8e9f95c0f3d7d95c3f2d4a2a3d5d0c7a8d8f2b6c1e4f7a9b0c1d',
  filename: 'IMG_1001.jpg',
  capturedAt: '2026-02-20T08:15:00.000Z',
  width: 4032,
  height: 3024,
});
```

Success response example:

```json
{ "deduped": false, "mediaAssetId": "media_001" }
```

Failure example:

```json
{
  "name": "ConflictError",
  "status": 409,
  "code": "UPLOAD_INCOMPLETE",
  "message": "Not all parts are confirmed"
}
```

### `photoBackup.abortSession(sessionId)`

Request example:

```ts
const aborted = await sdk.client.photoBackup.abortSession('pbs_001');
```

Success response example:

```json
{ "ok": true }
```

Failure example:

```json
{
  "name": "NotFoundError",
  "status": 404,
  "code": "UPLOAD_SESSION_NOT_FOUND",
  "message": "Session not found"
}
```

### `photoBackup.reconcileSession(sessionId)`

Request example:

```ts
const reconciled = await sdk.client.photoBackup.reconcileSession('pbs_001');
```

Success response example:

```json
{ "reconciled": true, "deduped": false, "mediaAssetId": "media_001" }
```

Failure example:

```json
{
  "name": "SdkError",
  "status": 500,
  "code": "RECONCILE_FAILED",
  "message": "Upload session could not be reconciled"
}
```

### `photoBackup.listMedia(query?)`

Request example:

```ts
const mediaPage = await sdk.client.photoBackup.listMedia({ limit: 50, cursor: null });
```

Success response example:

```json
{
  "items": [{ "id": "media_001", "filename": "IMG_1001.jpg", "mimeType": "image/jpeg" }],
  "nextCursor": null
}
```

Failure example:

```json
{
  "name": "AuthError",
  "status": 401,
  "code": "AUTH_ERROR",
  "message": "Unauthorized"
}
```

### `photoBackup.getMediaDetail(mediaAssetId)`

Request example:

```ts
const media = await sdk.client.photoBackup.getMediaDetail('media_001');
```

Success response example:

```json
{
  "id": "media_001",
  "filename": "IMG_1001.jpg",
  "mimeType": "image/jpeg",
  "byteSize": 7864320,
  "capturedAt": "2026-02-20T08:15:00.000Z"
}
```

Failure example:

```json
{
  "name": "NotFoundError",
  "status": 404,
  "code": "MEDIA_NOT_FOUND",
  "message": "Media asset not found"
}
```

### `photoBackup.createDownloadUrl(mediaAssetId)`

Request example:

```ts
const download = await sdk.client.photoBackup.createDownloadUrl('media_001');
```

Success response example:

```json
{
  "url": "https://download.example/media_001",
  "expiresAt": "2026-02-20T11:00:00.000Z"
}
```

Failure example:

```json
{
  "name": "AuthError",
  "status": 403,
  "code": "AUTH_ERROR",
  "message": "Forbidden"
}
```

### `photoBackup.createThumbnailUrl(mediaAssetId, variant)`

Request example:

```ts
const thumbnail = await sdk.client.photoBackup.createThumbnailUrl('media_001', 'medium');
```

Success response example:

```json
{
  "url": "https://thumb.example/media_001?variant=medium",
  "expiresAt": "2026-02-20T11:00:00.000Z"
}
```

Failure example:

```json
{
  "name": "ValidationError",
  "status": 422,
  "code": "INVALID_INPUT",
  "message": "variant is invalid"
}
```

### `photoBackup.requeueThumbnails(mediaAssetId)`

Request example:

```ts
const requeued = await sdk.client.photoBackup.requeueThumbnails('media_001');
```

Success response example:

```json
{ "ok": true }
```

Failure example:

```json
{
  "name": "ConflictError",
  "status": 409,
  "code": "THUMBNAIL_JOB_ALREADY_RUNNING",
  "message": "Thumbnail generation already in progress"
}
```

### `photoBackup.deleteMedia(mediaAssetId)`

Request example:

```ts
const deleted = await sdk.client.photoBackup.deleteMedia('media_001');
```

Success response example:

```json
{ "ok": true }
```

Failure example:

```json
{
  "name": "NotFoundError",
  "status": 404,
  "code": "MEDIA_NOT_FOUND",
  "message": "Media asset not found"
}
```

## Storage Module

### `storage.summary()`

Request example:

```ts
const summary = await sdk.client.storage.summary();
```

Success response example:

```json
{
  "userUsedBytes": 1048576,
  "userLimitBytes": 1073741824,
  "orgUsedBytes": 5242880,
  "orgLimitBytes": 10737418240,
  "ok": true
}
```

Failure example:

```json
{
  "name": "AuthError",
  "status": 401,
  "code": "AUTH_ERROR",
  "message": "Unauthorized"
}
```

### `storage.distribution()`

Request example:

```ts
const distribution = await sdk.client.storage.distribution();
```

Success response example:

```json
{
  "documents": 125829120,
  "photos": 524288000,
  "videos": 73400320,
  "others": 15728640
}
```

Failure example:

```json
{
  "name": "SdkError",
  "status": 500,
  "code": "SDK_ERROR",
  "message": "Could not compute storage distribution"
}
```

## React Native Upload Manager

This is the RN-specific high-level helper exposed as `sdk.photoBackupUploadManager`.

### `photoBackupUploadManager.backupAsset(input)`

Request example:

```ts
const result = await sdk.photoBackupUploadManager.backupAsset({
  uri: 'file:///data/user/0/app/cache/IMG_1001.jpg',
  filename: 'IMG_1001.jpg',
  mimeType: 'image/jpeg',
  capturedAt: '2026-02-20T08:15:00.000Z',
  width: 4032,
  height: 3024,
  onProgress: ({ uploadedBytes, totalBytes }) => {
    console.log(`Uploaded ${uploadedBytes}/${totalBytes}`);
  },
});
```

Success response example:

```json
{
  "deduped": false,
  "mediaAssetId": "media_001",
  "sessionId": "pbs_001"
}
```

Failure example:

```json
{
  "name": "Error",
  "message": "Multipart upload adapter must return etag for each part upload"
}
```

Additional failure example:

```json
{
  "name": "Error",
  "message": "Invalid upload session response: missing sessionId or strategy"
}
```

## Practical Integration Sequence

1. Create SDK with `createRNClient(...)`.
2. Verify auth + session with `sessions.list()`.
3. Load dashboard with `storage.summary()` and `storage.distribution()`.
4. Build file views with `drive.listItems()` and `drive.search()`.
5. Implement sharing with `sharing.createShare()`, `sharing.listShares()`, `sharing.revokeShare()`.
6. Implement recycle bin with `bin.list()`, `bin.restore()`, `bin.purgeOne()`.
7. Implement media backup using `photoBackupUploadManager.backupAsset(...)`.
8. Handle failures by checking `error.name`, `error.code`, and `error.status`.
