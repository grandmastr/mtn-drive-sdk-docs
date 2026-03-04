---
title: Glossary
---

Quick definitions for the terms you will see throughout the MTN Drive SDK docs.

## Access token

A temporary credential your host app stores so the SDK can make requests for the current signed-in user.

## Session

The current signed-in state for a user or device. If the session expires, protected calls stop working until the user signs in again.

## Adapter

A small piece of code you provide so the SDK can use your app's storage, file access, and device identity.

## Upload task

A live object returned by `sdk.uploads.*` that lets you watch progress, pause, resume, cancel, and await completion.

## URI

A local file path string used by React Native, such as `file:///...` or `content://...`.

## Multipart upload

An upload where a large file is split into smaller parts so it can resume more safely and report progress as it goes.

## ETag

A server value returned after an uploaded part is accepted. The SDK uses it to confirm multipart uploads correctly.

## Cursor

A pagination token used to ask for the next page of results after the current page.

## Pre-signed URL

A temporary upload or download URL the SDK can use directly without asking you to manage storage credentials yourself.

## Retry

Trying the same request again after a temporary failure such as a network issue or rate limit.

## Restore after restart

The SDK's ability to reload active upload tasks after the app closes and starts again, using `uploads.taskStore`.
