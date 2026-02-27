---
title: "RN Methods: Sessions"
---

Manage active user sessions, revoke individual sessions, and sign out other devices.

## Prerequisites

- SDK client created with `createRNClient(...)`
- User token stored in `tokenStore`

## Module overview

```ts
interface SessionsModule {
  list(): Promise<SessionInfo[]>;
  revoke(sessionId: string): Promise<RevokeSessionResult>;
  logoutOthers(): Promise<LogoutOthersResult>;
}
```

### `sessions.list()`

#### What this method does

Returns active sessions for the current authenticated user.

#### When to call it

Call during app bootstrap, account security pages, or before rendering “signed-in devices” UI.

#### Signature

```ts
list(): Promise<SessionInfo[]>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `(none)` | - | - | - | - | No request fields are required. |

#### Response fields

`SessionInfo` item fields:

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `id` | `string` | Required | non-empty string | Session identifier. |
| `deviceName` | `string` | Optional | string | Human-readable device label. |
| `deviceType` | `string` | Optional | string | Device class metadata. |
| `isCurrent` | `boolean` | Optional | `true` or `false` | Indicates current session. |
| `lastActiveAt` | `string` | Optional | ISO-8601 timestamp | Last activity timestamp. |
| `expiresAt` | `string` | Optional | ISO-8601 timestamp | Session expiry timestamp. |

#### Errors and handling

- `AuthExchangeError` or `AuthError`: clear host auth state and redirect to sign-in.
- `NetworkError`: keep last known UI state and show retry action.
- `SdkError`: show generic failure UI and log operation metadata.

#### Minimal example

```ts
try {
  const sessions = await sdk.client.sessions.list();
  console.log('active sessions', sessions.length);
} catch (error) {
  console.error('sessions.list failed', error);
}
```

### `sessions.revoke(sessionId)`

#### What this method does

Revokes one specific user session.

#### When to call it

Call from “Sign out this device” or “Remove device” actions in session management UI.

#### Signature

```ts
revoke(sessionId: string): Promise<RevokeSessionResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `sessionId` | `string` | Yes | none | valid session ID | Session to revoke. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `ok` | `boolean` | Required | `true` or `false` | Indicates whether revocation completed. |

#### Errors and handling

- `NotFoundError`: refresh session list; session may already be gone.
- `AuthError`: require sign-in before retrying protected actions.
- `NetworkError`: let user retry from the same UI action.

#### Minimal example

```ts
try {
  const result = await sdk.client.sessions.revoke(sessionId);
  console.log('revoke result', result.ok);
} catch (error) {
  console.error('sessions.revoke failed', error);
}
```

### `sessions.logoutOthers()`

#### What this method does

Revokes all sessions except the current one.

#### When to call it

Call after password reset, credential changes, or security confirmation flows.

#### Signature

```ts
logoutOthers(): Promise<LogoutOthersResult>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `(none)` | - | - | - | - | No request fields are required. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `ok` | `boolean` | Required | `true` or `false` | Indicates whether logout-others action completed. |

#### Errors and handling

- `AuthExchangeError` or `AuthError`: force sign-in and reload session state.
- `NetworkError`: keep current screen, show retry action.
- `SdkError`: show generic message and log details.

#### Minimal example

```ts
try {
  const result = await sdk.client.sessions.logoutOthers();
  console.log('logout others', result.ok);
} catch (error) {
  console.error('sessions.logoutOthers failed', error);
}
```
