---
title: Concepts
---

Understand the big ideas behind the MTN Drive SDK before you dive into the reference pages.

## Prerequisites

- You know this SDK is for React Native apps
- You want the high-level picture before following the code examples

## Auth at a high level

Your host app signs the user in first, then stores the MTN access token in `tokenStore`.

The SDK reads that token when it needs to make protected requests. If the token is missing or no longer valid, protected calls fail and your app should send the user back to sign-in.

## Why adapters exist

The SDK handles the MTN Drive workflow, but your app still controls local device behavior.

Adapters are the bridge between the SDK and your app:

- `tokenStore` keeps login state
- `fileAdapter` reads files, hashes them, and uploads bytes
- `uploads.taskStore` restores active uploads after restart
- `deviceIdProvider` identifies one device for photo backup flows

See [React Native Required Interfaces](/docs/rn-interfaces) for the full contracts.

## How upload tasks behave

The default upload API returns a task object, not a one-shot promise.

That gives you:

- progress updates while the upload is running
- pause, resume, and cancel controls
- restore after app restart

The common task states are:

- `running`: the upload is actively making progress
- `paused`: the upload is waiting until you resume it
- `success`: the upload finished
- `error`: the upload stopped because something failed
- `canceled`: the user intentionally stopped the upload

## Why `sdk.uploads` is the default path

For most apps, `sdk.uploads` is the right starting point because it wraps the upload workflow into one consistent task interface.

Use it when you want:

- file upload
- photo backup
- progress updates
- pause/resume/cancel
- restored uploads after restart

See [RN Methods: Managed Uploads](/docs/rn-methods-managed-uploads) for the full task behavior.

## When to use `sdk.client.*`

Use low-level `sdk.client.*` modules only when you need custom control that the task API does not give you.

Examples:

- custom drive browsing
- low-level share management
- manual photo sync orchestration
- storage dashboards

If you are new to the SDK, start with `sdk.uploads` and only drop lower when you know exactly why.
