---
title: React Native Required Interfaces
---

This page explains each interface you must implement in the MTN host app before using the SDK.

## Who Owns What

- Host app owns user sign-in, local token storage, device identity, and file I/O primitives.
- SDK owns token exchange, request auth, retry behavior, and module APIs (`sessions`, `drive`, `sharing`, `bin`, `photoBackup`, `storage`).

## Integration Story (Concrete Flow)

1. User signs in inside MTN app.
2. Host app receives MTN user token.
3. Host app saves token in your `tokenStore` implementation.
4. SDK reads token via `tokenStore.getTokens()`.
5. SDK exchanges token internally, then performs protected requests.
6. If auth is unrecoverable, SDK calls `tokenStore.clear()` and returns an error.

## `tokenStore`

### `tokenStore` explained

A persistence interface the SDK uses to read and clear auth state.

### `tokenStore` interface

```ts
interface RnTokenStore {
  getTokens(): Promise<{ accessToken: string | null; refreshToken?: string | null } | null>;
  setTokens(tokens: { accessToken: string | null; refreshToken?: string | null }): Promise<void>;
  clear(): Promise<void>;
}
```

### Method behavior

- `getTokens`: must return MTN user token in `accessToken`.
- `setTokens`: keep implemented; reserved for SDK/session flows.
- `clear`: remove stored auth state and make `getTokens()` return null/empty.

### Minimal implementation

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'mtn_sdk_tokens';

export const tokenStore = {
  async getTokens() {
    const raw = await AsyncStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async setTokens(tokens) {
    await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  },
  async clear() {
    await AsyncStorage.removeItem(TOKEN_KEY);
  },
};
```

## `deviceIdProvider`

### `deviceIdProvider` explained

A function that returns a stable per-installation device id.

### Why SDK needs it

Some upload/device-related flows include device context headers.

### `deviceIdProvider` interface

```ts
interface DeviceIdProvider {
  getDeviceId(): Promise<string>;
}
```

### Practical guidance

- Generate once and persist (e.g., SecureStore/AsyncStorage).
- Do not regenerate on every app launch.

## `fileAdapter`

### `fileAdapter` explained

Think of `fileAdapter` as a driver that lets the SDK use your app's file APIs.
The SDK does not know whether you use Expo, bare RN, `react-native-fs`, or any other IO layer.
It only calls these three methods.

### `fileAdapter` interface

```ts
interface FileAdapter {
  getFileInfo(uri: string): Promise<{ size: number; mimeType: string; filename?: string }>;
  computeSha256(uri: string): Promise<string>;
  upload(params: {
    uri: string;
    uploadUrl: string;
    headers?: Record<string, string>;
    range?: { start: number; endExclusive: number };
  }): Promise<{ byteSize: number; etag?: string }>;
}
```

### Terms explained

- `uri`: local file location in RN (`file://...` or library URI).
- `size`: file size in bytes.
- `mimeType`: media type (example: `image/jpeg`).
- `computeSha256`: content hash used by backup flow for dedupe/session negotiation.
- `uploadUrl`: pre-signed URL from backend for direct upload.
- `range`: byte window for multipart uploads (`start` inclusive, `endExclusive` exclusive).
- `etag`: object-store part checksum/identifier required for multipart part confirmation.

### When SDK calls each method

1. `getFileInfo(uri)` runs first when backup starts so SDK can create a valid upload session.
2. `computeSha256(uri)` runs before upload so SDK can dedupe and identify content safely.
3. `upload(...)` runs one or more times:
   - once for single-part upload,
   - multiple times with different `range` values for multipart uploads.

### Expected upload behavior

- If `range` is absent: upload full file.
- If `range` exists: upload only that byte slice.
- Return uploaded byte count and, when available, `etag`.
- Throw on non-2xx responses.

## End-To-End SDK Bootstrapping

```ts
import { createRNClient } from '@pipeopshq/mtn-rn-sdk';

export const sdk = createRNClient({
  tokenStore,
  deviceIdProvider,
  fileAdapter,
});

await sdk.client.storage.summary();
```

If you need a full copy-paste implementation of `tokenStore`, `deviceIdProvider`, and `fileAdapter`, use the `React Native Quickstart` page.

## Implementation Checklist

- `tokenStore.getTokens()` returns MTN token in `accessToken`.
- `tokenStore.clear()` fully clears auth state.
- `deviceIdProvider` returns stable id.
- `fileAdapter.upload()` supports whole-file and byte-range uploads.
- `fileAdapter.upload()` returns `etag` for multipart uploads.
