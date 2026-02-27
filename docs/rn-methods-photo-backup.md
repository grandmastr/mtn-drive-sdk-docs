---
title: "RN Methods: Photo Backup"
---

Register devices, orchestrate media upload sessions, confirm parts, and manage photo/video backup assets.

## Prerequisites

- SDK client created with `createRNClient(...)`
- `fileAdapter` and `deviceIdProvider` implemented
- For upload orchestration, see [RN Methods: Upload Manager](/docs/rn-methods-upload-manager)

## Module overview

```ts
interface PhotoBackupModule {
  registerDevice(body: PhotoBackupRegisterDeviceInput): Promise<PhotoBackupRegisterDeviceResult>;
  createSession(body: PhotoBackupCreateSessionInput): Promise<PhotoBackupUploadSessionResult>;
  refreshSession(sessionId: string): Promise<PhotoBackupUploadSessionResult>;
  confirmPart(sessionId: string, partNumber: number, body: PhotoBackupConfirmPartInput): Promise<PhotoBackupOkResult>;
  completeSession(sessionId: string, body: PhotoBackupCompleteSessionInput): Promise<PhotoBackupCompleteSessionResult>;
  abortSession(sessionId: string): Promise<PhotoBackupOkResult>;
  reconcileSession(sessionId: string): Promise<PhotoBackupReconcileSessionResult>;
  listMedia(query?: QueryParams): Promise<PhotoBackupMediaListResult>;
  getMediaDetail(mediaAssetId: string): Promise<PhotoBackupMediaAsset>;
  createDownloadUrl(mediaAssetId: string): Promise<PhotoBackupSignedUrlResult>;
  createThumbnailUrl(mediaAssetId: string, variant: PhotoBackupThumbnailVariant): Promise<PhotoBackupSignedUrlResult>;
  requeueThumbnails(mediaAssetId: string): Promise<PhotoBackupOkResult>;
  deleteMedia(mediaAssetId: string): Promise<PhotoBackupOkResult>;
}
```

### `photoBackup.registerDevice(body)`

#### What this method does

Registers the current device for photo backup flows.

#### When to call it

Call once at backup onboarding, then reuse returned registration state in app UX.

#### Signature

```ts
registerDevice(body: PhotoBackupRegisterDeviceInput): Promise<PhotoBackupRegisterDeviceResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `platform` | `'ios' \| 'android'` | No | inferred by app | enum | Device platform. |
| `name` | `string` | No | none | non-empty string | User-visible device name. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `id` | `string` | Optional | non-empty string | Registration record ID. |
| `deviceId` | `string` | Optional | non-empty string | Device identifier on service side. |
| `platform` | `'ios' \| 'android' \| string` | Optional | enum/string | Registered platform. |
| `name` | `string` | Optional | non-empty string | Registered display name. |

#### Errors and handling

- `ValidationError`: invalid platform/name inputs.
- `AuthError`: require sign-in.
- `NetworkError`: allow retry from onboarding UI.

#### Minimal example

```ts
try {
  const device = await sdk.client.photoBackup.registerDevice({
    platform: 'ios',
    name: 'My iPhone',
  });
  console.log('registered device', device.deviceId ?? device.id);
} catch (error) {
  console.error('photoBackup.registerDevice failed', error);
}
```

### `photoBackup.createSession(body)`

#### What this method does

Creates an upload session for a media asset and returns dedupe/single/multipart strategy.

#### When to call it

Call before uploading a photo/video file.

#### Signature

```ts
createSession(body: PhotoBackupCreateSessionInput): Promise<PhotoBackupUploadSessionResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `contentHash` | `string` | Yes | none | lowercase SHA-256 hex | Content hash used for dedupe. |
| `byteSize` | `number` | Yes | none | positive integer bytes | File size. |
| `mimeType` | `string` | Yes | none | valid MIME type | Asset MIME type. |
| `filename` | `string` | No | none | non-empty string | Optional original filename. |
| `capturedAt` | `string` | No | none | ISO-8601 timestamp | Media capture timestamp. |
| `width` | `number` | No | none | positive integer | Media width in pixels. |
| `height` | `number` | No | none | positive integer | Media height in pixels. |

#### Response fields

