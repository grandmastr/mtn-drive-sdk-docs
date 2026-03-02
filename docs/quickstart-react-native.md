---
title: React Native Quickstart
---

Set up `@pipeopshq/mtn-rn-sdk` in a React Native app, verify the integration, and run your first production-ready SDK flows.

## Prerequisites

- React Native app running on iOS or Android
- Host-app sign-in flow that can supply an MTN access token
- Persistent storage for tokens (for example, AsyncStorage)
- Device ID persistence only if you will use photo backup routes
- A file adapter only if you will use `photoBackupUploadManager`

## 1) Install

```bash
pnpm add @pipeopshq/mtn-rn-sdk@next
```

Optional storage helper:

```bash
pnpm add @react-native-async-storage/async-storage
```

## 2) Configure

Create the required baseline adapter (`tokenStore`).

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RnTokenStore } from '@pipeopshq/mtn-rn-sdk';

const TOKEN_KEY = 'mtn_sdk_tokens';

type StoredTokens = {
  accessToken: string | null;
  refreshToken?: string | null;
};

export const tokenStore: RnTokenStore = {
  async getTokens() {
    const raw = await AsyncStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as StoredTokens) : null;
  },
  async setTokens(tokens) {
    await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  },
  async clear() {
    await AsyncStorage.removeItem(TOKEN_KEY);
  },
};
```

If you plan to use photo backup APIs, add `deviceIdProvider` and `fileAdapter` as optional backup-only adapters:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FileAdapter } from '@pipeopshq/mtn-rn-sdk';

const DEVICE_ID_KEY = 'mtn_sdk_device_id';

export const deviceIdProvider = {
  async getDeviceId() {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;

    const created = `rn-device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, created);
    return created;
  },
};

export const fileAdapter: FileAdapter = {
  async getFileInfo(uri) {
    const source = await fetch(uri);
    if (!source.ok) throw new Error(`Cannot open file: ${uri}`);

    const blob = await source.blob();
    return {
      size: blob.size,
      mimeType: blob.type || 'application/octet-stream',
      filename: uri.split('/').pop(),
    };
  },

  async computeSha256(uri) {
    // Replace with your RN hash implementation.
    // Must return lowercase 64-char SHA-256 hex string.
    throw new Error(`computeSha256 not implemented for ${uri}`);
  },

  async upload({ uri, uploadUrl, headers, range }) {
    const source = await fetch(uri);
    if (!source.ok) throw new Error(`Cannot read file: ${uri}`);

    const blob = await source.blob();
    const body = range ? blob.slice(range.start, range.endExclusive) : blob;

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    return {
      byteSize: body.size,
      etag: response.headers.get('etag') ?? undefined,
    };
  },
};
```

File adapter implementation details (range behavior, ETag requirements, and failure rules) are documented in [React Native Required Interfaces](/docs/rn-interfaces#3-fileadapter-upload-manager-only).

## 3) Initialize

Create and export the SDK client.

```ts
import { createRNClient } from '@pipeopshq/mtn-rn-sdk';
import { tokenStore } from './sdk-adapters';

export const sdk = createRNClient({
  tokenStore,
});
```

Add the backup-only adapters only if you will use photo backup:

```ts
import { createRNClient } from '@pipeopshq/mtn-rn-sdk';
import { deviceIdProvider, fileAdapter, tokenStore } from './sdk-adapters';

export const sdk = createRNClient({
  tokenStore,
  deviceIdProvider,
  fileAdapter,
});
```

`createRNClient(...)` returns both:

- `sdk.client` for the typed module methods (`sessions`, `drive`, `sharing`, `bin`, `photoBackup`, `storage`)
- `sdk.photoBackupUploadManager` for the one-call RN media backup helper

React Native apps should use only `@pipeopshq/mtn-rn-sdk` imports.

`deviceIdProvider` is required only when you call `sdk.client.photoBackup.*`.

`fileAdapter` is required only when you call `sdk.photoBackupUploadManager.backupAsset(...)`.

Store the MTN token after host-app sign-in:

```ts
import { tokenStore } from './sdk-adapters';

export const onHostAppSignedIn = async (mtnAccessToken: string) => {
  await tokenStore.setTokens({
    accessToken: mtnAccessToken,
    refreshToken: null,
  });
};
```

## 4) Verify

Run this once during app bootstrap. It verifies auth, reads usage, and fetches the first drive page.

```ts
import { sdk } from './sdk-client';

export const verifySdkSetup = async () => {
  const sessions = await sdk.client.sessions.list();
  const summary = await sdk.client.storage.summary();
  const drivePage = await sdk.client.drive.listItems({ limit: 20 });

  return {
    sessionsCount: sessions.length,
    summary,
    drivePage,
  };
};
```

If verification fails with `AuthExchangeError` or `AuthError`, clear host-app auth state and route the user to sign-in.

## 5) Next steps

- Build file browsing and search with `drive.listItems()` + `drive.search()`
- Add sharing with `sharing.createShare()`
- Add trash controls using `bin` methods
- Add media backup with `photoBackupUploadManager.backupAsset()`

### Sharing flow (Optional)

```ts
export const createLinkShare = async (itemId: string) => {
  return sdk.client.sharing.createShare({
    itemId,
    permission: 'VIEW',
    targetType: 'LINK',
  });
};
```

### Media backup flow (Optional)

```ts
export const backupAsset = async (uri: string) => {
  return sdk.photoBackupUploadManager.backupAsset({
    uri,
    filename: 'camera-image.jpg',
    mimeType: 'image/jpeg',
    capturedAt: new Date().toISOString(),
    onProgress: ({ uploadedBytes, totalBytes }) => {
      console.log('backup progress', uploadedBytes, totalBytes);
    },
  });
};
```

### Error mapping pattern (Optional)

```ts
export const toDisplayError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return { type: 'UnknownError', message: 'Unknown error' };
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

## Related pages

- [React Native Required Interfaces](/docs/rn-interfaces)
- [React Native SDK Methods Reference](/docs/rn-sdk-methods-reference)
- [Error Handling and Retry Playbook](/docs/error-retry-matrix)
- [React Native Troubleshooting](/docs/rn-troubleshooting)
