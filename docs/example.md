---
title: Example
---

This is a full React Native integration example you can copy and adapt in your host app.

It covers:

1. installation
2. token storage
3. device id provider
4. `fileAdapter`
5. `createRNClient(...)`
6. calling SDK methods across modules

## 1) Install

```bash
pnpm add @pipeopshq/mtn-rn-sdk@next @react-native-async-storage/async-storage
```

## 2) Build the host-app adapters

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FileAdapter, RnTokenStore } from '@pipeopshq/mtn-rn-sdk';

const TOKEN_KEY = 'mtn_sdk_tokens';
const DEVICE_ID_KEY = 'mtn_sdk_device_id';

type StoredTokens = { accessToken: string | null; refreshToken?: string | null };

export const tokenStore: RnTokenStore = {
  async getTokens() {
    const raw = await AsyncStorage.getItem(TOKEN_KEY);
    if (!raw) return { accessToken: null, refreshToken: null };
    return JSON.parse(raw) as StoredTokens;
  },
  async setTokens(tokens) {
    await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  },
  async clear() {
    await AsyncStorage.removeItem(TOKEN_KEY);
  },
};

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
    // Example: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
    throw new Error(`computeSha256 not implemented for ${uri}`);
  },

  async upload({ uri, uploadUrl, headers, range }) {
    const source = await fetch(uri);
    if (!source.ok) throw new Error(`Cannot read file for upload at ${uri}`);
    const sourceBlob = await source.blob();
    const uploadBody = range ? sourceBlob.slice(range.start, range.endExclusive) : sourceBlob;

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers,
      body: uploadBody,
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

```ts
import { createRNClient } from '@pipeopshq/mtn-rn-sdk';
import { deviceIdProvider, fileAdapter, tokenStore } from './sdk-adapters';

export const sdk = createRNClient({
  tokenStore,
  deviceIdProvider,
  fileAdapter,
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

## 5) Call SDK methods (real integration flow)

```ts
import { sdk } from './sdk-client';

export const runSdkFlow = async () => {
  // sessions
  const sessions = await sdk.client.sessions.list();

  // storage
  const summary = await sdk.client.storage.summary();

  // drive
  const drivePage = await sdk.client.drive.listItems({ limit: 20 });
  const search = await sdk.client.drive.search({ q: 'invoice', limit: 20 });
  const folder = await sdk.client.drive.createFolder({ name: 'Mobile Uploads', parentId: null });

  // sharing
  const shares = await sdk.client.sharing.listShares();
  const publicShare = await sdk.client.sharing.resolvePublicShare('public_share_token');

  // bin
  const trash = await sdk.client.bin.list({ limit: 20 });

  // photo backup metadata
  const media = await sdk.client.photoBackup.listMedia({ limit: 20 });

  return {
    sessions,
    summary,
    drivePage,
    search,
    folder,
    shares,
    publicShare,
    trash,
    media,
  };
};
```

## 6) Photo backup upload example

```ts
import { sdk } from './sdk-client';

export const backupSingleAsset = async (uri: string) => {
  const result = await sdk.photoBackupUploadManager.backupAsset({
    uri,
    filename: 'camera-image.jpg',
    mimeType: 'image/jpeg',
    capturedAt: new Date().toISOString(),
    onProgress: ({ uploadedBytes, totalBytes }) => {
      console.log('photo-backup-progress', { uploadedBytes, totalBytes });
    },
  });

  return result;
};
```

## 7) Error handling pattern

```ts
export const toDisplayError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return { message: 'Unknown error' };
  }

  const withMeta = error as Error & {
    status?: number;
    code?: string;
    details?: unknown;
  };

  return {
    name: error.name,
    message: error.message,
    status: withMeta.status,
    code: withMeta.code,
    details: withMeta.details,
  };
};
```

Use this page with:

- `React Native Quickstart` for fast setup
- `React Native Required Interfaces` for adapter contract details
- `React Native SDK Methods Reference` for full method-by-method payloads
