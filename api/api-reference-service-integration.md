---
title: "API Reference: Service Integration"
---

Use these routes when a service tenant authenticates with an integration API key and then manages mirrored users inside its own org.

## Prerequisites

- You already have a valid integration API key issued for the service tenant.
- You know the base URL for the MTN Drive environment you are integrating with.
- You can store short-lived bearer tokens securely.

### POST /integration/auth/token

#### What this endpoint does

Exchanges the integration API key for a short-lived bearer token.

#### When to call it

Call it when the service starts, when the bearer token expires, or whenever the service needs a fresh token for protected requests.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | No | `ApiKey <integration-api-key>` |
| `x-integration-api-key` | No | Raw integration API key value |
| `Accept` | No | `application/json` |

Use either `Authorization: ApiKey ...` or `x-integration-api-key`. The API accepts both shapes.

#### Request body / params

This route does not require a request body.

#### Response body

```json
{
  "accessToken": "jwt.access.token",
  "expiresIn": 600,
  "tokenType": "Bearer"
}
```

#### Errors and handling

- `401 Unauthorized`: the API key is missing, malformed, revoked, or invalid; stop retrying until the key is replaced.
- `403 Forbidden`: the integration tenant is not allowed to authenticate in the current state.

#### Minimal curl example

```bash
curl -X POST https://youthful-fold.pipeops.app/integration/auth/token \
  -H 'Authorization: ApiKey int_sandbox_xxx.secret' \
  -H 'Accept: application/json'
```

### GET /integration/users

#### What this endpoint does

Lists the managed users mirrored into the integration tenant.

#### When to call it

Call it when you need the current service-user roster for storage, sharing, or reporting.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |
| `Accept` | No | `application/json` |

#### Request body / params

This route does not take a request body.

#### Response body

```json
[
  {
    "id": "managed-user-id",
    "orgId": "org-id",
    "externalUserId": "customer-123",
    "email": "customer@example.com",
    "phoneNumber": "+2348000000000",
    "name": "Managed User",
    "role": "USER",
    "archivedAt": null,
    "createdAt": "2026-03-23T10:00:00.000Z",
    "updatedAt": "2026-03-23T10:00:00.000Z"
  }
]
```

#### Errors and handling

- `401 Unauthorized`: the bearer token is missing or expired.
- `403 Forbidden`: the token is not valid for the integration tenant.

#### Minimal curl example

```bash
curl 'https://youthful-fold.pipeops.app/integration/users' \
  -H 'Authorization: Bearer integration-access-token'
```

### POST /integration/users

#### What this endpoint does

Creates or updates a mirrored managed user in the integration tenant.

#### When to call it

Call it when the service needs a stable local record for a downstream user, account, or subscriber.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |
| `Content-Type` | Yes | `application/json` |

#### Request body / params

```json
{
  "externalUserId": "customer-123",
  "email": "customer@example.com",
  "name": "Managed User",
  "phoneNumber": "+2348000000000"
}
```

| Field | Type | Required | Notes |
| - | - | - | - |
| `externalUserId` | `string` | Yes | Stable partner-defined user id inside the tenant. |
| `email` | `string` | Yes | User email address mirrored into the local record. |
| `name` | `string` | Yes | Display name for the managed user. |
| `phoneNumber` | `string` | No | Optional phone number for the managed user. |

#### Response body

```json
{
  "id": "managed-user-id",
  "orgId": "org-id",
  "externalUserId": "customer-123",
  "email": "customer@example.com",
  "phoneNumber": "+2348000000000",
  "name": "Managed User",
  "role": "USER",
  "archivedAt": null,
  "createdAt": "2026-03-23T10:00:00.000Z",
  "updatedAt": "2026-03-23T10:00:00.000Z"
}
```

#### Errors and handling

- `400 ValidationError`: the request body is malformed.
- `401 Unauthorized`: the bearer token is missing or expired.
- `403 Forbidden`: the bearer token is not valid for the integration tenant.

#### Minimal curl example

```bash
curl -X POST https://youthful-fold.pipeops.app/integration/users \
  -H 'Authorization: Bearer integration-access-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "externalUserId": "customer-123",
    "email": "customer@example.com",
    "name": "Managed User",
    "phoneNumber": "+2348000000000"
  }'
```

### POST /integration/users/:externalUserId/token

#### What this endpoint does

Creates a short-lived bearer token for one managed user so downstream Drive, upload, and photo-backup calls can run in that user context.

#### When to call it

Call it when the service needs to act on behalf of one specific managed user.

#### Headers

| Header | Required | Value |
| - | - | - |
| `Authorization` | Yes | `Bearer <accessToken>` |
| `Content-Type` | Yes | `application/json` |

#### Request body / params

```json
{
  "deviceName": "Partner Gateway",
  "deviceType": "WEB"
}
```

| Field | Type | Required | Notes |
| - | - | - | - |
| `externalUserId` | `string` | Yes | Managed-user identifier in the path. |
| `deviceName` | `string` | Yes | Non-empty device or integration label. |
| `deviceType` | `IOS \| ANDROID \| WEB \| OTHER` | Yes | Device type enum accepted by the API. |

#### Response body

```json
{
  "accessToken": "jwt.access.token",
  "expiresIn": 900,
  "tokenType": "Bearer",
  "user": {
    "id": "managed-user-id",
    "orgId": "org-id",
    "email": "managed-user@example.com",
    "name": "Managed User",
    "role": "USER"
  }
}
```

#### Errors and handling

- `401 Unauthorized`: the bearer token is missing, expired, or not valid for the integration tenant.
- `404 Not Found`: the managed user does not exist in the tenant.
- `403 Forbidden`: the managed user is archived or otherwise unavailable.

#### Minimal curl example

```bash
curl -X POST 'https://youthful-fold.pipeops.app/integration/users/customer-123/token' \
  -H 'Authorization: Bearer integration-access-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "deviceName": "Partner Gateway",
    "deviceType": "WEB"
  }'
```
