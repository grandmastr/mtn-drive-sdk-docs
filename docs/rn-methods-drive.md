---
title: "RN Methods: Drive"
---

Browse files and folders, run uploads, fetch signed URLs, update metadata, and manage trash lifecycle operations.

## Prerequisites

- SDK client created with `createRNClient(...)`
- User is authenticated
- For uploads, file metadata and upload transport are available

## Module overview

```ts
interface DriveModule {
  listItems(query?: DriveListQuery): Promise<CursorListResponse<DriveItem>>;
  search(query: DriveSearchQuery): Promise<CursorListResponse<DriveItem>>;
  listShared(query?: DriveListQuery): Promise<CursorListResponse<DriveItem>>;
  listSharedByMe(query?: DriveListQuery): Promise<CursorListResponse<DriveItem>>;
  stats(): Promise<DriveStatsResult>;
  createFolder(body: DriveCreateFolderInput): Promise<DriveFolderResult>;
  createUploadSession(body: DriveCreateUploadSessionInput): Promise<DriveSingleUploadSessionResult>;
  createMultipartSession(body: DriveCreateMultipartSessionInput): Promise<DriveMultipartUploadSessionResult>;
  createMultipartPartUrl(fileId: string, body: DriveCreateMultipartPartUrlInput): Promise<DriveMultipartPartUrlResult>;
  completeMultipartSession(fileId: string, body: DriveCompleteMultipartSessionInput): Promise<DriveCompleteUploadResult>;
  abortMultipartSession(fileId: string, body: DriveAbortMultipartSessionInput): Promise<DriveMutationResult>;
  uploadEncrypted(body: DriveUploadEncryptedInput): Promise<DriveMutationResult>;
  completeUpload(body: DriveCompleteUploadInput): Promise<DriveCompleteUploadResult>;
  getDownloadUrl(itemId: string, query?: DriveDownloadUrlQuery): Promise<DriveSignedUrlResult>;
  getEncryptedDownload(itemId: string): Promise<DriveEncryptedDownloadResult>;
  getVersions(itemId: string): Promise<DriveVersionsResult>;
  getShareLink(itemId: string): Promise<DriveSignedUrlResult>;
  getPreviewUrl(itemId: string): Promise<DriveSignedUrlResult>;
  getMetadata(itemId: string): Promise<DriveMetadataResult>;
  updateItem(itemId: string, body: DriveUpdateItemInput): Promise<DriveMutationResult>;
  deleteItem(itemId: string, query?: DriveDeleteItemQuery): Promise<DriveMutationResult>;
  bulkDeleteItems(body: DriveBulkIdsInput): Promise<DriveMutationResult>;
  listTrash(query?: DriveListQuery): Promise<CursorListResponse<DriveItem>>;
  restoreTrashItem(itemId: string): Promise<DriveTrashRestoreResult>;
  bulkRestoreTrash(body: DriveBulkIdsInput): Promise<DriveMutationResult>;
  purgeTrash(): Promise<DrivePurgeResult>;
  purgeTrashItem(itemId: string): Promise<DrivePurgeResult>;
  bulkPurgeTrash(body: DriveBulkIdsInput): Promise<DriveMutationResult>;
}
```

### `drive.listItems(query?)`

#### What this method does

Returns a page of drive items.

#### When to call it

Call for initial drive view and pagination.

#### Signature

