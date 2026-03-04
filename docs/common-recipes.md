---
title: Common Recipes
---

Copy-paste the most common MTN Drive SDK patterns without reading the full reference first.

Read this page like this:

- read the recipe title
- copy the code
- check "When to use"
- check "What happens"

## Prerequisites

- You completed [React Native Quickstart](/docs/quickstart-react-native)
- You created one shared `sdk` client with `createRNClient(...)`

## Upload one file

```ts
const task = sdk.uploads.putFile({
  uri: fileUri,
  parentId: null,
});

task.on('state_changed', (snapshot) => {
  console.log(snapshot.state, snapshot.bytesTransferred, snapshot.totalBytes);
});
```

### When to use

Use this for the simplest “upload this file now” action, usually right after a document picker or an Upload button click.

### What happens

The SDK creates one task immediately, starts moving bytes, and emits progress snapshots until the task reaches `success`, `error`, or `canceled`.

## Upload multiple files

```ts
const tasks = fileUris.map((uri) =>
  sdk.uploads.putFile({
    uri,
    parentId: null,
  }),
);

await Promise.allSettled(tasks);
```

### When to use

Use this when the user picked several files and you want to start all uploads right away.

### What happens

The SDK creates one managed task per file. Each task runs independently, so one failure does not automatically stop the others.

## Show upload percentage

```ts
const task = sdk.uploads.putFile({ uri: fileUri });

task.on('state_changed', (snapshot) => {
  const percent = Math.round(
    (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
  );
  setProgress(percent);
});
```

### When to use

Use this when your UI needs a simple `0%` to `100%` progress indicator.

### What happens

Every `state_changed` event recalculates the current percentage from the latest snapshot, so your progress bar stays in sync with the task.

## Handle upload failure

```ts
const task = sdk.uploads.putFile({ uri: fileUri });

const unsubscribe = task.on(
  'state_changed',
  (snapshot) => {
    console.log(snapshot.state);
  },
  (error) => {
    if (error.code === 'storage/unauthenticated') {
      showLoginPrompt();
      return;
    }

    if (error.code === 'storage/retry-limit-exceeded') {
      showRetryButton();
      return;
    }

    showGenericError(error.message);
  },
  () => {
    showSuccessToast();
  },
);
```

### When to use

Use this when you want progress, failure handling, and success handling in one place.

### What happens

The task keeps emitting snapshots while it runs, then calls either the error callback once for a terminal failure or the complete callback once for a terminal success.

## Pause and resume

```ts
const task = sdk.uploads.putFile({ uri: fileUri });

task.pause();
task.resume();
```

### When to use

Use this for a pause button, a metered-network toggle, or any “stop for now, continue later” control.

### What happens

Pause stops new upload work from being scheduled. Resume continues the same task instead of creating a new one, so already-finished progress is preserved.

## Cancel an upload

```ts
const task = sdk.uploads.putFile({ uri: fileUri });

task.cancel();
```

### When to use

Use this for an explicit user cancel action when they no longer want the upload to continue.

### What happens

The task moves into a terminal `canceled` state. It is intentionally finished, so your app should not auto-retry it unless the user starts again.

## Restore active tasks after app restart

```ts
await sdk.uploads.ready;

const activeTasks = sdk.uploads.getActiveTasks();
```

### When to use

Use this during app startup before you rebuild an Active Uploads screen.

### What happens

`ready` waits for the SDK to load saved task records from `uploads.taskStore`. After that, `getActiveTasks()` returns the live in-memory task objects you can reconnect to.

## Use with a file picker

```ts
import DocumentPicker from 'react-native-document-picker';

const picked = await DocumentPicker.pickSingle();

const task = sdk.uploads.putFile({
  uri: picked.uri,
  filename: picked.name,
});
```

### When to use

Use this right after a document picker returns a local file URI.

### What happens

The picker gives your app the local URI. You pass that URI straight into `sdk.uploads.putFile(...)`, and the SDK handles the upload workflow from there.

## Start a photo backup

```ts
const task = sdk.uploads.backupAsset({
  uri: photoUri,
  capturedAt: new Date().toISOString(),
});
```

### When to use

Use this for camera roll sync, gallery backup, or any background media backup flow.

### What happens

The SDK starts a managed upload task for that media asset, using the same task lifecycle as normal file uploads.

## Create a folder, then upload into it

**Advanced but common**: this recipe uses the low-level `sdk.client.drive.*` module before the upload task API.

```ts
const folder = await sdk.client.drive.createFolder({
  name: 'Receipts',
  parentId: null,
});

const task = sdk.uploads.putFile({
  uri: fileUri,
  parentId: folder.id,
});
```

### When to use

Use this when uploads should go into a folder your app creates first, such as “Receipts” or “Invoices”.

### What happens

The low-level drive API creates the folder first. Then the task upload uses that new folder ID as the upload target.

## List the user's files

**Advanced but common**: this recipe uses the low-level `sdk.client.drive.*` module.

```ts
const page = await sdk.client.drive.listItems({ limit: 20 });

page.items.forEach((item) => {
  console.log(item.name, item.type);
});
```

### When to use

Use this when you need to render a file list or refresh a drive browser screen.

### What happens

The SDK fetches one page of drive items and returns them as `page.items`, which your app can map into rows, cards, or list items.

## Delete a file safely

**Advanced but common**: this recipe uses the low-level `sdk.client.drive.*` module.

```ts
await sdk.client.drive.deleteItem(itemId, { hard: 'false' });
```

### When to use

Use this when the user taps Delete and you want the safer trash-first behavior instead of permanent deletion.

### What happens

The item is moved into trash instead of being permanently destroyed, which gives your app a recovery path if the user changes their mind.

## Convert an SDK error into UI text

```ts
const toMessage = (error: unknown) => {
  if (!(error instanceof Error)) return 'Something went wrong. Try again.';

  const code = (error as Error & { code?: string }).code;

  switch (code) {
    case 'storage/unauthenticated':
      return 'Your session expired. Sign in again.';
    case 'storage/retry-limit-exceeded':
      return 'Upload failed after retrying. Try again.';
    case 'storage/source-file-missing':
      return 'The file is no longer on this device.';
    default:
      return error.message || 'Something went wrong. Try again.';
  }
};
```

### When to use

Use this before showing any raw SDK error directly to end users.

### What happens

Your app turns internal SDK error codes into short, user-facing messages that explain what the person should do next.
