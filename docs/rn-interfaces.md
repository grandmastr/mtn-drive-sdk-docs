---
title: React Native Required Interfaces
---

Implement the required host-app adapters correctly so the SDK can manage auth, device identity, file metadata, hashing, and upload transport reliably.

## Prerequisites

- You completed [React Native Quickstart](/docs/quickstart-react-native)
- You can persist small JSON payloads in app storage
- You can read files and upload bytes from local URIs

## 1) `tokenStore`

Use `tokenStore` to let the SDK read, persist, and clear host-app auth tokens.

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

### Minimal implementation

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

## 2) `deviceIdProvider`

Use `deviceIdProvider` to return a stable per-install identifier.

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

### Minimal implementation

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

## 3) `fileAdapter`

Use `fileAdapter` to provide file metadata, content hashing, and byte upload operations.

### Plain-English meaning

`fileAdapter` is the small bridge between the SDK and your app's file system/network layer.

In plain terms:

- the SDK knows the backup/upload workflow,
- your app knows how to read local files and send bytes in React Native,
- `fileAdapter` connects those two.

You can think of it as three required capabilities the SDK asks your app to provide:

1. Tell me what this file is (`getFileInfo`).
2. Give me a stable content fingerprint (`computeSha256`).
3. Upload this file (or byte range) to this URL (`upload`).

Without `fileAdapter`, the SDK cannot read device files or perform RN-specific upload I/O.

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
  }): Promise<UploadResult>;
}

interface FileInfo {
  size: number;
  mimeType: string;
  filename?: string;
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

`computeSha256(uri)` result:

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| return value | `string` | Yes | none | lowercase 64-char SHA-256 hex | Content hash used by photo backup create/complete flow. |

`upload(params)` input:

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `uri` | `string` | Yes | none | valid local URI | Upload source path. |
| `uploadUrl` | `string` | Yes | none | valid URL | Destination pre-signed URL. |
| `headers` | `Record<string, string>` | No | none | header map | Additional request headers required by destination. |
| `range.start` | `number` | Conditional | none | non-negative integer | Inclusive start byte for multipart upload. |
| `range.endExclusive` | `number` | Conditional | none | integer greater than `start` | Exclusive end byte for multipart upload. |

`upload(params)` result:

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `byteSize` | `number` | Yes | none | positive integer | Bytes uploaded in this operation. |
| `etag` | `string` | Conditional | none | non-empty string | Required for multipart part confirmation. |

### Required behavior

- `getFileInfo` must read real file metadata.
- `computeSha256` must hash file bytes, not the URI string.
- `upload` must upload only requested byte range when `range` is provided.
- `upload` must throw on non-2xx responses.
- `upload` must return `etag` for multipart uploads.

### When each method is called

| Method | Called by | Typical timing |
| - | - | - |
| `getFileInfo(uri)` | upload and backup flows | before session creation, to compute `size`, `mimeType`, and optional filename |
| `computeSha256(uri)` | photo backup upload manager | before `photoBackup.createSession(...)` to support dedupe |
| `upload(params)` without `range` | single-part upload flows | one full-file PUT |
| `upload(params)` with `range` | multipart upload flows | one PUT per part/chunk |

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

If `etag` is missing for a multipart part, upload manager flow fails and should be treated as adapter implementation error.

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

  async upload({ uri, uploadUrl, headers, range }: {
    uri: string;
    uploadUrl: string;
    headers?: Record<string, string>;
    range?: { start: number; endExclusive: number };
  }) {
    const source = await fetch(uri);
    if (!source.ok) throw new Error(`Cannot read file: ${uri}`);

    const blob = await source.blob();
    const body = range ? blob.slice(range.start, range.endExclusive) : blob;

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers,
      body,
    });

    if (!response.ok) throw new Error(`Upload failed with status ${response.status}`);

    return {
      byteSize: body.size,
      etag: response.headers.get('etag') ?? undefined,
    };
  },
};
```

## 4) Verify adapter behavior

Use this checklist before shipping:

- `tokenStore.getTokens()` returns persisted values after app restart.
- `deviceIdProvider.getDeviceId()` returns the same value across restarts.
- `fileAdapter.computeSha256()` returns lowercase 64-char hash output.
- Multipart upload returns part `etag` values.
- Non-2xx upload responses throw errors.

## 5) Next steps

- Continue with [React Native SDK Methods Reference](/docs/rn-sdk-methods-reference)
- Use [Error Handling and Retry Playbook](/docs/error-retry-matrix) for app-level handling
- Use [React Native Troubleshooting](/docs/rn-troubleshooting) for integration diagnostics