```ts
listItems(query?: DriveListQuery): Promise<CursorListResponse<DriveItem>>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `limit` | `number` | No | service default | positive integer | Max items in page. |
| `cursor` | `string` | No | none | opaque cursor | Next page cursor. |
| `parentId` | `string` | No | root scope | valid folder ID | Parent folder scope. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `items` | `DriveItem[]` | Required | array | Current page items. |
| `nextCursor` | `string \| null` | Required | cursor or `null` | Next page token. |

#### Errors and handling

- `AuthError`: sign in.
- `NetworkError`: retry and keep existing list.
- `SdkError`: show generic list load error.

#### Minimal example

```ts
try {
  const page = await sdk.client.drive.listItems({ limit: 20 });
  console.log(page.items.length);
} catch (error) {
  console.error('drive.listItems failed', error);
}
```

### `drive.search(query)`

#### What this method does

Searches drive items.

#### When to call it

Call on search submit or debounced query updates.

#### Signature

```ts
search(query: DriveSearchQuery): Promise<CursorListResponse<DriveItem>>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `q` | `string` | Yes | none | non-empty string | Search query text. |
| `limit` | `number` | No | service default | positive integer | Max results. |
| `cursor` | `string` | No | none | opaque cursor | Pagination cursor. |
| `parentId` | `string` | No | all folders | valid folder ID | Optional folder scope. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `items` | `DriveItem[]` | Required | array | Search result items. |
| `nextCursor` | `string \| null` | Required | cursor or `null` | Next page token. |

#### Errors and handling

- `ValidationError`: invalid query payload.
- `NetworkError`: retry safely.
- `SdkError`: show generic search failure.

#### Minimal example

```ts
try {
  const page = await sdk.client.drive.search({ q: 'invoice', limit: 20 });
  console.log(page.items.length);
} catch (error) {
  console.error('drive.search failed', error);
}
```

### `drive.listShared(query?)`

#### What this method does

Lists items shared with the current user.

#### When to call it

Call for “Shared with me” screens.

#### Signature

```ts
listShared(query?: DriveListQuery): Promise<CursorListResponse<DriveItem>>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `query` | `DriveListQuery` | No | none | list query options | Optional pagination/scope settings. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `items` | `DriveItem[]` | Required | array | Shared-with-me items. |
| `nextCursor` | `string \| null` | Required | cursor or `null` | Next page token. |

#### Errors and handling

- `AuthError`: sign in.
- `NetworkError`: retry.
- `SdkError`: generic shared-list error.

#### Minimal example

```ts
try {
  const page = await sdk.client.drive.listShared({ limit: 20 });
  console.log(page.items.length);
} catch (error) {
  console.error('drive.listShared failed', error);
}
```

### `drive.listSharedByMe(query?)`

#### What this method does

Lists items shared by the current user.

#### When to call it

Call for “Shared by me” screens.

#### Signature

```ts
listSharedByMe(query?: DriveListQuery): Promise<CursorListResponse<DriveItem>>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `query` | `DriveListQuery` | No | none | list query options | Optional pagination/scope settings. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `items` | `DriveItem[]` | Required | array | Shared-by-me items. |
| `nextCursor` | `string \| null` | Required | cursor or `null` | Next page token. |

#### Errors and handling

- `AuthError`: sign in.
- `NetworkError`: retry.
- `SdkError`: generic share-list error.

#### Minimal example

```ts
try {
  const page = await sdk.client.drive.listSharedByMe({ limit: 20 });
  console.log(page.items.length);
} catch (error) {
  console.error('drive.listSharedByMe failed', error);
}
```

### `drive.stats()`

#### What this method does

Returns aggregate drive counters.

#### When to call it

Call for dashboard summary cards.

#### Signature

```ts
stats(): Promise<DriveStatsResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `(none)` | - | - | - | - | No request fields are required. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `files` | `number` | Optional | non-negative integer | File count. |
| `folders` | `number` | Optional | non-negative integer | Folder count. |
| `shared` | `number` | Optional | non-negative integer | Shared item count. |
| `sharedByMe` | `number` | Optional | non-negative integer | Shares created by current user. |
| `sharedWithMe` | `number` | Optional | non-negative integer | Items shared with current user. |

#### Errors and handling

- `AuthError`: sign in.
- `NetworkError`: show retry.
- `SdkError`: dashboard fallback.

#### Minimal example

```ts
try {
  const stats = await sdk.client.drive.stats();
  console.log(stats.files);
} catch (error) {
  console.error('drive.stats failed', error);
}
```

### `drive.createFolder(body)`

#### What this method does

Creates a new folder.

#### When to call it

Call from folder creation UI.

#### Signature

```ts
createFolder(body: DriveCreateFolderInput): Promise<DriveFolderResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `name` | `string` | Yes | none | non-empty string | Folder name. |
| `parentId` | `string \| null` | No | root | folder ID or `null` | Parent folder target. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `id` | `string` | Required | non-empty string | New folder ID. |
| `name` | `string` | Required | non-empty string | Created folder name. |
| `parentId` | `string \| null` | Required | ID or `null` | Parent location. |
| `type` | `'FOLDER'` | Required | constant | Folder item type. |
| `createdAt` | `string` | Optional | ISO-8601 timestamp | Creation timestamp. |

