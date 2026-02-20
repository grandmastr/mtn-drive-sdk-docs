---
title: React Native Quickstart
---

This guide is for the team integrating the React Native SDK into the MTN host app.

## Install

```bash
pnpm add @pipeopshq/mtn-rn-sdk@next
```

## Integration Story

1. MTN host app signs in the user and gets the MTN user access token.
2. Your `tokenStore.getTokens()` returns that token as `accessToken`.
3. You call SDK methods from `sdk.client.*`.
4. SDK exchanges MTN token to local API session internally before protected calls.
5. If auth state is invalid, SDK calls `tokenStore.clear()` so the host app can reset session state.

## Configure The Client

Use this complete example if you want a concrete starting point.

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createRNClient, type FileAdapter, type RnTokenStore } from '@pipeopshq/mtn-rn-sdk';

const TOKEN_KEY = 'mtn_sdk_tokens';
const DEVICE_ID_KEY = 'mtn_sdk_device_id';

const tokenStore: RnTokenStore = {
  async getTokens() {
    const raw = await AsyncStorage.getItem(TOKEN_KEY);
    if (!raw) return { accessToken: null, refreshToken: null };
    return JSON.parse(raw) as { accessToken: string | null; refreshToken?: string | null };
  },
  async setTokens(tokens) {
    await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  },
  async clear() {
    await AsyncStorage.removeItem(TOKEN_KEY);
  },
};

const deviceIdProvider = {
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
  return 'application/octet-stream';
};

const fileAdapter: FileAdapter = {
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
    // Implement with your preferred RN hashing utility and return lowercase 64-char hex.
    // Example expected return: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
    throw new Error(`computeSha256 not implemented for ${uri}`);
  },
  async upload({ uri, uploadUrl, headers, range }) {
    const source = await fetch(uri);
    if (!source.ok) throw new Error(`Cannot read file for upload at ${uri}`);
    const sourceBlob = await source.blob();
    const uploadBody = range
      ? sourceBlob.slice(range.start, range.endExclusive)
      : sourceBlob;

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

const sdk = createRNClient({
  tokenStore,
  deviceIdProvider,
  fileAdapter,
});

await sdk.client.sessions.list();
```

## What `fileAdapter` Is

`fileAdapter` is the SDK's bridge into your app's file system and upload stack.

- `getFileInfo(uri)`: tells SDK the file size, name, and mime type.
- `computeSha256(uri)`: gives SDK a stable content hash for dedupe and upload session negotiation.
- `upload(...)`: performs the actual PUT upload to the URL the SDK provides (full file or byte range).

Without `fileAdapter`, photo backup methods cannot inspect files or upload bytes.

## Required Contracts

- `tokenStore.getTokens()` must return MTN user token in `accessToken`.
- `tokenStore.clear()` must remove local auth state on device.
- `deviceIdProvider.getDeviceId()` returns stable device id used for device-aware flows.
- `fileAdapter` handles file metadata, hashing, and upload for photo backup.

## Token Source

Use the same environment variable used by the web example: `MTN_ACCESS_TOKEN`.

## Next Step

Read these two pages next:

- `React Native Required Interfaces`: what you must implement in the host app.
- `React Native SDK Methods Reference`: every `sdk.client.*` method, request format, and response format.
