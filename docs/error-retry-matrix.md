---
title: Error Handling and Retry Matrix
---

## Auth stage

| Scenario                     | SDK behavior                                | Error surface          |
| ---------------------------- | ------------------------------------------- | ---------------------- |
| Missing MTN token            | Clear auth state, fail request              | `AuthExchangeError`    |
| Session handshake fails      | Clear auth state, fail request              | `AuthExchangeError`    |
| Handshake payload invalid    | Clear auth state, fail request              | `AuthExchangeError`    |
| Protected request auth error | Attempt refresh + retry once when supported | none if retry succeeds |
| Refresh fails                | Clear auth state, fail request              | `AuthExchangeError`    |

## Request retry policy

Default retry policy:

- `maxRetries`: `1`
- `retryDelayMs`: `250` (multiplied by attempt)
- `retryMethods`: `GET`
- `retryStatusCodes`: `408`, `429`, `500`, `502`, `503`, `504`

You can override this via `retryPolicy` in core or RN client config.

## Error mapping

HTTP responses are normalized to SDK error classes:

- `401/403` -> `AuthError`
- `404` -> `NotFoundError`
- `409` -> `ConflictError`
- `400/422` -> `ValidationError`
- `429` -> `RateLimitError`
- other HTTP -> `SdkError`
- network/transport -> `NetworkError`
