---
title: Authentication
---

Exchange the MTN access token for MTN Drive API tokens, use bearer auth on protected requests, refresh short-lived access tokens, and end the current session cleanly.

## Before You Start

- You already have the MTN access token from the MTN app authentication flow.
- You can send JSON requests to the MTN Drive API.
- You can store the returned refresh token securely for later `POST /auth/refresh` calls.

## Authentication model

The MTN Drive API does not use the MTN access token directly on protected routes.

Instead, you:

1. exchange the MTN access token with `POST /auth/token-exchange`
2. receive a local MTN Drive API access token plus a refresh token
3. call protected routes with `Authorization: Bearer <accessToken>`
4. refresh with `POST /auth/refresh` when needed

## Primary auth route

Use `POST /auth/token-exchange` as the main exchange route for new integrations.

There is also a legacy compatibility alias at `POST /auth/exchange`. It currently performs the same exchange, but new integrations should document and call `/auth/token-exchange` first.

## What the exchange returns

The exchange response returns:

- `accessToken`: the bearer token for protected MTN Drive API routes
- `refreshToken`: the session refresh token
- `expiresIn`: access-token lifetime in seconds
- `refreshExpiresIn`: refresh-token lifetime in seconds
- `user`: the local MTN Drive user record associated with the exchange
- `mfaRequired`: always `false` for this exchange path in the current API flow

## Protected request pattern

Once the exchange succeeds, send the returned access token on protected routes:

```http
Authorization: Bearer <accessToken>
```

Example protected routes in this MVP:

- `POST /auth/logout`
- `GET /drive/items`
- `GET /v1/media`
- `POST /v2/uploads/sessions`
- `GET /v2/uploads/sessions/:sessionId`
- `POST /v2/uploads/sessions/:sessionId/refresh`

## Refresh flow

Use `POST /auth/refresh` when the bearer token expires or when a protected route returns an auth failure that indicates the access token is no longer usable.

The refresh request uses the refresh token returned by the exchange route.

On success, replace both stored tokens with the new values from the refresh response.

## Logout behavior

Use `POST /auth/logout` with the bearer token of the current API session.

This route ends the current session and returns `{ "ok": true }`.

For this direct API flow, treat logout as the point where you should clear locally stored API tokens.

## Recommended storage behavior

- store the API access token as a short-lived bearer token
- store the refresh token securely
- replace both tokens after every successful refresh
- clear both tokens after logout or after unrecoverable auth failure

## How to verify this worked

1. Call `POST /auth/token-exchange` with a valid MTN access token.
2. Confirm the response includes `accessToken`, `refreshToken`, `expiresIn`, and `refreshExpiresIn`.
3. Call one protected route with `Authorization: Bearer <accessToken>`.
4. Call `GET /drive/items` or `GET /v1/media` with `Authorization: Bearer <accessToken>`.
5. Call `POST /auth/refresh` and confirm you receive a new token pair.
6. Call `POST /auth/logout` and confirm the response is `{ "ok": true }`.

## Minimal flow example

```bash
curl -X POST https://youthful-fold.pipeops.app/auth/token-exchange \
  -H 'Content-Type: application/json' \
  -d '{
    "accessToken": "mtn-access-token",
    "deviceName": "Partner Gateway",
    "deviceType": "WEB"
  }'
```

Then use the returned `accessToken` like this:

```bash
curl 'https://youthful-fold.pipeops.app/drive/items?limit=20' \
  -H 'Authorization: Bearer api-access-token'
```

## What to read next

- [API Reference: Authentication](/api/api-reference-authentication)
- [Drive](/api/drive)
- [Photo Backup](/api/photo-backup)
- [Managed Uploads](/api/managed-uploads)