#### Errors and handling

- `ValidationError`: invalid or duplicate-like name constraints.
- `ConflictError`: parent changed; refresh and retry.
- `AuthError`: sign in.

#### Minimal example

```ts
try {
  const folder = await sdk.client.drive.createFolder({ name: 'Receipts', parentId: null });
  console.log(folder.id);
} catch (error) {
  console.error('drive.createFolder failed', error);
}
```

### `drive.createUploadSession(body)`

#### What this method does

Creates a single-part upload session.

#### When to call it

Call before uploading smaller files with one PUT operation.

#### Signature

```ts
createUploadSession(body: DriveCreateUploadSessionInput): Promise<DriveSingleUploadSessionResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `mimeType` | `string` | Yes | none | MIME type | File content type. |
| `filename`/`fileName`/`name` | `string` | No | none | non-empty string | Filename aliases accepted by SDK type. |
| `sizeBytes`/`byteSize` | `number` | No | none | positive integer | File size aliases. |
| `contentHash` | `string` | No | none | hash string | Content hash metadata. |
| `parentId` | `string \| null` | No | root | folder ID or `null` | Destination folder. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `fileId` | `string` | Required | non-empty string | Target file ID. |
| `putUrl`/`uploadUrl`/`url` | `string` | Optional | URL | Upload URL for file bytes. |
| `headers` | `Record<string, string>` | Optional | header map | Additional upload headers. |
| `expiresAt` | `string` | Optional | ISO-8601 timestamp | Upload URL expiration. |

#### Errors and handling

- `ValidationError`: invalid upload metadata.
- `AuthError`: sign in.
- `NetworkError`: retry session creation.

#### Minimal example

```ts
try {
  const session = await sdk.client.drive.createUploadSession({
    mimeType: 'image/jpeg',
    filename: 'photo.jpg',
    sizeBytes: 1024,
  });
  console.log(session.fileId);
} catch (error) {
  console.error('drive.createUploadSession failed', error);
}
```

### `drive.createMultipartSession(body)`

#### What this method does

Creates a multipart upload session.

#### When to call it

Call before uploading larger files in multiple parts.

#### Signature

```ts
createMultipartSession(body: DriveCreateMultipartSessionInput): Promise<DriveMultipartUploadSessionResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `body` | `DriveCreateMultipartSessionInput` | Yes | none | same fields as upload session input | Upload metadata for multipart strategy. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `fileId` | `string` | Required | non-empty string | Target file ID. |
| `uploadId`/`multipartUploadId` | `string` | Optional | non-empty string | Multipart upload identifier. |
| `partSize` | `number` | Optional | positive integer | Suggested part size bytes. |
| `parts` | `DriveMultipartPartDescriptor[]` | Optional | array | Initial part upload URLs. |

#### Errors and handling

- `ValidationError`: invalid metadata.
- `NetworkError`: retry session creation.
- `AuthError`: sign in.

#### Minimal example

```ts
try {
  const session = await sdk.client.drive.createMultipartSession({
    mimeType: 'video/mp4',
    filename: 'clip.mp4',
    sizeBytes: 50_000_000,
  });
  console.log(session.fileId, session.partSize);
} catch (error) {
  console.error('drive.createMultipartSession failed', error);
}
```

### `drive.createMultipartPartUrl(fileId, body)`

#### What this method does

Returns upload URL for one multipart part.

#### When to call it

