---
title: Install from npm
---

Install the current React Native SDK release line and verify it is ready before you move on to setup.

## Before you install

This page assumes:

- you already have a React Native app
- Node.js is installed on your machine
- you already use `npm`, `yarn`, or `pnpm` in that app

For these docs, install `@next` because the task-based `1.0.1` line is currently published there.

## 1) Install

Pick the package manager your app already uses:

Using npm:

Use this if your app already has a `package-lock.json`.

```bash
npm install @pipeopshq/mtn-rn-sdk@next
```

Using yarn:

Use this if your app already has a `yarn.lock`.

```bash
yarn add @pipeopshq/mtn-rn-sdk@next
```

Using pnpm:

Use this if your app already has a `pnpm-lock.yaml`.

```bash
pnpm add @pipeopshq/mtn-rn-sdk@next
```

Use `@next` right now because the task-based `1.0.1` line is published there, while `latest` still points to `0.2.0`.

## 2) Add peer dependencies

The Quickstart examples also use AsyncStorage for token and upload-task persistence:

```bash
npm install @react-native-async-storage/async-storage
```

## 3) iOS native setup

If your app targets iOS, install CocoaPods after the package install:

```bash
cd ios && pod install && cd ..
```

## 4) Verify install

Check the installed package version:

```bash
npm view @pipeopshq/mtn-rn-sdk dist-tags --json
```

Expected result right now:

- `next`: `1.0.1`
- `latest`: `0.2.0`

You can also confirm the package resolves in your app:

```bash
pnpm why @pipeopshq/mtn-rn-sdk
```

## 5) Common install problems

### The install stopped partway through

1. Go back to your React Native app root.
2. Run the same install command again.
3. Wait for the package manager to finish without errors.
4. Re-run the verification step on this page.

### “Cannot find module `@pipeopshq/mtn-rn-sdk`”

1. Make sure you are in your React Native app root, not inside `ios/` or `android/`.
2. Re-run the install command from this page.
3. Re-run `pnpm why @pipeopshq/mtn-rn-sdk` (or your package manager equivalent).

### “Cannot find module `@react-native-async-storage/async-storage`”

1. Install the missing peer dependency with `npm install @react-native-async-storage/async-storage`.
2. Rebuild the app.
3. Continue with Quickstart only after the import resolves.

### iOS build still fails after install

1. Open your app root.
2. Run `cd ios && pod install && cd ..`.
3. Rebuild the iOS app.
4. If the failure still mentions old pods, clean the iOS build and run `pod install` again.

### I installed `latest` by mistake

1. Remove the old install with `npm uninstall @pipeopshq/mtn-rn-sdk`.
2. Install the correct release line with `npm install @pipeopshq/mtn-rn-sdk@next`.
3. Re-run the verification step and confirm `next` is `1.0.1`.

Installing only puts the packages into your app. The actual SDK wiring starts in [React Native Quickstart](/docs/quickstart-react-native).
