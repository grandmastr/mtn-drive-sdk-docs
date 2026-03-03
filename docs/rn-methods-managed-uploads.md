---
title: "RN Methods: Managed Uploads"
---

Start, monitor, pause, resume, cancel, and restore Firebase-style upload tasks through the default `sdk.uploads.*` API.

## Prerequisites

- SDK client created with `createRNClient(...)`
- `fileAdapter` configured in `createRNClient(...)`
- `uploads.taskStore` configured in `createRNClient(...)`
- `deviceIdProvider` configured only if you will call `sdk.uploads.backupAsset(...)`

`sdk.uploads` is the default high-level upload surface for new integrations. Use these methods instead of the legacy one-call upload manager or the low-level manual upload-session APIs unless you need custom protocol control.

## Module overview

```ts
interface ManagedUploads {
  readonly ready: Promise<void>;
  putFile(input: ManagedDriveUploadInput): UploadTask;
  backupAsset(input: ManagedBackupUploadInput): UploadTask;
  getActiveTasks(): UploadTask[];
  getTasks(options?: { includeTerminal?: boolean }): UploadTask[];
  getTask(taskId: string): UploadTask | null;
  clearFinishedTasks(): void;
}

interface UploadTask {
  readonly id: string;
  readonly snapshot: UploadTaskSnapshot;
  on(
    event: 'state_changed',
    next?: (snapshot: UploadTaskSnapshot) => void,
    error?: (error: UploadTaskError) => void,
    complete?: () => void,
  ): Unsubscribe;
  pause(): boolean;
  resume(): boolean;
  cancel(): boolean;
  then(
    onFulfilled?: (snapshot: UploadTaskSnapshot) => unknown,
    onRejected?: (error: UploadTaskError) => unknown,
  ): Promise<UploadTaskSnapshot>;
  catch(onRejected?: (error: UploadTaskError) => unknown): Promise<UploadTaskSnapshot>;
}
```

Call `await sdk.uploads.ready` during app bootstrap before you rely on restored task state.

### `uploads.putFile(input)`

#### What this method does

Starts a managed drive upload immediately and returns a live `UploadTask`.

#### When to call it

Call for user-initiated file uploads, attachment flows, and any drive upload that should support pause/resume/cancel and restore after app restart.

#### Signature

```ts
putFile(input: ManagedDriveUploadInput): UploadTask
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `uri` | `string` | Yes | none | valid local file URI | Source file path. |
| `parentId` | `string \| null` | No | `null` | drive item ID | Optional destination folder. |
| `filename` | `string` | No | adapter-derived | non-empty string | Optional filename override. |
| `mimeType` | `string` | No | adapter-derived | valid MIME string | Optional MIME override. |
| `onProgress` | `(snapshot: UploadTaskSnapshot) => void` | No | none | callback | Convenience progress listener. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| return value | `UploadTask` | Required | live task object | Task handle used for progress, control, and completion. |

#### Errors and handling

- `Error('managed uploads require fileAdapter...')`: client was configured incorrectly; add `fileAdapter` before calling this method.
- `Error('managed uploads require uploads.taskStore...')`: client was configured incorrectly; add `uploads.taskStore` before calling this method.
- `AuthExchangeError` or `AuthError`: clear host auth state and route to sign-in.
- `UploadTaskError` is surfaced through the returned task, not thrown synchronously, once the upload starts running.

#### Minimal example

```ts
const task = sdk.uploads.putFile({
  uri: localUri,
  parentId: folderId,
});

task.on('state_changed', (snapshot) => {
  console.log(snapshot.state, snapshot.bytesTransferred, snapshot.totalBytes);
});
```

### `uploads.backupAsset(input)`

#### What this method does

Starts a managed photo backup upload immediately and returns a live `UploadTask`.

#### When to call it

Call for camera-roll sync, manual backup actions, and photo/video backup jobs that should restore after restart.

#### Signature

```ts
backupAsset(input: ManagedBackupUploadInput): UploadTask
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `uri` | `string` | Yes | none | valid local file URI | Source media path. |
| `filename` | `string` | No | adapter-derived | non-empty string | Optional filename override. |
| `mimeType` | `string` | No | adapter-derived | valid MIME string | Optional MIME override. |
| `capturedAt` | `string` | No | none | ISO-8601 timestamp | Capture timestamp metadata. |
| `width` | `number` | No | none | positive integer | Width metadata. |
| `height` | `number` | No | none | positive integer | Height metadata. |
| `onProgress` | `(snapshot: UploadTaskSnapshot) => void` | No | none | callback | Convenience progress listener. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| return value | `UploadTask` | Required | live task object | Task handle used for progress, control, and completion. |