`PhotoBackupUploadSessionResult` is a union with 3 branches.

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `deduped` | `boolean` | Required | boolean | Indicates dedupe hit vs upload path. |
| `mediaAssetId` | `string` | Conditional | non-empty string | Present when `deduped: true`. |
| `sessionId` | `string` | Conditional | non-empty string | Present when `deduped: false`. |
| `strategy` | `'single' \| 'multipart'` | Conditional | enum | Present when `deduped: false`. |
| `putUrl` | `string` | Conditional | URL | Present for `strategy: 'single'`. |
| `partSize` | `number` | Conditional | positive integer | Present for `strategy: 'multipart'`. |
| `parts` | `PhotoBackupUploadPart[]` | Conditional | array | Optional initial multipart part URLs. |

#### Errors and handling

- `ValidationError`: missing hash/size/mime inputs.
- `AuthError`: require sign-in.
- `ConflictError`: refresh and retry session create once.

#### Minimal example

```ts
try {
  const session = await sdk.client.photoBackup.createSession({
    contentHash,
    byteSize,
    mimeType,
    filename,
  });
  console.log('deduped', session.deduped);
} catch (error) {
  console.error('photoBackup.createSession failed', error);
}
```

### `photoBackup.refreshSession(sessionId)`

#### What this method does

Refreshes an existing upload session and returns updated upload strategy/session data.

#### When to call it

Call when URLs expire or part URLs are missing during multipart upload.

#### Signature

```ts
refreshSession(sessionId: string): Promise<PhotoBackupUploadSessionResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `sessionId` | `string` | Yes | none | valid session ID | Upload session to refresh. |

#### Response fields

Response is `PhotoBackupUploadSessionResult` (same union fields as `createSession`).

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `deduped` | `boolean` | Required | boolean | Dedupe/upload state after refresh. |
| `strategy` | `'single' \| 'multipart'` | Conditional | enum | Upload strategy for non-deduped sessions. |
| `parts` | `PhotoBackupUploadPart[]` | Conditional | array | Refreshed part URLs for multipart sessions. |

#### Errors and handling

- `NotFoundError`: session may be expired; recreate session.
- `AuthError`: re-authenticate.
- `NetworkError`: retry refresh.

#### Minimal example

```ts
try {
  const refreshed = await sdk.client.photoBackup.refreshSession(sessionId);
  console.log('strategy', refreshed.deduped ? 'deduped' : refreshed.strategy);
} catch (error) {
  console.error('photoBackup.refreshSession failed', error);
}
```

### `photoBackup.confirmPart(sessionId, partNumber, body)`

#### What this method does

Confirms one uploaded multipart part by ETag and byte size.

#### When to call it

Call after each successful multipart PUT upload.

#### Signature

```ts
confirmPart(sessionId: string, partNumber: number, body: PhotoBackupConfirmPartInput): Promise<PhotoBackupOkResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `sessionId` | `string` | Yes | none | valid session ID | Multipart upload session. |
| `partNumber` | `number` | Yes | none | positive integer (1-based) | Multipart part index. |
| `etag` | `string` | Yes | none | non-empty string | Returned ETag from part upload. |
| `byteSize` | `number` | Yes | none | positive integer | Uploaded part byte count. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `ok` | `boolean` | Required | boolean | Part confirmation result. |

#### Errors and handling

- `ValidationError`: missing `etag` or invalid part number.
- `NotFoundError`: session expired or invalid.
- `ConflictError`: part state changed; refresh session and retry once.

#### Minimal example

```ts
try {
  await sdk.client.photoBackup.confirmPart(sessionId, 1, {
    etag,
    byteSize,
  });
} catch (error) {
  console.error('photoBackup.confirmPart failed', error);
}
```

### `photoBackup.completeSession(sessionId, body)`

#### What this method does

Finalizes an upload session and returns the resulting media asset ID.

#### When to call it

Call after all required upload bytes (single or multipart) are successfully uploaded and confirmed.

#### Signature