Call when part URLs are missing or expired.

#### Signature

```ts
createMultipartPartUrl(fileId: string, body: DriveCreateMultipartPartUrlInput): Promise<DriveMultipartPartUrlResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `fileId` | `string` | Yes | none | valid file ID | File whose multipart part URL is needed. |
| `uploadId` | `string` | Yes | none | non-empty string | Multipart upload ID. |
| `partNumber` | `number` | Yes | none | positive integer (1-based) | Part index. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `putUrl`/`uploadUrl`/`url` | `string` | Optional | URL | Upload URL for requested part. |
| `expiresAt` | `string` | Optional | ISO-8601 timestamp | URL expiration time. |

#### Errors and handling

- `NotFoundError`: file/session missing.
- `ValidationError`: invalid part payload.
- `NetworkError`: retry URL creation.

#### Minimal example

```ts
try {
  const url = await sdk.client.drive.createMultipartPartUrl(fileId, {
    uploadId,
    partNumber: 1,
  });
  console.log(url.putUrl ?? url.uploadUrl ?? url.url);
} catch (error) {
  console.error('drive.createMultipartPartUrl failed', error);
}
```

### `drive.completeMultipartSession(fileId, body)`

#### What this method does

Completes multipart upload using uploaded part metadata.

#### When to call it

Call after all parts are uploaded and each has ETag + byte size.

#### Signature

```ts
completeMultipartSession(fileId: string, body: DriveCompleteMultipartSessionInput): Promise<DriveCompleteUploadResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `fileId` | `string` | Yes | none | valid file ID | Target file. |
| `uploadId` | `string` | Yes | none | non-empty string | Multipart upload ID. |
| `parts` | `DriveMultipartUploadedPart[]` | Yes | none | list of `{ partNumber, etag, byteSize }` | Uploaded part confirmations. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `ok` | `boolean` | Required | boolean | Completion status. |
| `etag` | `string` | Optional | non-empty string | Final object ETag. |
| `size` | `number` | Optional | positive integer | Final file size. |
| `updatedAt` | `string` | Optional | ISO-8601 timestamp | Finalization timestamp. |

#### Errors and handling

- `ValidationError`: part list invalid.
- `ConflictError`: missing part confirmations.
- `NetworkError`: safe to retry completion.

#### Minimal example

```ts
try {
  const result = await sdk.client.drive.completeMultipartSession(fileId, {
    uploadId,
    parts,
  });
  console.log(result.ok);
} catch (error) {
  console.error('drive.completeMultipartSession failed', error);
}
```

### `drive.abortMultipartSession(fileId, body)`

#### What this method does

Aborts an in-progress multipart upload session.

#### When to call it

Call on cancellation or unrecoverable multipart failure.

#### Signature

```ts
abortMultipartSession(fileId: string, body: DriveAbortMultipartSessionInput): Promise<DriveMutationResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `fileId` | `string` | Yes | none | valid file ID | File to abort. |
| `uploadId` | `string` | Yes | none | non-empty string | Multipart upload ID to abort. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `ok` | `boolean` | Optional | boolean | Abort success flag. |
| `deleted` | `boolean` | Optional | boolean | Mutation status metadata. |

#### Errors and handling

- `NotFoundError`: session already gone; continue cleanup.
- `NetworkError`: retry abort.
- `SdkError`: log abort failure.

#### Minimal example

```ts
try {
  await sdk.client.drive.abortMultipartSession(fileId, { uploadId });
} catch (error) {
  console.error('drive.abortMultipartSession failed', error);
}
```

### `drive.uploadEncrypted(body)`

#### What this method does

Creates/records an encrypted upload payload entry.

#### When to call it

Call when integrating client-side encryption upload paths.

#### Signature

```ts
uploadEncrypted(body: DriveUploadEncryptedInput): Promise<DriveMutationResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `filename` | `string` | Yes | none | non-empty string | Encrypted object name. |
| `encryptedBlob` | `string` | Yes | none | encrypted payload string | Encrypted content data. |
| `encryptionKeyId` | `string` | Yes | none | non-empty string | Encryption key identifier. |
| `parentId` | `string \| null` | No | root | folder ID or `null` | Destination folder. |
| `mimeType` | `string` | No | none | MIME type | Optional MIME metadata. |
| `contentHash` | `string` | No | none | hash string | Optional content hash metadata. |
| `sizeBytes`/`byteSize` | `number` | No | none | positive integer | Size metadata aliases. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `ok` | `boolean` | Optional | boolean | Mutation success indicator. |
| `deleted` | `boolean` | Optional | boolean | Mutation state metadata. |

