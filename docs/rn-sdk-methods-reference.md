---
title: React Native SDK Methods Reference
---

Find each React Native SDK method by module, understand when to call it, and implement calls with request/response and error-handling guidance.

## Prerequisites

- You completed [React Native Quickstart](/docs/quickstart-react-native)
- You implemented required adapters in [React Native Required Interfaces](/docs/rn-interfaces)

## How to use this page

Use this page as the method index. Each module page documents every method with the same structure:

1. What this method does
2. When to call it
3. Signature
4. Request fields
5. Response fields
6. Errors and handling
7. Minimal example

## Module map

| Module | Methods | Page |
| - | - | - |
| `sessions` | 3 | [Sessions methods](/docs/rn-methods-sessions) |
| `drive` | 28 | [Drive methods](/docs/rn-methods-drive) |
| `sharing` | 11 | [Sharing methods](/docs/rn-methods-sharing) |
| `bin` | 6 | [Bin methods](/docs/rn-methods-bin) |
| `photoBackup` | 13 | [Photo backup methods](/docs/rn-methods-photo-backup) |
| `storage` | 2 | [Storage methods](/docs/rn-methods-storage) |
| `photoBackupUploadManager` | 1 | [Upload manager method](/docs/rn-methods-upload-manager) |

## Common types used across modules

```ts
type QueryValue = string | number | boolean | null | undefined | Array<string | number | boolean>;
type QueryParams = Record<string, QueryValue>;

interface CursorListResponse<T> {
  items: T[];
  nextCursor: string | null;
}
```

## Common errors used across modules

| Error | Typical trigger | Recommended handling |
| - | - | - |
| `AuthExchangeError` | token exchange or refresh fails | clear host auth and route to sign-in |
| `AuthError` | protected call rejected | prompt sign-in and stop protected retries |
| `ValidationError` | invalid input | show field-level validation feedback |
| `NotFoundError` | item/session no longer exists | refresh lists and clear stale references |
| `ConflictError` | state changed concurrently | refresh then retry |
| `RateLimitError` | request throttled | back off and retry |
| `NetworkError` | transport/connectivity failure | retry with user feedback |
| `SdkError` | normalized SDK failure | show generic error and log metadata |

## Typical SDK integration sequences

### App bootstrap

1. `sessions.list()`
2. `storage.summary()`
3. `drive.listItems({ limit: 20 })`

### File flow

1. `drive.listItems(...)`
2. `drive.search(...)`
3. `drive.getMetadata(itemId)`
4. `drive.getDownloadUrl(itemId)`
5. `sharing.createShare(...)`

### Upload flow

1. `drive.createUploadSession(...)` or `drive.createMultipartSession(...)`
2. Upload bytes to returned URL(s)
3. Multipart: `drive.createMultipartPartUrl(...)` + `drive.completeMultipartSession(...)`
4. `drive.completeUpload({ fileId })`

### Trash flow

1. `drive.deleteItem(...)`
2. `bin.list(...)` or `drive.listTrash(...)`
3. `bin.restore(...)` or purge methods

### Photo backup flow

1. `photoBackup.registerDevice(...)`
2. `photoBackupUploadManager.backupAsset(...)`
3. Recovery: `photoBackup.refreshSession(...)` + `photoBackup.reconcileSession(...)`

## Related pages

- [Error Handling and Retry Playbook](/docs/error-retry-matrix)
- [React Native Troubleshooting](/docs/rn-troubleshooting)
