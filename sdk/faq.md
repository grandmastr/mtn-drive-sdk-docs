---
title: FAQ
---

Answers to the first questions most teams hit when they adopt the MTN Drive SDK.

## Why am I installing `@next`?

Because the newer managed-upload SDK is currently published on the `next` dist-tag. That is the version these docs are written for.

## Why is `latest` older?

`latest` still points to the older public release line. `next` points to the current task-based upload line.

## Why do I need `fileAdapter`?

The SDK knows the upload workflow, but your app still has to read local files, hash them, and upload bytes from the device. `fileAdapter` is how you provide that behavior.

## Why aren't uploads restoring after restart?

The most common causes are:

- you did not provide `uploads.taskStore`
- you read tasks before `await sdk.uploads.ready`
- you are creating multiple SDK instances

See [React Native Troubleshooting](/sdk/rn-troubleshooting) for the full checklist.

## Why does photo backup need `deviceIdProvider`?

Photo backup flows track work per device. The SDK needs one stable device ID so it can identify the same installation across runs.

## What page should I read first?

Start with:

1. [Overview](/sdk/overview)
2. [Install from npm](/sdk/install-npm)
3. [React Native Quickstart](/sdk/quickstart-react-native)

If you only need copy-paste code after that, go to [Common Recipes](/sdk/common-recipes).