#### Errors and handling

- `ValidationError`: missing encrypted payload fields.
- `AuthError`: sign in.
- `SdkError`: show encryption upload failure.

#### Minimal example

```ts
try {
  await sdk.client.drive.uploadEncrypted({
    filename: 'secret.bin',
    encryptedBlob,
    encryptionKeyId,
  });
} catch (error) {
  console.error('drive.uploadEncrypted failed', error);
}
```

### `drive.completeUpload(body)`

#### What this method does

Marks upload complete for a file ID.

#### When to call it

Call after bytes are uploaded in single-part flows (and after multipart completion where applicable).

#### Signature

```ts
completeUpload(body: DriveCompleteUploadInput): Promise<DriveCompleteUploadResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `fileId` | `string` | Yes | none | valid file ID | File to finalize. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `ok` | `boolean` | Required | boolean | Completion status. |
| `etag` | `string` | Optional | non-empty string | Final object ETag. |
| `size` | `number` | Optional | positive integer | Finalized file size. |
| `updatedAt` | `string` | Optional | ISO-8601 timestamp | Finalization timestamp. |

#### Errors and handling

- `NotFoundError`: file/session missing.
- `ConflictError`: upload not ready to finalize.
- `NetworkError`: safe to retry completion.

#### Minimal example

```ts
try {
  const result = await sdk.client.drive.completeUpload({ fileId });
  console.log(result.ok);
} catch (error) {
  console.error('drive.completeUpload failed', error);
}
```

### `drive.getDownloadUrl(itemId, query?)`

#### What this method does

Returns a signed download URL for an item.

#### When to call it

Call immediately before download/preview actions.

#### Signature

```ts
getDownloadUrl(itemId: string, query?: DriveDownloadUrlQuery): Promise<DriveSignedUrlResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `itemId` | `string` | Yes | none | valid item ID | Item to download. |
| `disposition` | `'inline' \| 'attachment'` | No | service default | enum | Download/content disposition hint. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `url` | `string` | Required | URL | Signed download URL. |
| `expiresAt` | `string` | Optional | ISO-8601 timestamp | URL expiration timestamp. |
| `contentType` | `string` | Optional | MIME type | File content type metadata. |
| `contentLength` | `number` | Optional | non-negative integer | File size metadata. |

#### Errors and handling

- `NotFoundError`: item missing.
- `AuthError`: sign in.
- `NetworkError`: retry URL request.

#### Minimal example

```ts
try {
  const signed = await sdk.client.drive.getDownloadUrl(itemId, { disposition: 'attachment' });
  console.log(signed.url);
} catch (error) {
  console.error('drive.getDownloadUrl failed', error);
}
```

### `drive.getEncryptedDownload(itemId)`

#### What this method does

Returns encrypted download payload data for an item.

#### When to call it

Call in encrypted-content retrieval workflows.

#### Signature

