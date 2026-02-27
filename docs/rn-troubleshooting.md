---
title: React Native Troubleshooting
---

Diagnose common React Native SDK integration failures quickly with symptom-first checks and concrete fixes.

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
3. Retry protected call only after new token is stored.

## Device registration or upload calls fail unexpectedly

### Symptoms

- Photo backup session creation fails
- Multipart upload cannot proceed

### Checks

- Confirm `deviceIdProvider.getDeviceId()` returns stable value across restarts
- Confirm `createRNClient` received valid `deviceIdProvider`
- Confirm file adapter can read URI and upload bytes

### Fix

1. Persist a single installation ID.
2. Ensure file URIs are readable by your RN runtime.
3. Re-run verification flow after adapter fixes.

## Multipart uploads fail with missing ETag

### Symptoms

- Error includes: `Multipart upload adapter must return etag`

### Checks

- Confirm `fileAdapter.upload(...)` returns `etag` for ranged uploads
- Confirm response headers expose ETag value in your fetch layer

### Fix

1. Return `etag` from upload response headers.
2. Keep `byteSize` accurate for each chunk.
3. Retry `photoBackupUploadManager.backupAsset(...)`.

## Upload progress stalls after app resume

### Symptoms

- Backup job appears stuck after network interruption
- Session URLs are expired

### Checks

- Confirm session refresh path is reachable (`photoBackup.refreshSession(...)`)
- Confirm upload code retries with refreshed part URLs

### Fix

1. Refresh upload session when part URLs are missing/expired.
2. Reconcile session state with `photoBackup.reconcileSession(...)` if completion state is uncertain.
3. Abort unrecoverable sessions and start a new session.

## Trash actions return not found or conflict

### Symptoms

- Restore/purge fails for selected items
- Item disappears between selection and action

### Checks

- Confirm selected IDs still exist in latest trash page
- Check for concurrent actions from other clients/devices

### Fix

1. Refresh trash list before retry.
2. Remove stale IDs from local selection.
3. Re-run action with current IDs.

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

- [React Native SDK Methods Reference](/docs/rn-sdk-methods-reference)
- [Error Handling and Retry Playbook](/docs/error-retry-matrix)
