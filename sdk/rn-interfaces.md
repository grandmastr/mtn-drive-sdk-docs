---
title: React Native Required Interfaces
---

Implement the host-app adapters correctly so the SDK can manage auth, upload-task persistence, device identity, file metadata, hashing, and upload transport reliably.

## Prerequisites

- You completed [React Native Quickstart](/sdk/quickstart-react-native)
- You can persist small JSON payloads in app storage
- You can read files and upload bytes from local URIs

## Do I need this page?

Read this page when you are wiring the SDK into a real app and need to implement or debug the required adapters.

If you only want the shortest path to a working upload, follow [React Native Quickstart](/sdk/quickstart-react-native) first and come back here only if setup fails.

If any adapter term is unfamiliar, check [Glossary](/sdk/glossary) first.

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

### How to think about it

Think of it like a small notebook of unfinished uploads. The SDK writes down which tasks are still in progress, then reads that list back the next time the app starts.

### What this is not

It does **not** store the file bytes themselves. It stores task metadata, such as the task ID, current progress, and the information the SDK needs to reconnect to that task later.

### When it is required

Required for task-based uploads. If you skip it, `sdk.uploads` cannot run.

In practice, this is what makes “close the app and come back later” work. Without it, the upload UI has nothing to restore from.

### Common mistake

Reading tasks before `await sdk.uploads.ready`. The store may be correct, but restore has not finished yet.

Another common mistake is thinking “the upload is broken” when the real problem is only that the app forgot the task after restart because the store is missing or not persistent.

### Most common failure symptom

Uploads seem fine while the app is open, then disappear from the UI after restart because there is nothing persistent to restore.

### Debug first

- Wait for `await sdk.uploads.ready` before calling `getActiveTasks()`.
- Confirm `save(record)` writes real persistent data.
- Confirm `loadAll()` returns the same records after a full app restart.
- Keep one shared SDK instance so the same restored task set is reused across screens.

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

### How it works in practice

The normal task-store flow looks like this:

1. Your app starts an upload task.
2. The SDK saves the active task record through `save(record)`.
3. The app closes or is killed.
4. On next launch, `await sdk.uploads.ready` calls `loadAll()`.
5. The SDK rebuilds in-memory task objects from those saved records.
6. When a task reaches a terminal state, the SDK removes it with `remove(taskId)`.

If one of those steps fails, the upload may still work while the app stays open, but restore after restart becomes unreliable.

### Starter implementation

For React Native, use the built-in helper:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStorageUploadTaskStore } from '@pipeopshq/mtn-rn-sdk';

export const uploadTaskStore = createAsyncStorageUploadTaskStore(AsyncStorage);
```

This helper is the safest default because it already stores the exact task shape the SDK expects.

### Important behavior

- Persist only non-terminal tasks.
- Do not mutate record shape before saving.
- Use one shared store per app install so restored tasks reattach consistently.

### What breaks if this is wrong

- If `loadAll()` returns the wrong shape, restore can fail before your upload screen renders.
- If `save(record)` drops fields, pause/resume or restore can behave unpredictably.
- If `remove(taskId)` does nothing, finished tasks can keep reappearing after restart.
- If the store is not persistent, uploads may look fine until the app closes, then disappear from the UI on relaunch.

## 4) `fileAdapter` (managed uploads only)

### What it does

`fileAdapter` provides file metadata, content hashing, and byte upload operations.

This adapter is required when you configure the managed `sdk.uploads.*` path.

### How to think about it

Think of `fileAdapter` as the SDK's hands and eyes on the device:

- it looks at the local file and reports what it is
- it computes the file hash
- it sends the file bytes to the upload URL the SDK gives it

The SDK itself does not directly read from the device file system. That is why this adapter exists.

### When it is required

Required for task-based uploads. Without it, the SDK cannot inspect or transfer local files.

This is true for both:

- `sdk.uploads.putFile(...)`
- `sdk.uploads.backupAsset(...)`

### Common mistake

Returning the wrong `etag` behavior for multipart uploads. If your adapter uploads a range, it must return the server `etag` for that part.

Another common mistake is hashing the URI string instead of hashing the actual file contents. The SDK needs the hash of the file bytes, not the text of the path.

### Plain-English meaning

`fileAdapter` is the bridge between the SDK and your app’s file system/network layer.

In plain terms:

- the SDK knows the upload workflow,
- your app knows how to read local files and send bytes in React Native,
- `fileAdapter` connects those two.

### What this is not

It does **not** decide which folder to upload into, which user is signed in, or how retries work. Those decisions stay in the SDK. Its job is only local file access plus byte transfer.

### Most common failure symptom

Uploads start, but then fail before progress appears, during hashing, during a ranged upload, or at multipart confirmation because the adapter is returning incomplete data.

### Debug first

- Confirm the incoming `uri` can actually be opened on this device.
- Confirm `getFileInfo(...)` reports the real file size.
- Confirm `computeSha256(...)` hashes file bytes, not the path string.
- Confirm multipart `upload(...)` returns `etag`.

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

### How the three methods work together

The SDK usually uses `fileAdapter` in this order:

1. `getFileInfo(uri)` to learn the file size, MIME type, and filename
2. `computeSha256(uri)` to confirm the file content and support safe upload behavior
3. `upload(...)` one or more times to send the bytes

So if uploads are failing early, check `getFileInfo(...)` and `computeSha256(...)` first. If uploads fail later during progress, check `upload(...)`.

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

If you remove or alter these headers, the upload URL can reject the request even when the file and token are correct.

### Failure behavior rules

- Throw on any non-2xx upload response.
- Include status in thrown error message when possible.
- Do not return success payloads for failed HTTP uploads.

### What breaks if this is wrong

- If `getFileInfo(...)` returns the wrong size, progress can be wrong and upload-session setup can fail.
- If `computeSha256(...)` is wrong, the SDK can reject the file or treat it as changed.
- If `upload(...)` ignores `range`, multipart uploads can corrupt the final object.
- If `upload(...)` ignores `signal`, pause and cancel will feel broken.
- If `upload(...)` forgets the `etag`, multipart uploads can stop at part confirmation.

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

- Continue with [RN Methods: Managed Uploads](/sdk/rn-methods-managed-uploads)
- Continue with [React Native SDK Methods Reference](/sdk/rn-sdk-methods-reference)
- Use [Error Handling and Retry Playbook](/sdk/error-retry-matrix) for app-level handling
- Use [React Native Troubleshooting](/sdk/rn-troubleshooting) for integration diagnostics