```ts
getEncryptedDownload(itemId: string): Promise<DriveEncryptedDownloadResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `itemId` | `string` | Yes | none | valid item ID | Item to fetch encrypted download data for. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `return payload` | `DriveEncryptedDownloadResult` | Required | object payload | Encrypted download payload shape. |

#### Errors and handling

- `NotFoundError`: item missing.
- `AuthError`: sign in.
- `SdkError`: show encrypted download failure.

#### Minimal example

```ts
try {
  const payload = await sdk.client.drive.getEncryptedDownload(itemId);
  console.log(payload);
} catch (error) {
  console.error('drive.getEncryptedDownload failed', error);
}
```

### `drive.getVersions(itemId)`

#### What this method does

Returns version history entries for an item.

#### When to call it

Call in file version history UI.

#### Signature

```ts
getVersions(itemId: string): Promise<DriveVersionsResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `itemId` | `string` | Yes | none | valid item ID | Item whose versions are requested. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `return payload` | `DriveVersionsResult` | Required | array or object with `items/versions` | Version data and optional cursor. |

#### Errors and handling

- `NotFoundError`: item missing.
- `AuthError`: sign in.
- `NetworkError`: retry load.

#### Minimal example

```ts
try {
  const versions = await sdk.client.drive.getVersions(itemId);
  console.log(versions);
} catch (error) {
  console.error('drive.getVersions failed', error);
}
```

### `drive.getShareLink(itemId)`

#### What this method does

Returns a signed share link payload for an item.

#### When to call it

Call when generating one-click share URLs.

#### Signature

```ts
getShareLink(itemId: string): Promise<DriveSignedUrlResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `itemId` | `string` | Yes | none | valid item ID | Item to generate share link for. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `url` | `string` | Required | URL | Signed share URL. |
| `expiresAt` | `string` | Optional | ISO-8601 timestamp | Link expiration timestamp. |

#### Errors and handling

- `NotFoundError`: item missing.
- `AuthError`: sign in.
- `NetworkError`: retry URL generation.

#### Minimal example

```ts
try {
  const share = await sdk.client.drive.getShareLink(itemId);
  console.log(share.url);
} catch (error) {
  console.error('drive.getShareLink failed', error);
}
```

### `drive.getPreviewUrl(itemId)`

#### What this method does

Returns a signed preview URL for an item.

#### When to call it

Call when rendering in-app previews.

#### Signature

```ts
getPreviewUrl(itemId: string): Promise<DriveSignedUrlResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `itemId` | `string` | Yes | none | valid item ID | Item to preview. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `url` | `string` | Required | URL | Signed preview URL. |
| `expiresAt` | `string` | Optional | ISO-8601 timestamp | URL expiration timestamp. |

#### Errors and handling

- `NotFoundError`: item missing.
- `AuthError`: sign in.
- `NetworkError`: retry URL generation.

#### Minimal example

```ts
try {
  const preview = await sdk.client.drive.getPreviewUrl(itemId);
  console.log(preview.url);
} catch (error) {
  console.error('drive.getPreviewUrl failed', error);
}
```

### `drive.getMetadata(itemId)`

#### What this method does

Returns metadata for one item.

#### When to call it

Call before download UI, detail screens, or integrity checks.

#### Signature

```ts
getMetadata(itemId: string): Promise<DriveMetadataResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `itemId` | `string` | Yes | none | valid item ID | Item to fetch metadata for. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `key` | `string` | Optional | non-empty string | Storage key. |
| `contentType` | `string` | Optional | MIME type | Content type. |
| `contentLength` | `number` | Optional | non-negative integer | Content length bytes. |
| `etag` | `string` | Optional | non-empty string | Object ETag. |
| `lastModified` | `string` | Optional | ISO-8601 timestamp | Last modified time. |

#### Errors and handling

- `NotFoundError`: item missing.
- `AuthError`: sign in.
- `NetworkError`: retry metadata fetch.

#### Minimal example

```ts
try {
  const metadata = await sdk.client.drive.getMetadata(itemId);
  console.log(metadata.contentType);
} catch (error) {
  console.error('drive.getMetadata failed', error);
}
```

### `drive.updateItem(itemId, body)`

#### What this method does

Updates item metadata (rename, move, star/unstar).

#### When to call it

Call from file detail or contextual action menus.

#### Signature

```ts
updateItem(itemId: string, body: DriveUpdateItemInput): Promise<DriveMutationResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `itemId` | `string` | Yes | none | valid item ID | Item to update. |
| `name` | `string` | No | unchanged | non-empty string | Rename target. |
| `parentId` | `string \| null` | No | unchanged | folder ID or `null` | Move target. |
| `isStarred` | `boolean` | No | unchanged | boolean | Star toggle. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `ok` | `boolean` | Optional | boolean | Update success status. |
| `deleted` | `boolean` | Optional | boolean | Mutation metadata flag. |

