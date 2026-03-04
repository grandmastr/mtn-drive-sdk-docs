---
title: Example
---

This is a full React Native integration example you can copy and adapt in your host app, centered on the default `sdk.uploads.*` flow for file/folder backup and photo sync.

It covers:

1. installation
2. token storage
3. upload task persistence
4. file and device adapters
5. `createRNClient(...)`
6. backup and sync tasks
7. optional low-level SDK modules

## 1) Install

```bash
pnpm add @pipeopshq/mtn-rn-sdk@next @react-native-async-storage/async-storage
```

`1.0.0` is currently published on the `next` dist-tag. `latest` still points to `0.2.0`, so this example keeps the explicit `@next` install.

## 2) Build the host-app adapters

Start with the auth and task-persistence adapters:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createAsyncStorageUploadTaskStore,
  type FileAdapter,
  type RnTokenStore,
} from '@pipeopshq/mtn-rn-sdk';

const TOKEN_KEY = 'mtn_sdk_tokens';
const DEVICE_ID_KEY = 'mtn_sdk_device_id';

type StoredTokens = { accessToken: string | null; refreshToken?: string | null };

export const tokenStore: RnTokenStore = {
  async getTokens() {
    const raw = await AsyncStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredTokens;
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

const inferMimeType = (uri: string): string => {
  if (uri.endsWith('.jpg') || uri.endsWith('.jpeg')) return 'image/jpeg';
  if (uri.endsWith('.png')) return 'image/png';
  if (uri.endsWith('.heic')) return 'image/heic';
  if (uri.endsWith('.mp4')) return 'video/mp4';
  return 'application/octet-stream';
};

export const fileAdapter: FileAdapter = {
  async getFileInfo(uri) {
    const localFile = await fetch(uri);
    if (!localFile.ok) throw new Error(`Cannot open file at ${uri}`);
    const blob = await localFile.blob();

    return {
      size: blob.size,
      mimeType: blob.type || inferMimeType(uri),
      filename: uri.split('/').pop(),
    };
  },

  async computeSha256(uri) {
    // Replace with your hashing utility and return lowercase 64-char hex.
    throw new Error(`computeSha256 not implemented for ${uri}`);
  },

  async upload({ uri, uploadUrl, headers, range, signal }) {
    const source = await fetch(uri);
    if (!source.ok) throw new Error(`Cannot read file for upload at ${uri}`);
    const sourceBlob = await source.blob();
    const uploadBody = range ? sourceBlob.slice(range.start, range.endExclusive) : sourceBlob;

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers,
      body: uploadBody,
      signal,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed with status ${uploadResponse.status}`);
    }

    return {
      byteSize: uploadBody.size,
      etag: uploadResponse.headers.get('etag') ?? undefined,
    };
  },
};
```

## 3) Create SDK client

Create one shared SDK instance for the app runtime.

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

## 4) Save user token after host-app sign-in

```ts
import { tokenStore } from './sdk-adapters';

export const onUserSignedIn = async (mtnAccessToken: string) => {
  await tokenStore.setTokens({
    accessToken: mtnAccessToken,
    refreshToken: null,
  });
};
```

## 5) Run the default backup flow

```ts
import { sdk } from './sdk-client';

export const startFileBackup = async (uri: string, parentId: string | null) => {
  await sdk.uploads.ready;

  const task = sdk.uploads.putFile({
    uri,
    parentId,
  });

  task.on(
    'state_changed',
    (snapshot) => {
      console.log('file-backup-state', {
        state: snapshot.state,
        bytesTransferred: snapshot.bytesTransferred,
        totalBytes: snapshot.totalBytes,
      });
    },
    (error) => {
      console.error('file-backup-failed', error.code, error.message);
    },
    () => {
      console.log('file-backup-complete');
    },
  );

  const finalSnapshot = await task;
  return finalSnapshot.result;
};
```

## 6) Restore and reattach after app restart

```ts
import { sdk } from './sdk-client';

export const getRestoredBackups = async () => {
  await sdk.uploads.ready;
  return sdk.uploads.getActiveTasks().map((task) => ({
    id: task.id,
    state: task.snapshot.state,
    bytesTransferred: task.snapshot.bytesTransferred,
    totalBytes: task.snapshot.totalBytes,
  }));
};
```

## 7) Optional low-level SDK modules

Use `sdk.client.*` only when you need custom low-level control or other product surfaces outside normal backup/sync flows.

```ts
import { sdk } from './sdk-client';

export const runAdvancedSdkFlow = async () => {
  const sessions = await sdk.client.sessions.list();
  const summary = await sdk.client.storage.summary();
  const drivePage = await sdk.client.drive.listItems({ limit: 20 });
  const share = await sdk.client.sharing.createShare({
    itemId: 'item_123',
    permission: 'VIEW',
    targetType: 'LINK',
  });

  return {
    sessions,
    summary,
    drivePage,
    share,
  };
};
```

## 8) Error handling pattern

```ts
export const toDisplayError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return { message: 'Unknown error' };
  }

  const withMeta = error as Error & {
    status?: number;
    code?: string;
  };

  return {
    name: error.name,
    message: error.message,
    status: withMeta.status,
    code: withMeta.code,
  };
};
```

Use this page with:

- [React Native Quickstart](/docs/quickstart-react-native) for fast setup
- [React Native Required Interfaces](/docs/rn-interfaces) for adapter contract details
- [RN Methods: Managed Uploads](/docs/rn-methods-managed-uploads) for the default backup and sync path
- [React Native SDK Methods Reference](/docs/rn-sdk-methods-reference) for the full method index
