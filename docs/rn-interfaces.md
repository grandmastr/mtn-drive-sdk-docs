---
title: React Native Required Interfaces
---

Implement the host-app adapters correctly so the SDK can manage auth, upload-task persistence, device identity, file metadata, hashing, and upload transport reliably.

## Prerequisites

- You completed [React Native Quickstart](/docs/quickstart-react-native)
- You can persist small JSON payloads in app storage
- You can read files and upload bytes from local URIs

## Do I need this page?

Read this page when you are wiring the SDK into a real app and need to implement or debug the required adapters.

If you only want the shortest path to a working upload, follow [React Native Quickstart](/docs/quickstart-react-native) first and come back here only if setup fails.

If any adapter term is unfamiliar, check [Glossary](/docs/glossary) first.

## Adapter summary

| Adapter | What it does | When it is required |
| - | - | - |
| `tokenStore` | Stores the signed-in user's MTN token | Always |
| `fileAdapter` | Reads files, hashes them, and uploads bytes | Required for `sdk.uploads.*` |
| `uploads.taskStore` | Restores active upload tasks after app restart | Required for `sdk.uploads.*` |
| `deviceIdProvider` | Returns one stable device ID | Required only for photo backup |

## 1) `tokenStore`

### What it does

`tokenStore` lets the SDK read, persist, and clear host-app auth tokens.

### When it is required

This adapter is always required because every protected SDK call depends on it.

### Common mistake

Writing the token too late. Save the MTN token immediately after host-app sign-in.

### Signature

```ts
interface RnTokenStore {
  getTokens(): Promise<AuthTokens | null>;
  setTokens(tokens: AuthTokens): Promise<void>;
  clear(): Promise<void>;
}

interface AuthTokens {
  accessToken: string | null;
  refreshToken?: string | null;
  expiresAt?: number;
}
```

### Field semantics

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `accessToken` | `string \| null` | Yes | none | token string or `null` | Token input used by SDK auth exchange before protected calls. |
| `refreshToken` | `string \| null` | No | none | token string | Optional host-app token field. |
| `expiresAt` | `number` | No | none | epoch milliseconds | Optional host-app token metadata. |

### Required behavior

| Method | Required behavior |
| - | - |
| `getTokens()` | Return latest stored token payload, or `null` if signed out. |
| `setTokens(tokens)` | Persist exactly the provided payload. |
| `clear()` | Remove token state so next `getTokens()` returns signed-out state. |

### Starter implementation

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'mtn_sdk_tokens';

export const tokenStore = {
  async getTokens() {
    const raw = await AsyncStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { accessToken: string | null; refreshToken?: string | null };
  },
  async setTokens(tokens: { accessToken: string | null; refreshToken?: string | null }) {
    await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  },
  async clear() {
    await AsyncStorage.removeItem(TOKEN_KEY);
  },
};
```

## 2) `deviceIdProvider` (photo backup only)

### What it does

`deviceIdProvider` returns a stable per-install identifier.

This adapter is optional unless you call `sdk.uploads.backupAsset(...)` or `sdk.client.photoBackup.*`.

### When it is required

Only add this when you need photo backup or low-level photo sync APIs.

### Common mistake

Generating a new ID every time. The value must stay stable across app restarts.

### Signature

```ts
interface DeviceIdProvider {
  getDeviceId(): Promise<string>;
}
```

### Field semantics

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| return value | `string` | Yes | none | non-empty stable string | Device identity used by device-aware upload flows. |

### Required behavior

- Return the same ID across app restarts on one installation.
- Do not regenerate on every call.
- Generate once and persist.

### Starter implementation

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

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
```

## 3) `uploadTaskStore` (managed uploads only)

### What it does

`uploads.taskStore` persists active managed upload tasks so `sdk.uploads.ready` can restore them after app restart.

This adapter is required when you configure the managed `sdk.uploads.*` path.

### When it is required

Required for task-based uploads. If you skip it, `sdk.uploads` cannot run.

### Common mistake

Reading tasks before `await sdk.uploads.ready`. The store may be correct, but restore has not finished yet.

