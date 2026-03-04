---
title: Common Recipes
---

Copy-paste the most common MTN Drive SDK patterns without reading the full reference first.

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

Use this for the simplest “upload this file now” action.

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

Start one task per file, then wait for each task to finish or fail.

## Show progress in UI

```ts
const task = sdk.uploads.putFile({ uri: fileUri });

task.on('state_changed', (snapshot) => {
  const percent = Math.round(
    (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
  );
  setProgress(percent);
});
```

Use `snapshot.bytesTransferred` and `snapshot.totalBytes` to drive a progress bar.

## Pause and resume

```ts
const task = sdk.uploads.putFile({ uri: fileUri });

task.pause();
task.resume();
```

Pause stops future work. Resume continues the same task instead of starting over.

## Cancel an upload

```ts
const task = sdk.uploads.putFile({ uri: fileUri });

task.cancel();
```

Canceled tasks are intentionally finished. Do not auto-retry them unless the user asks again.

## Restore active tasks after app restart

```ts
await sdk.uploads.ready;

const activeTasks = sdk.uploads.getActiveTasks();
```

Always wait for `ready` before you reconnect UI to in-progress tasks.

## Use with a file picker

```ts
import DocumentPicker from 'react-native-document-picker';

const picked = await DocumentPicker.pickSingle();

const task = sdk.uploads.putFile({
  uri: picked.uri,
  filename: picked.name,
});
```

Pass the picker URI directly into `sdk.uploads.putFile(...)`.

## Start a photo backup

```ts
const task = sdk.uploads.backupAsset({
  uri: photoUri,
  capturedAt: new Date().toISOString(),
});
```

This is the default path for camera roll sync and media backup jobs.

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

Map SDK errors into short, user-facing text before you show them in your UI.
