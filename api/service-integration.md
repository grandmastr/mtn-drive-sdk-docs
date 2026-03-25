---
title: Service Integration
---

Use this page when your backend, middleware, or service tenant authenticates to MTN Drive with an integration API key.

## Before You Start

- You already have an integration API key issued for your service tenant.
- You can store the returned bearer token securely on the system that will call MTN Drive.
- You know the base URL for the MTN Drive environment you are integrating with.

## Authentication model

Service integrations use an integration API key to obtain a short-lived bearer token.

Instead, you:

1. send the integration API key with `POST /integration/auth/token`
2. receive a short-lived bearer token
3. call protected routes with `Authorization: Bearer <accessToken>`
4. create or update managed users through `POST /integration/users`
5. mint a managed-user bearer token through `POST /integration/users/:externalUserId/token` when downstream calls need a user-scoped session

## What the integration token returns

The `POST /integration/auth/token` response returns:

- `accessToken`: the bearer token for protected MTN Drive API routes
- `expiresIn`: access-token lifetime in seconds
- `tokenType`: always `Bearer`

The integration token is short-lived. In v1, services re-exchange the API key when the token expires.

## Managed users

Use managed users when the service needs a stable local identity for storage, sharing, or upload ownership.

The integration flow supports two managed-user steps:

- `POST /integration/users` to create or update a mirrored managed user
- `POST /integration/users/:externalUserId/token` to mint a short-lived bearer token for downstream Drive, photo backup, and upload calls

## Recommended flow

1. Call `POST /integration/auth/token` with your service API key.
2. Store the returned bearer token securely.
3. Create or update one managed user with `POST /integration/users` when you need a local identity.
4. Mint a managed-user bearer token when a downstream call needs to act in that user context.
5. Send `Authorization: Bearer <accessToken>` on protected MTN Drive routes.

## How to verify this worked

1. Call `POST /integration/auth/token` and confirm the response includes `accessToken`, `expiresIn`, and `tokenType`.
2. Call `GET /integration/users` with the returned bearer token and confirm you receive the managed-user roster.
3. Call `POST /integration/users` to create or update one managed user and confirm the response includes `externalUserId`.
4. Call `POST /integration/users/:externalUserId/token` and confirm you receive a short-lived bearer token for that managed user.
5. Call one protected route such as `GET /drive/items` with the managed-user bearer token and confirm the request succeeds.

## Minimal flow example

```bash
curl -X POST https://youthful-fold.pipeops.app/integration/auth/token \
  -H 'Authorization: ApiKey int_sandbox_xxx.secret' \
  -H 'Accept: application/json'
```

Then use the returned `accessToken` like this:

```bash
curl 'https://youthful-fold.pipeops.app/drive/items?limit=20' \
  -H 'Authorization: Bearer integration-access-token'
```

## What to read next

- [API Reference: Service Integration](/api/api-reference-service-integration)
- [Drive](/api/drive)
- [Photo Backup](/api/photo-backup)
- [Managed Uploads](/api/managed-uploads)