### Signature

```ts
interface UploadTaskStore {
  loadAll(): Promise<PersistedUploadTaskRecord[]>;
  save(record: PersistedUploadTaskRecord): Promise<void>;
  remove(taskId: string): Promise<void>;
}
```

### Field semantics

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `loadAll()` return value | `PersistedUploadTaskRecord[]` | Yes | none | array | Previously persisted active task records. |
| `save(record)` | `PersistedUploadTaskRecord` | Yes | none | exact SDK payload | Upsert one active task record. |
| `remove(taskId)` | `string` | Yes | none | managed task ID | Remove one persisted task record. |

### Required behavior

| Method | Required behavior |
| - | - |
| `loadAll()` | Return every persisted active task record, or an empty array. |
| `save(record)` | Persist the full record exactly as provided. |
| `remove(taskId)` | Remove the persisted record for that task ID. |

### Starter implementation

For React Native, use the built-in helper:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStorageUploadTaskStore } from '@pipeopshq/mtn-rn-sdk';

export const uploadTaskStore = createAsyncStorageUploadTaskStore(AsyncStorage);
```

### Important behavior

- Persist only non-terminal tasks.
- Do not mutate record shape before saving.
- Use one shared store per app install so restored tasks reattach consistently.

## 4) `fileAdapter` (managed uploads only)

### What it does

`fileAdapter` provides file metadata, content hashing, and byte upload operations.

This adapter is required when you configure the managed `sdk.uploads.*` path.

### When it is required

Required for task-based uploads. Without it, the SDK cannot inspect or transfer local files.

### Common mistake

Returning the wrong `etag` behavior for multipart uploads. If your adapter uploads a range, it must return the server `etag` for that part.

### Plain-English meaning

`fileAdapter` is the bridge between the SDK and your app’s file system/network layer.

In plain terms:

- the SDK knows the upload workflow,
- your app knows how to read local files and send bytes in React Native,
- `fileAdapter` connects those two.

### Signature

```ts
interface FileAdapter {
  getFileInfo(uri: string): Promise<FileInfo>;
  computeSha256(uri: string): Promise<string>;
  upload(params: {
    uri: string;
    uploadUrl: string;
    headers?: Record<string, string>;
    range?: { start: number; endExclusive: number };
    signal?: AbortSignal;
  }): Promise<UploadResult>;
}

interface FileInfo {
  size: number;
  mimeType: string;
  filename?: string;
  modifiedAtMs?: number;
}