#### Errors and handling

- `Error('managed photo backup uploads require deviceIdProvider...')`: add `deviceIdProvider` before calling this method.
- `AuthExchangeError` or `AuthError`: clear host auth state and route to sign-in.
- `UploadTaskError` is surfaced through the returned task after the task starts.

#### Minimal example

```ts
const task = sdk.uploads.backupAsset({
  uri: localPhotoUri,
  capturedAt: new Date().toISOString(),
});

task.on('state_changed', (snapshot) => {
  console.log(snapshot.state, snapshot.bytesTransferred, snapshot.totalBytes);
});
```

### `uploads.getActiveTasks()`

#### What this method does

Returns all non-terminal managed upload tasks currently kept in memory.

#### When to call it

Call after app bootstrap, screen remount, or navigation changes to reattach UI to in-flight uploads.

#### Signature

```ts
getActiveTasks(): UploadTask[]
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `(none)` | - | - | - | - | This method does not take arguments. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| return value | `UploadTask[]` | Required | array | Active in-memory tasks only; terminal retained tasks are excluded. |

#### Errors and handling

- No transport call is made.
- On secondary read-only clients, returned tasks are read-only views and cannot control upload state.

#### Minimal example

```ts
await sdk.uploads.ready;
const activeTasks = sdk.uploads.getActiveTasks();
```

### `uploads.getTasks(options?)`

#### What this method does

Returns the current in-memory task list, optionally including recently retained terminal tasks.

#### When to call it

Call for upload dashboards, developer tooling, or debug screens that need both active and recently finished tasks.

#### Signature

```ts
getTasks(options?: { includeTerminal?: boolean }): UploadTask[]
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `options.includeTerminal` | `boolean` | No | `true` | boolean | Set `false` to return active tasks only. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| return value | `UploadTask[]` | Required | array | Active tasks plus retained finished tasks when enabled. |

#### Errors and handling

- No transport call is made.
- Returned ordering keeps active tasks first, followed by retained finished tasks in retention order.

#### Minimal example

```ts
const visibleTasks = sdk.uploads.getTasks({ includeTerminal: true });
```

### `uploads.getTask(taskId)`

#### What this method does

Looks up one task by ID from the in-memory task registry.

#### When to call it

Call when you persisted a task ID in local UI state and want to reconnect to that exact task after remount.

#### Signature

```ts
getTask(taskId: string): UploadTask | null
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `taskId` | `string` | Yes | none | non-empty task ID | Managed upload task identifier. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| return value | `UploadTask \| null` | Required | task or `null` | Matching task if still retained in memory; otherwise `null`. |

#### Errors and handling

- No transport call is made.
- `null` means the task is no longer in memory; call `sdk.uploads.getActiveTasks()` after `ready` to re-list currently restored tasks.

#### Minimal example

```ts
const task = sdk.uploads.getTask(savedTaskId);
if (!task) {
  console.log('task no longer retained in memory');
}
```

### `uploads.clearFinishedTasks()`

#### What this method does

Drops retained finished tasks from the in-memory task registry.

#### When to call it

Call after you no longer need recent success/error/canceled entries in upload-history UI.

#### Signature

```ts
clearFinishedTasks(): void
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `(none)` | - | - | - | - | This method does not take arguments. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| return value | `void` | Required | none | Clears retained terminal tasks from memory only. |

#### Errors and handling

- The owner client clears finished tasks in memory only; persisted active tasks are unaffected.
- Secondary read-only clients throw and must use the owner client for this mutation.

#### Minimal example

```ts
sdk.uploads.clearFinishedTasks();
```

### `uploadTask.on(event, next?, error?, complete?)`

#### What this method does

Subscribes to task state changes and returns an unsubscribe function.

#### When to call it

Call immediately after creating or restoring a task so UI stays synchronized with the latest snapshot.

#### Signature

