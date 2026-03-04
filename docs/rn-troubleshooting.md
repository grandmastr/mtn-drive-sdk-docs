---
title: React Native Troubleshooting
---

Use this page when your first integration works only partially, or when uploads fail in ways that are hard to interpret from raw SDK errors.

If an error word is unfamiliar, check [Glossary](/docs/glossary) before you debug the deeper integration details.

## Prerequisites

- You completed [React Native Quickstart](/docs/quickstart-react-native)
- You implemented [React Native Required Interfaces](/docs/rn-interfaces)

## The SDK is not sending authenticated requests

### Symptoms

- Protected calls fail with `AuthExchangeError` or `AuthError`
- Calls work only after you sign in again

### What it means

The SDK cannot get a usable token from `tokenStore`, or the stored token is stale.

### Checks

- Confirm `tokenStore.getTokens()` returns `{ accessToken: string }`
- Confirm the token is saved immediately after host-app sign-in
- Confirm the token value is not empty

### Fix

1. Save the MTN token as soon as sign-in succeeds.
2. Clear stale auth state when auth errors happen.
3. Ask the user to sign in again before retrying protected calls.

### What the app should do

Show a re-login path, not a generic retry loop.

## Managed uploads fail during client initialization

### Symptoms

- `createRNClient(...)` throws before uploads start
- Error includes `managed uploads require fileAdapter`
- Error includes `managed uploads require uploads.taskStore`

### What it means

The task-based upload runtime was enabled, but the required upload adapters are missing.

### Checks

- Confirm `createRNClient(...)` includes `fileAdapter`
- Confirm `createRNClient(...)` includes `uploads: { taskStore }`
- Confirm `uploads.taskStore` is a real persistent store

### Fix

1. Add a real `fileAdapter`.
2. Add `uploads.taskStore`.
3. Recreate the client with both values present.

### What the app should do

Block the upload UI and show a setup error to the integrator during development.

## Managed photo backup uploads fail immediately

### Symptoms

- `sdk.uploads.backupAsset(...)` throws immediately
- Error includes `managed photo backup uploads require deviceIdProvider`

### What it means

Photo backup needs a stable device ID, and the client was created without `deviceIdProvider`.

### Checks

- Confirm `deviceIdProvider` was passed into `createRNClient(...)`
- Confirm `getDeviceId()` returns one stable value across restarts

### Fix

1. Add `deviceIdProvider`.
2. Persist the first generated ID.
3. Start a new backup task after the client is fixed.

### What the app should do

Show a “photo backup is not configured yet” message instead of repeatedly retrying the task.

## Multipart uploads fail with missing ETag

### Symptoms

- Error includes `Multipart upload adapter must return etag`
- Upload moves into terminal error

### What it means

Your `fileAdapter.upload(...)` completed a multipart part upload, but it did not return the `etag` the SDK needs to confirm that part.

### Checks

- Confirm your upload response exposes the `etag` header
- Confirm ranged uploads return `etag`
- Confirm `byteSize` matches the uploaded range length

### Fix

1. Read the server `etag` header.
2. Return it from `fileAdapter.upload(...)`.
3. Start a new task after fixing the adapter.

### What the app should do

Show a retry option for the developer or tester, not the end user, because this is usually an integration bug.

## Pause feels delayed

### Symptoms

- `task.pause()` returns `true`
- `bytesTransferred` can still rise briefly
- The task becomes `paused` after a short delay

### What it means

The SDK stopped scheduling new work, but one in-flight request or part upload was already underway.

### Checks

- Confirm `fileAdapter.upload(...)` forwards `signal`
- Confirm your networking layer actually respects `AbortSignal`
- Confirm the upload is multipart

### Fix

1. Honor `signal` inside `fileAdapter.upload(...)`.
2. Expect one short delay while in-flight work settles.
3. Drive the UI from `snapshot.state`, not only the byte counter.

### What the app should do

Show the task as “pausing” or keep the pause button disabled until the state changes to `paused`.

## Restored uploads do not appear after restart

### Symptoms

- Uploads were running before the app closed
- `getActiveTasks()` returns an empty list after restart

### What it means

Task restore did not finish yet, the store is not persistent, or the app is using a different SDK instance.

### Checks

- Confirm you wait for `await sdk.uploads.ready`
- Confirm `uploads.taskStore` writes real data
- Confirm the app reuses one shared SDK instance

### Fix

1. Await `sdk.uploads.ready` before reading task state.
2. Keep one shared client instance per app runtime.
3. Verify your task store persists across app restarts.

### What the app should do

Delay rendering of “active uploads” until restore finishes.

## Upload is stuck at 0%

### Symptoms

- The task remains `running`
- `bytesTransferred` stays at `0`
- No terminal error appears

### What it means

The SDK started the task, but the source file is not being read correctly or the adapter is not making progress.

### Checks

- Confirm the local URI is valid
- Confirm `fileAdapter.getFileInfo(...)` can read the file
- Confirm `fileAdapter.upload(...)` can read the same URI
- Confirm `computeSha256(...)` is implemented

### Fix

1. Log and inspect the incoming URI.
2. Verify the file exists before starting the task.
3. Finish the `computeSha256(...)` implementation.

### What the app should do

Show a non-terminal “upload is still starting” state briefly, then surface a retry path if no progress appears.

## File missing or changed during upload

### Symptoms

- Error code is `storage/source-file-missing`
- Error code is `storage/source-file-changed`

### What it means

The local source file was deleted, moved, or changed while the task was running.

### Checks

- Confirm the URI still points to a real file
- Confirm the file was not edited while uploading
- Confirm `modifiedAtMs` is stable if you provide it

### Fix

1. Ask the user to choose the file again.
2. Start a new task from the current file.
3. Do not try to resume the old task automatically.

### What the app should do

Explain that the source file changed and the user needs to retry with the current file.

## Restore-resume tests are confusing after restart

### Symptoms

- A restored task appears, but it does not immediately start moving
- A tester expects the task to restart from zero

### What it means

Restore reattaches to the saved task state first. Progress may continue from a saved checkpoint rather than from the beginning.

### Checks

- Confirm `autoRestore` is enabled
- Confirm the same task ID is present after restart
- Confirm the file still exists locally

### Fix

1. Treat restored tasks as continuation, not fresh uploads.
2. Reconnect the UI to the existing task object.
3. Start a brand-new task only if the restored task ended in error.

### What the app should do

Show the restored task as “resuming” and keep its existing progress rather than resetting the progress bar.

## Related pages

- [Error Handling and Retry Playbook](/docs/error-retry-matrix)
- [Common Recipes](/docs/common-recipes)
- [React Native Required Interfaces](/docs/rn-interfaces)