#### Errors and handling

- `ValidationError`: invalid name/parent state.
- `ConflictError`: refresh item and retry.
- `NetworkError`: retry update.

#### Minimal example

```ts
try {
  await sdk.client.drive.updateItem(itemId, { isStarred: true });
} catch (error) {
  console.error('drive.updateItem failed', error);
}
```

### `drive.deleteItem(itemId, query?)`

#### What this method does

Deletes one item (soft delete to trash by default).

#### When to call it

Call from delete actions in drive UI.

#### Signature

```ts
deleteItem(itemId: string, query?: DriveDeleteItemQuery): Promise<DriveMutationResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `itemId` | `string` | Yes | none | valid item ID | Item to delete. |
| `hard` | `'true' \| 'false'` | No | `'false'` | string enum | Hard-delete toggle. |
| `isFolder` | `'true' \| 'false'` | No | inferred | string enum | Explicit folder hint. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `ok` | `boolean` | Optional | boolean | Delete operation status. |
| `deleted` | `boolean` | Optional | boolean | Deletion flag. |

#### Errors and handling

- `NotFoundError`: item already removed.
- `ConflictError`: refresh and retry.
- `NetworkError`: retry action.

#### Minimal example

```ts
try {
  await sdk.client.drive.deleteItem(itemId, { hard: 'false' });
} catch (error) {
  console.error('drive.deleteItem failed', error);
}
```

### `drive.bulkDeleteItems(body)`

#### What this method does

Deletes multiple items in one call.

#### When to call it

Call for multi-select delete actions.

#### Signature

```ts
bulkDeleteItems(body: DriveBulkIdsInput): Promise<DriveMutationResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `ids` | `string[]` | Yes | none | one or more valid item IDs | Items to delete. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `ok` | `boolean` | Optional | boolean | Bulk delete status. |
| `deleted` | `boolean` | Optional | boolean | Mutation metadata. |
| `removedObjects` | `number` | Optional | non-negative integer | Removed object count when returned. |

#### Errors and handling

- `ValidationError`: empty or invalid ID list.
- `ConflictError`: refresh selection state.
- `NetworkError`: retry with same IDs.

#### Minimal example

```ts
try {
  await sdk.client.drive.bulkDeleteItems({ ids: selectedIds });
} catch (error) {
  console.error('drive.bulkDeleteItems failed', error);
}
```

### `drive.listTrash(query?)`

#### What this method does

Lists trashed drive items.

#### When to call it

Call for trash screens and pagination.

#### Signature

```ts
listTrash(query?: DriveListQuery): Promise<CursorListResponse<DriveItem>>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `query` | `DriveListQuery` | No | none | list query options | Optional pagination/scope settings. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `items` | `DriveItem[]` | Required | array | Trash items page. |
| `nextCursor` | `string \| null` | Required | cursor or `null` | Next page token. |

#### Errors and handling

- `AuthError`: sign in.
- `NetworkError`: keep current list and retry.
- `SdkError`: generic trash-list failure.

#### Minimal example

```ts
try {
  const page = await sdk.client.drive.listTrash({ limit: 20 });
  console.log(page.items.length);
} catch (error) {
  console.error('drive.listTrash failed', error);
}
```

### `drive.restoreTrashItem(itemId)`

#### What this method does

Restores one trashed item.

#### When to call it

Call when user restores a single trashed entry.

#### Signature

```ts
restoreTrashItem(itemId: string): Promise<DriveTrashRestoreResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `itemId` | `string` | Yes | none | valid item ID | Trashed item to restore. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `id` | `string` | Optional | non-empty string | Restored item ID. |
| `name` | `string` | Optional | string | Restored item name. |
| `type` | `'FILE' \| 'FOLDER'` | Optional | enum | Restored item type. |
| `parentId` | `string \| null` | Optional | ID or `null` | Restored parent folder. |

