---
title: "API Reference: Authentication"
---

Use these routes to exchange the MTN access token for local MTN Drive API tokens, refresh those tokens, and end the current authenticated session.

## Prerequisites

- You can obtain the MTN access token from the MTN app authentication layer.
- You can store the returned API tokens securely.
- You already know the base URL for the MTN Drive API environment you are integrating with.

### POST /auth/token-exchange

#### What this endpoint does

Exchanges the MTN access token for an MTN Drive API access token and refresh token.

#### When to call it

Call it immediately after the MTN app auth flow succeeds and before the first protected MTN Drive API request.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Content-Type` | Yes | `application/json` |
| `Accept` | No | `application/json` |

#### Request body / params

```json
{
  "accessToken": "mtn-access-token",
  "deviceName": "Partner Gateway",
  "deviceType": "WEB"
}
```

| Field | Type | Required | Notes |
| - | - | - | - |
| `accessToken` | `string` | Yes | MTN access token from the MTN app auth flow. |
| `deviceName` | `string` | Yes | Non-empty device or integration label. |
| `deviceType` | `IOS \| ANDROID \| WEB \| OTHER` | Yes | Device type enum accepted by the API. |

Compatibility note: `POST /auth/exchange` is a legacy alias for this flow, but new integrations should prefer `/auth/token-exchange`.

#### Response body

```json
{
  "accessToken": "jwt.access.token",
  "refreshToken": "sessionId.secret",
  "expiresIn": 900,
  "refreshExpiresIn": 2592000,
  "user": {
    "id": "user-id",
    "orgId": "org-id",
    "email": "mtn+2348012345678@mtn.local",
    "name": "MTN User",
    "role": "USER"
  },
  "mfaRequired": false
}
```

#### Errors and handling

- `401 EXTERNAL_TOKEN_VALIDATION_FAILED`: the MTN token was rejected; obtain a fresh MTN token and retry.
- `409 EXTERNAL_IDENTITY_CONFLICT`: the exchange identity maps to conflicting local records; stop automatic retries and escalate.
- `503 EXTERNAL_TOKEN_PROVIDER_UNAVAILABLE`: the MTN validation provider is unavailable; retry later with backoff.

#### Minimal curl example

```bash
curl -X POST https://youthful-fold.pipeops.app/auth/token-exchange \
  -H 'Content-Type: application/json' \
  -d '{
    "accessToken": "mtn-access-token",
    "deviceName": "Partner Gateway",
    "deviceType": "WEB"
  }'
```

### POST /auth/refresh

#### What this endpoint does

Rotates the refresh token and returns a fresh MTN Drive API access token plus a new refresh token.

#### When to call it

Call it when the current API access token expires or when you need a fresh bearer token for later protected requests.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Content-Type` | Yes | `application/json` |
| `Accept` | No | `application/json` |

#### Request body / params

```json
{
  "refreshToken": "sessionId.secret"
}
```

| Field | Type | Required | Notes |
| - | - | - | - |
| `refreshToken` | `string` | Yes | Refresh token previously returned by exchange or refresh. |

#### Response body

```json
{
  "accessToken": "jwt.access.token",
  "refreshToken": "new.sessionId.secret",
  "expiresIn": 900,
  "refreshExpiresIn": 2592000
}
```

#### Errors and handling

- `401 Unauthorized`: the refresh token is invalid, expired, or already rotated; clear local API auth state and restart the exchange flow.
- `400 ValidationError`: the request body is malformed; fix the caller and retry only after correction.

#### Minimal curl example

```bash
curl -X POST https://youthful-fold.pipeops.app/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{
    "refreshToken": "sessionId.secret"
  }'
```

### POST /auth/logout

#### What this endpoint does

Logs out the current authenticated API session.

#### When to call it

Call it when the user signs out or when your integration wants to explicitly end the current MTN Drive API session before clearing local tokens.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |
| `Accept` | No | `application/json` |

#### Request body / params

This route does not require a request body in the current API flow.

#### Response body

```json
{
  "ok": true
}
```

#### Errors and handling

- `401 Unauthorized`: the bearer token is missing, invalid, or expired; clear local API tokens anyway because the session is no longer usable.
- `403 AuthError`: the token is not accepted for the protected route; treat it as a sign-out condition and clear local tokens.

#### Minimal curl example

```bash
curl -X POST https://youthful-fold.pipeops.app/auth/logout \
  -H 'Authorization: Bearer api-access-token'
```
