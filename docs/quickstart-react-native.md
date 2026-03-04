---
title: React Native Quickstart
---

Get one working MTN Drive upload into your React Native app in a few minutes, using the default `sdk.uploads.*` task API.

## Before You Start

You should already have:

- a React Native app running on iOS or Android
- a host-app sign-in flow that can provide an MTN access token
- AsyncStorage available for token and task persistence

You will build:

- one shared SDK client
- one file upload task
- one verification step to confirm the SDK is wired correctly

If any of the terms below are new, skim [Concepts](/docs/concepts) or [Glossary](/docs/glossary) first.

## 1) Install

Install the SDK and the storage dependency used in this quickstart:

```bash
pnpm add @pipeopshq/mtn-rn-sdk@next @react-native-async-storage/async-storage
```

Right now, `@next` resolves to `1.0.1`, while `latest` still resolves to `0.2.0`.

If you target iOS, also run:

```bash
cd ios && pod install && cd ..
```

### How to verify this worked

Run:

```bash
pnpm why @pipeopshq/mtn-rn-sdk
```

You should see the package in your app dependency tree.

## 2) Configure

Create the four host-app adapters below.

- `tokenStore`: always required for authenticated calls
- `fileAdapter`: required for task-based uploads
- `uploads.taskStore`: required for task restore
- `deviceIdProvider`: required only for `sdk.uploads.backupAsset(...)`

Create `sdk-adapters.ts`:

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
    // Replace this with your real RN hashing utility.
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

On iOS you will usually see `file://...` URIs. On Android you may see `file://...` or `content://...`, so make sure your `fileAdapter` can read the URIs your app actually receives.

### How to verify this worked

Import the file and make sure TypeScript accepts:

```ts
import { tokenStore, fileAdapter, uploadTaskStore } from './sdk-adapters';
```

If that import type-checks, your baseline adapters are in place.

## 3) Initialize

Create one shared SDK client for the app runtime.

For basic file uploads:

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

If you will also run photo backup, include `deviceIdProvider`:

```ts
import { createRNClient } from '@pipeopshq/mtn-rn-sdk';
import {
  deviceIdProvider,
  fileAdapter,
  tokenStore,
  uploadTaskStore,
} from './sdk-adapters';

export const sdk = createRNClient({
  tokenStore,
  deviceIdProvider,
  fileAdapter,
  uploads: {
    taskStore: uploadTaskStore,
  },
});
```

### Optional: control retry behavior

Most apps should keep the default retry behavior first.

There are two different retry settings you can pass during setup:

1. `retryPolicy`
   This controls retries for normal SDK requests like list, read, and lookup calls.
2. `uploads.managedRetryPolicy`
   This controls retries while a task-based upload is already running.

The simplest rule:

- use `retryPolicy` for normal API calls
- use `managedRetryPolicy` for upload tasks
- leave both alone until your first upload works

Example with the current default values made explicit:

```ts
export const sdk = createRNClient({
  tokenStore,
  fileAdapter,
  retryPolicy: {
    maxRetries: 1,
    retryDelayMs: 250,
    retryMethods: ['GET'],
    retryStatusCodes: [408, 429, 500, 502, 503, 504],
  },
  uploads: {
    taskStore: uploadTaskStore,
    managedRetryPolicy: {
      maxPartRetries: 3,
      baseDelayMs: 500,
      maxDelayMs: 5000,
    },
  },
});
```

### What `retryPolicy` means

`retryPolicy` is the low-level transport retry rule for ordinary SDK requests.

Think of it as:

“If a normal API call fails for a temporary reason, should the SDK try again automatically?”

With the default values:

- the SDK retries only once
- it waits a short time before retrying
- it retries only `GET` requests automatically
- it retries only temporary status codes like timeouts, rate limits, and temporary server failures

That means a read call like “load my file list” may retry quietly once, but auth failures should not keep looping.

### What `managedRetryPolicy` means

`managedRetryPolicy` is the upload-task retry rule used by `sdk.uploads.*`.

Think of it as:

“If one step inside an upload fails because of a temporary network problem, how hard should the SDK try before giving up?”

With the default values:

- an upload part can retry up to 3 times
- the wait starts at 500ms
- the wait can grow, but it caps at 5000ms

This is what helps an upload survive a short mobile-network glitch without you writing your own retry loop.

### When to change these values

Only tune `retryPolicy` if ordinary API calls are too aggressive or not aggressive enough for your network conditions.

Only tune `managedRetryPolicy` if upload tasks are giving up too quickly, or if you want uploads to fail faster instead of retrying several times.

If you are still in first-time setup, keep the defaults. Change these only after you see a real issue.

After your host app signs a user in, save the MTN token:

```ts
import { tokenStore } from './sdk-adapters';

export const onHostAppSignedIn = async (mtnAccessToken: string) => {
  await tokenStore.setTokens({
    accessToken: mtnAccessToken,
    refreshToken: null,
  });
};
```

### How to verify this worked

This import should resolve cleanly:

```ts
import { sdk } from './sdk-client';
```

If `sdk` is defined, the client is wired into your app.

## 4) Verify

Run one bootstrap check after app start:

```ts
import { sdk } from './sdk-client';

export const verifySdkSetup = async () => {
  await sdk.uploads.ready;

  const sessions = await sdk.client.sessions.list();
  const summary = await sdk.client.storage.summary();
  const drivePage = await sdk.client.drive.listItems({ limit: 20 });

  return {
    sessionsCount: sessions.length,
    summary,
    drivePage,
    activeUploadsCount: sdk.uploads.getActiveTasks().length,
  };
};
```

If this fails with `AuthExchangeError` or `AuthError`, your app is not providing a usable token yet. Save a fresh token, then run the check again.

### How to verify this worked

The returned object should contain:

- a session count
- a storage summary
- a drive page payload
- an active upload count

That confirms auth, low-level modules, and task restore are all connected.

## 5) Upload your first file

Start one file upload task:

```ts
import { sdk } from './sdk-client';

export const startFileUpload = (uri: string) => {
  const task = sdk.uploads.putFile({
    uri,
    parentId: null,
  });

  task.on('state_changed', (snapshot) => {
    console.log(snapshot.state, snapshot.bytesTransferred, snapshot.totalBytes);
  });

  return task;
};
```

For photo backup, use the same task model:

```ts
const task = sdk.uploads.backupAsset({
  uri,
  capturedAt: new Date().toISOString(),
});
```

### How to verify this worked

You should see `state_changed` snapshots while the upload runs, and the task should eventually finish with:

- `success` for a completed upload
- `error` for a failed upload
- `canceled` only when you cancel it yourself

## 6) Next steps

- Use [Common Recipes](/docs/common-recipes) for copy-paste upload patterns
- Use [React Native Troubleshooting](/docs/rn-troubleshooting) if setup is failing
- Use [React Native Required Interfaces](/docs/rn-interfaces) if you need adapter contract details
- Use [RN Methods: Managed Uploads](/docs/rn-methods-managed-uploads) if you want the full task API reference

## Success checklist

- SDK installed from `@next`
- AsyncStorage installed
- One shared SDK client created
- `await sdk.uploads.ready` runs during bootstrap
- `sdk.uploads.putFile(...)` starts a task
- The task emits progress snapshots