```ts
completeSession(sessionId: string, body: PhotoBackupCompleteSessionInput): Promise<PhotoBackupCompleteSessionResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `sessionId` | `string` | Yes | none | valid session ID | Upload session to complete. |
| `contentHash` | `string` | No | session value | lowercase SHA-256 hex | Final content hash metadata. |
| `filename` | `string` | No | session value | non-empty string | Final filename metadata. |
| `capturedAt` | `string` | No | session value | ISO-8601 timestamp | Capture timestamp metadata. |
| `width` | `number` | No | session value | positive integer | Media width metadata. |
| `height` | `number` | No | session value | positive integer | Media height metadata. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `deduped` | `boolean` | Required | boolean | Indicates whether final result is deduped. |
| `mediaAssetId` | `string` | Required | non-empty string | Final media asset identifier. |

#### Errors and handling

- `ConflictError`: part confirmations incomplete; reconcile/refresh before retry.
- `ValidationError`: metadata invalid.
- `NetworkError`: safe to retry completion.

#### Minimal example

```ts
try {
  const result = await sdk.client.photoBackup.completeSession(sessionId, {
    filename,
    capturedAt,
  });
  console.log('media asset', result.mediaAssetId);
} catch (error) {
  console.error('photoBackup.completeSession failed', error);
}
```

### `photoBackup.abortSession(sessionId)`

#### What this method does

Aborts an in-progress upload session.

#### When to call it

Call when user cancels upload or upload becomes unrecoverable.

#### Signature

```ts
abortSession(sessionId: string): Promise<PhotoBackupOkResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `sessionId` | `string` | Yes | none | valid session ID | Upload session to abort. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `ok` | `boolean` | Required | boolean | Abort result. |

#### Errors and handling

- `NotFoundError`: session already gone; treat as finished cleanup.
- `NetworkError`: retry abort action.
- `SdkError`: log and surface cancel failure.

#### Minimal example

```ts
try {
  await sdk.client.photoBackup.abortSession(sessionId);
} catch (error) {
  console.error('photoBackup.abortSession failed', error);
}
```

### `photoBackup.reconcileSession(sessionId)`

#### What this method does

Reconciles server-side session state and returns final media asset linkage when available.

#### When to call it

Call after uncertain upload outcomes, app restarts, or recoverable completion failures.

#### Signature

```ts
reconcileSession(sessionId: string): Promise<PhotoBackupReconcileSessionResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `sessionId` | `string` | Yes | none | valid session ID | Session to reconcile. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `reconciled` | `boolean` | Required | boolean | Whether reconciliation succeeded. |
| `deduped` | `boolean` | Required | boolean | Whether final result was deduped. |
| `mediaAssetId` | `string` | Required | non-empty string | Final media asset ID when reconciled. |

#### Errors and handling

- `NotFoundError`: session no longer exists; restart upload flow.
- `NetworkError`: retry reconcile.
- `SdkError`: surface recoverable sync error.

#### Minimal example

```ts
try {
  const result = await sdk.client.photoBackup.reconcileSession(sessionId);
  console.log('reconciled', result.reconciled);
} catch (error) {
  console.error('photoBackup.reconcileSession failed', error);
}
```

### `photoBackup.listMedia(query?)`

#### What this method does

Lists backed-up media assets with cursor-based pagination.

#### When to call it

Call when rendering media backup gallery lists.

#### Signature

```ts
listMedia(query?: QueryParams): Promise<PhotoBackupMediaListResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `query` | `QueryParams` | No | none | key/value query map | Optional pagination and filtering params. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `items` | `PhotoBackupMediaAsset[]` | Optional | array | Media assets page. |
| `nextCursor` | `string \| null` | Optional | cursor or `null` | Next page token. |

#### Errors and handling

- `AuthError`: prompt sign-in.
- `NetworkError`: keep current list and allow retry.
- `SdkError`: show generic list error.

#### Minimal example

```ts
try {
  const page = await sdk.client.photoBackup.listMedia({ limit: 20 });
  console.log('media count', page.items?.length ?? 0);
} catch (error) {
  console.error('photoBackup.listMedia failed', error);
}
```

### `photoBackup.getMediaDetail(mediaAssetId)`

#### What this method does

Returns details for one backed-up media asset.

#### When to call it

Call when opening media detail screens.

#### Signature

