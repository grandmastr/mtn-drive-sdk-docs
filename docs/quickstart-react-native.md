---
title: React Native Quickstart
---

Set up `@pipeopshq/mtn-rn-sdk` in a React Native app using the default managed `sdk.uploads.*` path first, then layer in low-level modules only where you need custom control.

## Prerequisites

- React Native app running on iOS or Android
- Host-app sign-in flow that can supply an MTN access token
- Persistent storage for tokens and upload task state (for example, AsyncStorage)
- A file layer that can read local URIs, hash bytes, and upload ranged chunks
- Device ID persistence only if you will use managed photo backup or low-level `sdk.client.photoBackup.*`

## 1) Install

```bash
pnpm add @pipeopshq/mtn-rn-sdk@next @react-native-async-storage/async-storage
```

`1.0.0` is currently published on the `next` dist-tag. `latest` still points to `0.2.0`, so keep using `@next` for the managed upload path.

## 2) Configure

Create the required baseline adapters:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createAsyncStorageUploadTaskStore,
  type FileAdapter,
  type RnTokenStore,
} from '@pipeopshq/mtn-rn-sdk';

const TOKEN_KEY = 'mtn_sdk_tokens';
const DEVICE_ID_KEY = 'mtn_sdk_device_id';

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

export const uploadTaskStore = createAsyncStorageUploadTaskStore(AsyncStorage);

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
    // Replace with your RN hashing utility.
    // Must return lowercase 64-char SHA-256 hex.
    throw new Error(`computeSha256 not implemented for ${uri}`);
  },

  async upload({ uri, uploadUrl, headers, range, signal }) {
    const source = await fetch(uri);
    if (!source.ok) throw new Error(`Cannot read file: ${uri}`);

    const blob = await source.blob();
    const body = range ? blob.slice(range.start, range.endExclusive) : blob;

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers,
      body,
      signal,
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

`fileAdapter` and `uploads.taskStore` are the required pair for the managed upload path. `deviceIdProvider` is only required when you call `sdk.uploads.backupAsset(...)` or low-level `sdk.client.photoBackup.*`.

File adapter details (range handling, `AbortSignal`, `etag`, and `modifiedAtMs`) are documented in [React Native Required Interfaces](/docs/rn-interfaces).

## 3) Initialize

Create and export one SDK client for the app runtime.

```ts
import { createRNClient } from '@pipeopshq/mtn-rn-sdk';
import { fileAdapter, tokenStore, uploadTaskStore } from './sdk-adapters';

export const sdk = createRNClient({
  tokenStore,
  fileAdapter,
  uploads: {
    taskStore: uploadTaskStore,
  },
});
```

If you will use managed photo backup, add `deviceIdProvider`:

```ts
import { createRNClient } from '@pipeopshq/mtn-rn-sdk';
import { deviceIdProvider, fileAdapter, tokenStore, uploadTaskStore } from './sdk-adapters';

export const sdk = createRNClient({
  tokenStore,
  deviceIdProvider,
  fileAdapter,
  uploads: {
    taskStore: uploadTaskStore,
  },
});
```

`createRNClient(...)` returns:

- `sdk.uploads` for the default task-based upload flow
- `sdk.client` for typed low-level modules (`sessions`, `drive`, `sharing`, `bin`, `photoBackup`, `storage`)

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

Run this once during app bootstrap. It restores task state, verifies auth, reads usage, and fetches the first drive page.

```ts
import { sdk } from './sdk-client';

export const verifySdkSetup = async () => {
  await sdk.uploads.ready;

  const sessions = await sdk.client.sessions.list();
  const summary = await sdk.client.storage.summary();
  const drivePage = await sdk.client.drive.listItems({ limit: 20 });
  const activeUploads = sdk.uploads.getActiveTasks();

  return {
    sessionsCount: sessions.length,
    summary,
    drivePage,
    activeUploadsCount: activeUploads.length,
  };
};
```

If verification fails with `AuthExchangeError` or `AuthError`, clear host-app auth state and route the user to sign-in.

## 5) Next steps

- Start drive uploads with `sdk.uploads.putFile(...)`
- Start managed photo backup with `sdk.uploads.backupAsset(...)`
- Reattach UI after app restart with `sdk.uploads.getActiveTasks()`
- Use `sdk.client.*` only for advanced protocol-level control

### Drive upload (Recommended)

```ts
export const uploadFile = (uri: string, parentId: string | null) => {
  const task = sdk.uploads.putFile({
    uri,
    parentId,
  });

  task.on('state_changed', (snapshot) => {
    console.log('upload progress', snapshot.bytesTransferred, snapshot.totalBytes);
  });

  return task;
};
```

### Managed photo backup (Optional)

```ts
export const backupAsset = (uri: string) => {
  const task = sdk.uploads.backupAsset({
    uri,
    capturedAt: new Date().toISOString(),
  });

  task.on('state_changed', (snapshot) => {
    console.log('backup progress', snapshot.bytesTransferred, snapshot.totalBytes);
  });

  return task;
};
```

### Advanced low-level module call (Optional)

```ts
export const createLinkShare = async (itemId: string) => {
  return sdk.client.sharing.createShare({
    itemId,
    permission: 'VIEW',
    targetType: 'LINK',
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
- [RN Methods: Managed Uploads](/docs/rn-methods-managed-uploads)
- [React Native SDK Methods Reference](/docs/rn-sdk-methods-reference)
- [Error Handling and Retry Playbook](/docs/error-retry-matrix)
- [React Native Troubleshooting](/docs/rn-troubleshooting)
