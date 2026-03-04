---
title: Error Handling and Retry Playbook
---

Handle SDK errors predictably with plain-English UI messaging, safe retry behavior, and clear app actions.

## Prerequisites

- You completed [React Native Quickstart](/docs/quickstart-react-native)
- You use a shared app-level error mapping utility

## Retry model

Default SDK transport retry policy:

| Setting | Default |
| - | - |
| `maxRetries` | `1` |
| `retryDelayMs` | `250` (multiplied by attempt) |
| `retryMethods` | `['GET']` |
| `retryStatusCodes` | `[408, 429, 500, 502, 503, 504]` |

Additional behavior:

- Protected calls attempt one auth refresh retry on first `401`.
- Public-share methods run in no-auth mode and do not require token exchange.

## How to think about retry decisions

There are two different retry ideas in this SDK:

1. **Request retry**
   This is the low-level HTTP retry behavior for ordinary SDK requests such as list, read, and lookup calls.
2. **Upload task retry**
   This is the task-level behavior inside `sdk.uploads.*` when an upload part or upload session hits a temporary problem.

If you mix those two together, retry behavior feels confusing. A simple rule:

- list and fetch calls can often retry safely
- auth failures should not keep retrying
- upload task failures should usually create a new task after the failure reason is fixed

## Retry model in plain English

The table above means:

- the SDK retries only once by default for eligible low-level requests
- the retry delay starts at `250ms`
- only `GET` requests are retried automatically by that low-level transport rule
- only temporary server or network-style status codes are eligible

That is why a read call such as “load my files” may retry quietly once, while an upload task may fail with a task error instead of using the same low-level retry rule.

## Safe retry rule of thumb

- Retry now: network issues, rate limits, temporary server failures
- Retry after refresh: conflict errors
- Do not auto-retry: auth failures, validation failures, missing files, changed files
- For upload tasks: if you see `storage/retry-limit-exceeded` or `storage/session-expired`, start a new task instead of trying to revive the old one

## Error class matrix

| SDK error class | What it means in plain English | Safe to retry? | What the app should show | What the app should do |
| - | - | - | - | - |
| `AuthExchangeError` | The SDK could not use the current token | No, not until sign-in | “Session expired. Sign in again.” | Clear host auth state and route to sign-in |
| `AuthError` | The user is not authorized for this protected call | No, not until sign-in | “You need to sign in again.” | Stop protected retries and send user to sign-in |
| `ValidationError` | The request input is not valid | No | “Check your input and try again.” | Show field-level validation feedback |
| `NotFoundError` | The item or session is gone | Usually no | “That item no longer exists.” | Refresh lists and remove stale references |
| `ConflictError` | The item changed while you were acting on it | Sometimes | “This item changed. Refresh and try again.” | Refresh data, then retry once |
| `RateLimitError` | Too many requests happened too quickly | Yes, after waiting | “Too many requests. Please wait a moment.” | Back off and retry later |
| `NetworkError` | A transport or connection problem happened | Yes | “Network issue. Check your connection and retry.” | Keep the action pending and offer retry |
| `SdkError` | A normalized SDK failure happened | Depends | “Something went wrong. Try again.” | Log metadata and show fallback UI |

## Upload task error codes

| Upload task code | What it means | Safe to retry? | What the app should show | What the app should do |
| - | - | - | - | - |
| `storage/canceled` | The user canceled the task | No automatic retry | “Upload canceled.” | Treat the task as intentionally finished |
| `storage/unauthenticated` | The session expired before the task could continue | No, not until sign-in | “Session expired. Sign in again.” | Route to sign-in, then start a new task |
| `storage/unauthorized` | The user does not have permission for the target action | No | “You do not have permission for that upload.” | Stop retries and show a safe failure state |
| `storage/retry-limit-exceeded` | Temporary failures kept happening until the retry budget was exhausted | Yes, but as a new task | “Upload failed after retrying. Try again.” | Let the user start a fresh task |
| `storage/session-expired` | The upload session can no longer continue safely | No, not on the same task | “Upload expired. Start again.” | Start a new task from the beginning |
| `storage/source-file-missing` | The local file is gone | No | “The file is no longer on this device.” | Ask the user to choose the file again |
| `storage/source-file-changed` | The local file changed while uploading | No | “The file changed during upload.” | Ask the user to retry with the current file |
| `storage/invalid-checksum` | The file hash no longer matches what the SDK expected | No | “The file changed before upload could finish.” | Re-read the file and start a new task |
| `storage/unknown` | The SDK could not classify the failure exactly | Case-by-case | “Upload failed. Try again.” | Log details and let the user retry |

## Auth recovery flow

### Token lost or exchange failure

1. SDK throws `AuthExchangeError` or `AuthError`.
2. SDK may clear token state through `tokenStore.clear()` path.
3. Host app should:
- clear in-memory user session,
- navigate to sign-in,
- block protected SDK calls until new token is saved.

### Missing token at startup

If `tokenStore.getTokens()` returns no usable `accessToken`:

- treat user as signed out,
- skip protected module calls,
- show sign-in CTA.

## Module-level handling guidance

### Sessions

- If `sessions.list()` fails with auth errors during bootstrap, redirect immediately to sign-in.

### Drive and Sharing

- For list/search failures, keep stale content visible with inline retry.
- For mutation failures, show errors near action controls and preserve user input state.

### Managed uploads (default)

- `storage/canceled`: user canceled the task; do not auto-retry, and treat the task as intentionally finished.
- `storage/retry-limit-exceeded`: start a new task after showing retry UI.
- `storage/session-expired`: start a new task; the old task cannot be resumed safely.
- `storage/source-file-missing` or `storage/source-file-changed`: re-read the source file and start a new task only after the user confirms.
- If multipart part upload has no `etag`, treat it as a `fileAdapter` implementation bug.

### Advanced photo backup

- On low-level multipart failure, reconcile or abort session before restarting manual upload orchestration.

### Storage

- If summary/distribution fails, degrade dashboard widgets and provide explicit refresh action.

## Suggested logging payload

For non-validation failures, log:

- operation name (for example `drive.createFolder`)
- `error.name`
- `error.message`
- `error.status` if present
- `error.code` if present
- request correlation identifiers if safe

## Minimal global mapper

```ts
export const toAppError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return { type: 'unknown', message: 'Unknown error' };
  }

  const withMeta = error as Error & {
    status?: number;
    code?: string;
  };

  return {
    type: error.name,
    message: error.message,
    status: withMeta.status,
    code: withMeta.code,
  };
};
```