interface UploadResult {
  byteSize: number;
  etag?: string;
}
```

### Field semantics

`getFileInfo(uri)` result:

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `size` | `number` | Yes | none | non-negative integer bytes | File size for upload-session creation and progress math. |
| `mimeType` | `string` | Yes | none | valid MIME string | Content type for session metadata and upload headers. |
| `filename` | `string` | No | none | non-empty string | Optional filename metadata. |
| `modifiedAtMs` | `number` | No | none | epoch milliseconds | Optional source timestamp used for safer resume checks. |

`computeSha256(uri)` result:

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| return value | `string` | Yes | none | lowercase 64-char SHA-256 hex | Content hash used by managed upload session creation and integrity checks. |

`upload(params)` input:

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `uri` | `string` | Yes | none | valid local URI | Upload source path. |
| `uploadUrl` | `string` | Yes | none | valid URL | Destination pre-signed URL. |
| `headers` | `Record<string, string>` | No | none | header map | Additional request headers required by destination. |
| `range.start` | `number` | Conditional | none | non-negative integer | Inclusive start byte for multipart upload. |
| `range.endExclusive` | `number` | Conditional | none | integer greater than `start` | Exclusive end byte for multipart upload. |
| `signal` | `AbortSignal` | No | none | abort signal | Used by pause/cancel flows to stop in-flight uploads. |

`upload(params)` result:

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `byteSize` | `number` | Yes | none | positive integer | Bytes uploaded in this operation. |
| `etag` | `string` | Conditional | none | non-empty string | Required for multipart part confirmation. |

### Required behavior

- `getFileInfo` must read real file metadata.
- `computeSha256` must hash file bytes, not the URI string.
- `upload` must upload only the requested byte range when `range` is provided.
- `upload` must throw on non-2xx responses.
- `upload` must return `etag` for multipart uploads.
- `upload` should honor `signal` so pause/cancel can stop in-flight requests promptly.

### When each method is called

| Method | Called by | Typical timing |
| - | - | - |
| `getFileInfo(uri)` | `sdk.uploads.putFile(...)` and `sdk.uploads.backupAsset(...)` | before session creation, to compute size, MIME, and filename |
| `computeSha256(uri)` | managed uploads | before session creation to support dedupe and integrity checks |
| `upload(params)` without `range` | single-part uploads | one full-file PUT |
| `upload(params)` with `range` | multipart uploads | one PUT per confirmed part |

### Range semantics (critical)

For multipart uploads, `range` uses:

- `start`: inclusive byte offset
- `endExclusive`: exclusive byte offset

Example with a 10-byte file and 4-byte part size:

| Part | Range |
| - | - |
| 1 | `start: 0`, `endExclusive: 4` |
| 2 | `start: 4`, `endExclusive: 8` |
| 3 | `start: 8`, `endExclusive: 10` |

If these bounds are wrong, part confirmation can fail or uploads can produce corrupted objects.

### `etag` requirement in practice

`etag` is optional in the type because not every upload path requires it, but multipart confirmation does.

| Flow | `etag` required |
| - | - |
| Single upload | No |
| Multipart upload | Yes (every part) |

### Header handling rules

- Always forward `headers` from SDK to the upload request unchanged.
- Do not drop content-type or signed-upload headers.
- If your networking stack normalizes header names, ensure values remain intact.

### Failure behavior rules

- Throw on any non-2xx upload response.
- Include status in thrown error message when possible.
- Do not return success payloads for failed HTTP uploads.

### Quick implementation checklist

- `getFileInfo` returns exact byte size from file content.
- `computeSha256` returns lowercase 64-char SHA-256 hex.
- `upload` honors byte ranges exactly.
- Multipart `upload` returns `etag` for every part.
- Failed uploads throw errors instead of returning partial success.

### Minimal implementation

```ts
export const fileAdapter = {
  async getFileInfo(uri: string) {
    const source = await fetch(uri);
    if (!source.ok) throw new Error(`Cannot open file: ${uri}`);
    const blob = await source.blob();
    return {
      size: blob.size,
      mimeType: blob.type || 'application/octet-stream',
      filename: uri.split('/').pop(),
    };
  },

  async computeSha256(uri: string) {
    throw new Error(`computeSha256 not implemented for ${uri}`);
  },

  async upload({
    uri,
    uploadUrl,
    headers,
    range,
    signal,
  }: {
    uri: string;
    uploadUrl: string;
    headers?: Record<string, string>;
    range?: { start: number; endExclusive: number };
    signal?: AbortSignal;
  }) {
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

    if (!response.ok) throw new Error(`Upload failed with status ${response.status}`);

    return {
      byteSize: body.size,
      etag: response.headers.get('etag') ?? undefined,
    };
  },
};
```

## 5) Verify adapter behavior

Use this checklist before shipping:

- `tokenStore.getTokens()` returns persisted values after app restart.
- `uploadTaskStore.loadAll()` returns active tasks after app restart.
- `deviceIdProvider.getDeviceId()` returns the same value across restarts.
- `fileAdapter.computeSha256()` returns lowercase 64-char hash output.
- Multipart upload returns part `etag` values.
- Non-2xx upload responses throw errors.
- `AbortSignal` stops in-flight uploads when pause/cancel is triggered.

## 6) Next steps

- Continue with [RN Methods: Managed Uploads](/docs/rn-methods-managed-uploads)
- Continue with [React Native SDK Methods Reference](/docs/rn-sdk-methods-reference)
- Use [Error Handling and Retry Playbook](/docs/error-retry-matrix) for app-level handling
- Use [React Native Troubleshooting](/docs/rn-troubleshooting) for integration diagnostics