```ts
getMediaDetail(mediaAssetId: string): Promise<PhotoBackupMediaAsset>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `mediaAssetId` | `string` | Yes | none | valid media asset ID | Target media asset. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `mediaAssetId` | `string` | Optional | non-empty string | Media asset ID. |
| `filename` | `string` | Optional | string | Filename metadata. |
| `mimeType` | `string` | Optional | MIME type | Media MIME type. |
| `byteSize` | `number` | Optional | non-negative integer | Asset size in bytes. |
| `contentHash` | `string` | Optional | SHA-256 hex | Content hash metadata. |
| `capturedAt` | `string \| null` | Optional | ISO-8601 or `null` | Capture timestamp. |
| `width` | `number` | Optional | positive integer | Media width. |
| `height` | `number` | Optional | positive integer | Media height. |
| `createdAt` | `string` | Optional | ISO-8601 timestamp | Created timestamp. |
| `updatedAt` | `string` | Optional | ISO-8601 timestamp | Updated timestamp. |

#### Errors and handling

- `NotFoundError`: media asset removed; refresh list.
- `AuthError`: re-authenticate.
- `NetworkError`: keep current detail shell and retry.

#### Minimal example

```ts
try {
  const detail = await sdk.client.photoBackup.getMediaDetail(mediaAssetId);
  console.log('filename', detail.filename);
} catch (error) {
  console.error('photoBackup.getMediaDetail failed', error);
}
```

### `photoBackup.createDownloadUrl(mediaAssetId)`

#### What this method does

Creates a signed download URL for one media asset.

#### When to call it

Call before downloading or streaming a backup asset.

#### Signature

```ts
createDownloadUrl(mediaAssetId: string): Promise<PhotoBackupSignedUrlResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `mediaAssetId` | `string` | Yes | none | valid media asset ID | Target media asset. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `url` | `string` | Required | URL | Signed download URL. |
| `expiresAt` | `string` | Required | ISO-8601 timestamp | URL expiration time. |

#### Errors and handling

- `NotFoundError`: asset missing; refresh list.
- `AuthError`: require sign-in.
- `NetworkError`: retry URL creation.

#### Minimal example

```ts
try {
  const signed = await sdk.client.photoBackup.createDownloadUrl(mediaAssetId);
  console.log('download url', signed.url);
} catch (error) {
  console.error('photoBackup.createDownloadUrl failed', error);
}
```

### `photoBackup.createThumbnailUrl(mediaAssetId, variant)`

#### What this method does

Creates a signed URL for a thumbnail variant (`small`, `medium`, `large`).

#### When to call it

Call when rendering media preview grids or detail thumbnails.

#### Signature

```ts
createThumbnailUrl(mediaAssetId: string, variant: PhotoBackupThumbnailVariant): Promise<PhotoBackupSignedUrlResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `mediaAssetId` | `string` | Yes | none | valid media asset ID | Target media asset. |
| `variant` | `'small' \| 'medium' \| 'large'` | Yes | none | enum | Thumbnail size variant. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `url` | `string` | Required | URL | Signed thumbnail URL. |
| `expiresAt` | `string` | Required | ISO-8601 timestamp | URL expiration time. |

#### Errors and handling

- `ValidationError`: unsupported variant value.
- `NotFoundError`: asset missing.
- `NetworkError`: retry thumbnail URL request.

#### Minimal example

```ts
try {
  const thumb = await sdk.client.photoBackup.createThumbnailUrl(mediaAssetId, 'small');
  console.log('thumbnail', thumb.url);
} catch (error) {
  console.error('photoBackup.createThumbnailUrl failed', error);
}
```

### `photoBackup.requeueThumbnails(mediaAssetId)`

#### What this method does

Requests thumbnail regeneration/requeue for one media asset.

#### When to call it

Call when thumbnail URLs fail because derivative generation is missing or stale.

#### Signature

```ts
requeueThumbnails(mediaAssetId: string): Promise<PhotoBackupOkResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `mediaAssetId` | `string` | Yes | none | valid media asset ID | Target media asset. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `ok` | `boolean` | Required | boolean | Requeue acceptance result. |

#### Errors and handling

- `NotFoundError`: media asset missing.
- `RateLimitError`: back off and retry later.
- `NetworkError`: retry action.

#### Minimal example

```ts
try {
  await sdk.client.photoBackup.requeueThumbnails(mediaAssetId);
} catch (error) {
  console.error('photoBackup.requeueThumbnails failed', error);
}
```

### `photoBackup.deleteMedia(mediaAssetId)`

#### What this method does

Deletes a backed-up media asset.

#### When to call it

Call when user deletes media from backup storage.

#### Signature

```ts
deleteMedia(mediaAssetId: string): Promise<PhotoBackupOkResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `mediaAssetId` | `string` | Yes | none | valid media asset ID | Target media asset to delete. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `ok` | `boolean` | Required | boolean | Delete operation result. |

#### Errors and handling

- `NotFoundError`: asset already deleted; refresh UI.
- `AuthError`: require sign-in.
- `NetworkError`: allow retry.

#### Minimal example

```ts
try {
  await sdk.client.photoBackup.deleteMedia(mediaAssetId);
} catch (error) {
  console.error('photoBackup.deleteMedia failed', error);
}
```
