---
title: Error Handling and Retry Playbook
---

Handle SDK errors predictably with user-safe retries, auth recovery, and module-specific fallback behavior.

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

## Error class matrix

| SDK error class | Typical trigger | Retryability | App action recommendation | User-facing message style |
| - | - | - | - | - |
| `AuthExchangeError` | token missing, exchange failed, refresh failed | User action required | clear host auth state and route to sign-in | “Session expired. Sign in again.” |
| `AuthError` | protected request rejected (`401/403`) | User action required | stop protected retries, request sign-in | “You are not authorized for this action.” |
| `ValidationError` | invalid input (`400/422`) | Never (until fixed) | show field-level validation errors | “Check your input and try again.” |
| `NotFoundError` | entity missing (`404`) | Never (unless state changes) | refresh lists, remove stale references | “Item no longer exists.” |
| `ConflictError` | concurrent state conflict (`409`) | Retry once after refresh | re-fetch resource state, then retry | “This item changed. Refresh and retry.” |
| `RateLimitError` | throttled (`429`) | Safe to retry with backoff | debounce UI actions and apply backoff | “Too many requests. Please wait a moment.” |
| `NetworkError` | connectivity/transport failure | Safe to retry | keep pending action and offer retry | “Network issue. Check connection and retry.” |
| `SdkError` | other normalized SDK failure | Case-by-case | inspect metadata, log details, show fallback | “Something went wrong. Try again.” |

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

### Upload and Photo Backup

- On multipart failure, reconcile or abort session before restarting upload.
- If multipart part upload has no `etag`, treat as adapter implementation bug.

### Storage

- If summary/distribution fails, degrade dashboard widgets and provide explicit refresh action.

## Suggested logging payload

For non-validation failures, log:

- operation name (for example `drive.createFolder`)
- `error.name`
- `error.message`
- `error.status` if present
- `error.code` if present
- `error.details` if present and safe
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
    details?: unknown;
  };

  return {
    type: error.name,
    message: error.message,
    status: withMeta.status,
    code: withMeta.code,
    details: withMeta.details,
  };
};
```
