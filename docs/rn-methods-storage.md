---
title: "RN Methods: Storage"
---

Read storage capacity and usage distribution data for dashboard and quota UX.

## Prerequisites

- SDK client created with `createRNClient(...)`
- User is authenticated

## Module overview

```ts
interface StorageModule {
  summary(): Promise<StorageSummary>;
  distribution(): Promise<StorageDistributionPayload>;
}
```

### `storage.summary()`

#### What this method does

Returns total used and total limit values for user and organization storage.

#### When to call it

Call at dashboard load and when refreshing storage widgets.

#### Signature

```ts
summary(): Promise<StorageSummary>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `(none)` | - | - | - | - | No request fields are required. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| `userUsedBytes` | `number` | Required | non-negative integer | User storage currently used. |
| `userLimitBytes` | `number` | Required | non-negative integer | User storage limit. |
| `orgUsedBytes` | `number` | Required | non-negative integer | Organization storage currently used. |
| `orgLimitBytes` | `number` | Required | non-negative integer | Organization storage limit. |
| `ok` | `boolean` | Required | `true` or `false` | Server-side status flag included in payload. |

#### Errors and handling

- `AuthError`: redirect to sign-in for protected calls.
- `NetworkError`: keep stale values in UI and show retry.
- `SdkError`: show fallback state and log diagnostics.

#### Minimal example

```ts
try {
  const summary = await sdk.client.storage.summary();
  console.log('used bytes', summary.userUsedBytes);
} catch (error) {
  console.error('storage.summary failed', error);
}
```

### `storage.distribution()`

#### What this method does

Returns bucketed storage usage values keyed by category name.

#### When to call it

Call when rendering storage breakdown charts or category usage cards.

#### Signature

```ts
distribution(): Promise<StorageDistributionPayload>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `(none)` | - | - | - | - | No request fields are required. |

#### Response fields

`StorageDistributionPayload` is `Record<string, number>`.

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| category key | `string` | Conditional | key name chosen by service | Storage category identifier. |
| category value | `number` | Conditional | non-negative integer | Usage bytes for that category. |

#### Errors and handling

- `AuthError`: request sign-in and stop protected retries.
- `NetworkError`: show chart skeleton or cached values with retry.
- `SdkError`: surface generic storage distribution error.

#### Minimal example

```ts
try {
  const distribution = await sdk.client.storage.distribution();
  console.log('distribution keys', Object.keys(distribution));
} catch (error) {
  console.error('storage.distribution failed', error);
}
```
