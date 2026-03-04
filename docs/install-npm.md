---
title: Install from npm
---

Install the current React Native SDK release line and verify it is ready before you move on to setup.

## 1) Install

Pick the package manager your app already uses:

Using npm:

```bash
npm install @pipeopshq/mtn-rn-sdk@next
```

Using yarn:

```bash
yarn add @pipeopshq/mtn-rn-sdk@next
```

Using pnpm:

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

### “Cannot find module `@pipeopshq/mtn-rn-sdk`”

The install did not complete in the app workspace. Re-run the install command from your React Native app root.

### “Cannot find module `@react-native-async-storage/async-storage`”

The SDK installed, but the Quickstart dependency did not. Install AsyncStorage before following the Quickstart.

### iOS build still fails after install

Run `pod install` inside the `ios` directory, then rebuild the app.

### I installed `latest` by mistake

Replace it with `@next`, because the beginner docs assume the current task-based `1.0.1` line.
