---
title: React Native Troubleshooting
---

Diagnose common React Native SDK integration failures quickly with symptom-first checks and concrete fixes for the default managed upload path and the advanced low-level modules.

## Prerequisites

- You completed [React Native Quickstart](/docs/quickstart-react-native)
- You implemented [React Native Required Interfaces](/docs/rn-interfaces)

## The SDK is not sending authenticated requests

### Symptoms

- Protected calls fail with `AuthExchangeError` or `AuthError`
- Calls work only after app re-login

### Checks

- Confirm `tokenStore.getTokens()` returns `{ accessToken: string }`
- Confirm `accessToken` is not empty or stale
- Confirm host app writes token to `tokenStore` after sign-in

### Fix

1. Save token immediately after sign-in.
2. On auth errors, clear host auth state and route to sign-in.
3. Retry protected call only after a new token is stored.

## Managed uploads fail during client initialization

### Symptoms

- `createRNClient(...)` throws before the app can start uploads
- Error includes `managed uploads require fileAdapter`
- Error includes `managed uploads require uploads.taskStore`

### Checks

- Confirm `createRNClient(...)` includes a real `fileAdapter`
- Confirm `createRNClient(...)` includes `uploads: { taskStore }`
- Confirm you are using `createAsyncStorageUploadTaskStore(...)` or an equivalent `UploadTaskStore`

### Fix

1. Add a real `fileAdapter`.
2. Add `uploads.taskStore`.
3. Recreate the SDK client once both are present.

## Managed photo backup uploads fail unexpectedly

### Symptoms

- `sdk.uploads.backupAsset(...)` throws immediately
- Error includes `managed photo backup uploads require deviceIdProvider`
- Photo backup session creation fails

### Checks

- Confirm `deviceIdProvider.getDeviceId()` returns a stable value across restarts
- Confirm `createRNClient(...)` received a valid `deviceIdProvider`
- Confirm file URIs are readable by your RN runtime

### Fix

1. Persist one installation ID and reuse it.
2. Ensure the local URI is readable before starting the task.
3. Re-run the task after adapter fixes.

## Multipart uploads fail with missing ETag

### Symptoms

- Error includes `Multipart upload adapter must return etag`
- Multipart tasks enter terminal error after part upload

### Checks

- Confirm `fileAdapter.upload(...)` returns `etag` for ranged uploads
- Confirm response headers expose ETag values in your fetch layer
- Confirm `byteSize` matches the exact uploaded range length

### Fix

1. Return `etag` from upload response headers.
2. Keep `byteSize` accurate for each confirmed chunk.
3. Retry by starting a new managed upload task after the adapter is fixed.

## Pause does not appear immediate

### Symptoms

- `task.pause()` returns `true`, but `bytesTransferred` can still increase briefly
- The task emits `paused` after one or more extra progress jumps

### Checks

- Confirm `fileAdapter.upload(...)` forwards `signal`
- Confirm your networking layer honors `AbortSignal`
- Confirm the upload is multipart (several parts may already be in flight)

### Fix

1. Honor `signal` in `fileAdapter.upload(...)`.
2. Expect already in-flight parts to settle before the task emits `paused`.
3. Bind UI to `task.snapshot.state`, not only the latest byte counter.

## Restored uploads do not appear where you expect

### Symptoms

- Active uploads are missing after app restart
- A second RN client instance can see tasks but cannot control them

### Checks

- Confirm `await sdk.uploads.ready` runs before reading task state
- Confirm all app screens share the same `uploads.taskStore`
- Confirm you are using the original SDK client instance to control task state

### Fix

1. Await `sdk.uploads.ready` before calling `getActiveTasks()`.
2. Use one shared SDK client instance per app runtime.
3. Treat secondary clients as read-only mirrors only.

## Large restore-resume tests time out

### Symptoms

- Verification tooling times out during `restore-resume`
- Upload resumes correctly but the test process exits before completion

### Checks

- Confirm the task is still progressing in bytes
- Confirm the file is large enough to require multipart upload
- Confirm test tooling timeout is long enough for the current network

### Fix

1. Use the current default harness timeout (`300000ms`) or a larger override if needed.
2. Keep the persisted task store file between `restore-start` and `restore-resume`.
3. Re-run `restore-resume` without changing the source file.

## Trash actions return not found or conflict

### Symptoms

- Restore/purge fails for selected items
- Item disappears between selection and action

### Checks

- Confirm selected IDs still exist in the latest trash page
- Check for concurrent actions from other clients/devices

### Fix

1. Refresh the trash list before retry.
2. Remove stale IDs from local selection.
3. Re-run the action with current IDs.

## Public share token flow fails

### Symptoms

- Public share resolve returns errors
- Password prompts keep repeating

### Checks

- Confirm token value is exact and unmodified
- Confirm password value matches expected format and user input

### Fix

1. Retry resolve with exact token/password values.
2. Handle `RateLimitError` with exponential backoff.
3. Show clear user feedback for invalid or expired tokens.

## Debug checklist before filing an issue

- SDK package version in app
- Method name and input shape used
- Error name/message/status/code
- Whether failure is auth, validation, network, or conflict
- Minimal reproducible sequence

## Related pages

- [RN Methods: Managed Uploads](/docs/rn-methods-managed-uploads)
- [React Native SDK Methods Reference](/docs/rn-sdk-methods-reference)
- [Error Handling and Retry Playbook](/docs/error-retry-matrix)