```ts
on(
  event: 'state_changed',
  next?: (snapshot: UploadTaskSnapshot) => void,
  error?: (error: UploadTaskError) => void,
  complete?: () => void,
): Unsubscribe
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `event` | `'state_changed'` | Yes | none | exact string | The only supported task event. |
| `next` | `(snapshot: UploadTaskSnapshot) => void` | No | none | callback | Called on every emitted snapshot. |
| `error` | `(error: UploadTaskError) => void` | No | none | callback | Called once for terminal error or canceled state. |
| `complete` | `() => void` | No | none | callback | Called once for terminal success. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| return value | `Unsubscribe` | Required | function | Stop receiving task events. |

#### Errors and handling

- Callbacks are not replayed automatically on registration; read `task.snapshot` for current state before or after subscribing.
- The `error` callback receives `UploadTaskError` for terminal `error` and `canceled` outcomes.

#### Minimal example

```ts
const unsubscribe = task.on(
  'state_changed',
  (snapshot) => console.log(snapshot.state),
  (error) => console.error(error.code),
  () => console.log('upload complete'),
);
```

### `uploadTask.pause()`

#### What this method does

Requests a pause for the running task and returns whether the request changed task state.

#### When to call it

Call from UI pause controls or app-level network throttling flows.

#### Signature

```ts
pause(): boolean
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `(none)` | - | - | - | - | This method does not take arguments. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| return value | `boolean` | Required | `true` or `false` | `true` only when the task accepted the pause request. |

#### Errors and handling

- `false` means the task was already paused, terminal, or not controllable from the current client.
- Multipart uploads may still confirm already in-flight parts before the task emits `paused`.

#### Minimal example

```ts
const changed = task.pause();
console.log('pause requested', changed);
```

### `uploadTask.resume()`

#### What this method does

Requests resume for a paused task and returns whether the request changed task state.

#### When to call it

Call from UI resume controls after a pause, app restart, or reconnect flow.

#### Signature

```ts
resume(): boolean
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `(none)` | - | - | - | - | This method does not take arguments. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| return value | `boolean` | Required | `true` or `false` | `true` only when the task accepted the resume request. |

#### Errors and handling

- `false` means the task was already running, terminal, or not controllable from the current client.
- Resume reconciles server state first, then continues only the remaining confirmed work.

#### Minimal example

```ts
const changed = task.resume();
console.log('resume requested', changed);
```

### `uploadTask.cancel()`

#### What this method does

Requests cancellation for the task and returns whether the request changed task state.

#### When to call it

Call from explicit user cancel actions or app flows that should discard the current upload.

#### Signature

```ts
cancel(): boolean
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `(none)` | - | - | - | - | This method does not take arguments. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| return value | `boolean` | Required | `true` or `false` | `true` only when the task accepted the cancel request. |

#### Errors and handling

- `false` means the task was already terminal or not controllable from the current client.
- A canceled task rejects its thenable completion path with `storage/canceled`.

#### Minimal example

```ts
const changed = task.cancel();
console.log('cancel requested', changed);
```

### `uploadTask.then(onFulfilled?, onRejected?)`

#### What this method does

Awaits terminal task completion and resolves with the final success snapshot.

#### When to call it

Call when you need a promise-style completion path in addition to event subscriptions.

#### Signature

```ts
then(
  onFulfilled?: (snapshot: UploadTaskSnapshot) => unknown,
  onRejected?: (error: UploadTaskError) => unknown,
): Promise<UploadTaskSnapshot>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `onFulfilled` | `(snapshot: UploadTaskSnapshot) => unknown` | No | none | callback | Called on terminal success. |
| `onRejected` | `(error: UploadTaskError) => unknown` | No | none | callback | Called on terminal error or cancel. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| return value | `Promise<UploadTaskSnapshot>` | Required | promise | Resolves with final success snapshot or follows rejection path. |

#### Errors and handling

- Cancellation and task failures reject with `UploadTaskError`.
- If the task is already terminal, the promise resolves or rejects immediately.

#### Minimal example

```ts
await task.then((snapshot) => {
  console.log('final state', snapshot.state, snapshot.result);
});
```

### `uploadTask.catch(onRejected?)`

#### What this method does

Attaches a rejection handler to the task’s promise-like completion path.

#### When to call it

Call when you only need terminal error/cancel handling and you do not want to pass `onRejected` into `then(...)`.

#### Signature

```ts
catch(onRejected?: (error: UploadTaskError) => unknown): Promise<UploadTaskSnapshot>
```

#### Request fields

| Field | Type | Required | Default | Format/Constraints | Meaning |
| - | - | - | - | - | - |
| `onRejected` | `(error: UploadTaskError) => unknown` | No | none | callback | Called on terminal error or cancel. |

#### Response fields

| Field | Type | Required/Conditional | Format/Constraints | Meaning |
| - | - | - | - | - |
| return value | `Promise<UploadTaskSnapshot>` | Required | promise | Continues the task promise chain after adding rejection handling. |

#### Errors and handling

- Cancellation arrives here as `UploadTaskError` with code `storage/canceled`.
- If the task already failed or was canceled, the handler runs immediately.

#### Minimal example

```ts
await task.catch((error) => {
  console.error('upload failed', error.code, error.message);
});
```
