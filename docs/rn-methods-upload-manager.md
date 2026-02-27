---
title: "RN Methods: Upload Manager"
---

Use the high-level RN upload manager to run complete photo backup uploads (hash, session, upload, part confirmation, completion) with one call.

## Prerequisites

- SDK client created with `createRNClient(...)`
- `fileAdapter` fully implemented, including multipart `etag` support
- `photoBackup` module available through authenticated client

## Module overview

```ts
class ReactNativePhotoBackupUploadManager {
  backupAsset(input: BackupAssetInput): Promise<BackupAssetResult>;
}
```

### `photoBackupUploadManager.backupAsset(input)`

#### What this method does

Runs the full backup orchestration pipeline for one local media asset:

- reads file metadata with `fileAdapter.getFileInfo`
- computes content hash with `fileAdapter.computeSha256`
- creates photo backup upload session
- uploads via single or multipart strategy
- confirms parts (multipart)
- completes session and returns final media asset ID

#### When to call it

Call for camera roll sync jobs, manual media backup actions, and retryable background upload workflows.

#### Signature

```ts
backupAsset(input: BackupAssetInput): Promise<BackupAssetResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `uri` | `string` | Yes | none | valid local file URI | Source media file path. |
| `filename` | `string` | No | `fileAdapter` value | non-empty string | Optional filename override. |
| `mimeType` | `string` | No | `fileAdapter` value | valid MIME type | Optional MIME type override. |
| `capturedAt` | `string` | No | none | ISO-8601 timestamp | Capture timestamp metadata. |
| `width` | `number` | No | none | positive integer | Media width metadata. |
| `height` | `number` | No | none | positive integer | Media height metadata. |
| `onProgress` | `(progress: UploadProgress) => void` | No | none | callback | Upload progress callback with `uploadedBytes` and `totalBytes`. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `deduped` | `boolean` | Required | boolean | `true` when existing media asset is reused. |
| `mediaAssetId` | `string` | Required | non-empty string | Final media asset ID after dedupe or upload completion. |
| `sessionId` | `string` | Optional | non-empty string | Upload session ID for non-deduped upload paths. |

#### Errors and handling

- `Error('Invalid upload session response...')`: upload session response missing required fields; treat as non-retryable integration failure and log payload context.
- `Error('Multipart upload adapter must return etag...')`: `fileAdapter.upload` did not return part ETag; fix adapter implementation.
- `AuthError` or `AuthExchangeError`: clear host auth and force sign-in before retry.
- `NetworkError`: safe to retry `backupAsset` from queue/orchestrator.
- `ConflictError`: refresh session state and retry once.

#### Minimal example

```ts
try {
  const result = await sdk.photoBackupUploadManager.backupAsset({
    uri: localUri,
    filename: 'camera-image.jpg',
    mimeType: 'image/jpeg',
    capturedAt: new Date().toISOString(),
    onProgress: ({ uploadedBytes, totalBytes }) => {
      console.log('progress', uploadedBytes, totalBytes);
    },
  });

  console.log('backup complete', result.mediaAssetId, result.deduped);
} catch (error) {
  console.error('photoBackupUploadManager.backupAsset failed', error);
}
```