#### Errors and handling

- `NotFoundError`: item already restored/removed.
- `ConflictError`: refresh and retry.
- `NetworkError`: retry restore.

#### Minimal example

```ts
try {
  await sdk.client.drive.restoreTrashItem(itemId);
} catch (error) {
  console.error('drive.restoreTrashItem failed', error);
}
```

### `drive.bulkRestoreTrash(body)`

#### What this method does

Restores multiple trashed items.

#### When to call it

Call for bulk restore actions.

#### Signature

```ts
bulkRestoreTrash(body: DriveBulkIdsInput): Promise<DriveMutationResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `ids` | `string[]` | Yes | none | one or more valid item IDs | Trashed items to restore. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `ok` | `boolean` | Optional | boolean | Restore status. |
| `removedObjects` | `number` | Optional | non-negative integer | Mutation count metadata. |

#### Errors and handling

- `ValidationError`: invalid input IDs.
- `ConflictError`: refresh list.
- `NetworkError`: retry action.

#### Minimal example

```ts
try {
  await sdk.client.drive.bulkRestoreTrash({ ids: selectedIds });
} catch (error) {
  console.error('drive.bulkRestoreTrash failed', error);
}
```

### `drive.purgeTrash()`

#### What this method does

Permanently removes all items in trash.

#### When to call it

Call only after explicit destructive confirmation.

#### Signature

```ts
purgeTrash(): Promise<DrivePurgeResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `(none)` | - | - | - | - | No request fields are required. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `purged` | `number` | Optional | non-negative integer | Purged count when returned. |
| `ok` | `boolean` | Optional | boolean | Success status. |

#### Errors and handling

- `ValidationError`: enforce explicit user confirmation in UI.
- `NetworkError`: retry safely.
- `SdkError`: show destructive failure state.

#### Minimal example

```ts
try {
  const result = await sdk.client.drive.purgeTrash();
  console.log(result.purged);
} catch (error) {
  console.error('drive.purgeTrash failed', error);
}
```

### `drive.purgeTrashItem(itemId)`

#### What this method does

Permanently removes one trash item.

#### When to call it

Call from single-item permanent delete actions.

#### Signature

```ts
purgeTrashItem(itemId: string): Promise<DrivePurgeResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `itemId` | `string` | Yes | none | valid item ID | Trashed item to purge permanently. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `purged` | `number` | Optional | non-negative integer | Purged count metadata. |
| `ok` | `boolean` | Optional | boolean | Success status. |

#### Errors and handling

- `NotFoundError`: item already gone.
- `ConflictError`: refresh and retry.
- `NetworkError`: retry action.

#### Minimal example

```ts
try {
  await sdk.client.drive.purgeTrashItem(itemId);
} catch (error) {
  console.error('drive.purgeTrashItem failed', error);
}
```

### `drive.bulkPurgeTrash(body)`

#### What this method does

Permanently removes multiple trash items.

#### When to call it

Call for bulk permanent delete actions.

#### Signature

```ts
bulkPurgeTrash(body: DriveBulkIdsInput): Promise<DriveMutationResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `ids` | `string[]` | Yes | none | one or more valid item IDs | Trashed items to purge. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `ok` | `boolean` | Optional | boolean | Bulk purge status. |
| `purged` | `number` | Optional | non-negative integer | Purged count when returned. |
| `removedObjects` | `number` | Optional | non-negative integer | Removed object count metadata. |

#### Errors and handling

- `ValidationError`: invalid or empty ID list.
- `RateLimitError`: back off and retry.
- `NetworkError`: retry with preserved selection.

#### Minimal example

```ts
try {
  await sdk.client.drive.bulkPurgeTrash({ ids: selectedIds });
} catch (error) {
  console.error('drive.bulkPurgeTrash failed', error);
}
```
