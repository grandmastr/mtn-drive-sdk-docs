---
title: Release Channels and Versioning
---

This page is release metadata for package consumers and release operators. You do not need it to finish the Quickstart.

## Package naming

- `@pipeopshq/mtn-rn-sdk`

## Channel

- Active release channel: `next`
- Publish target: npm (`registry.npmjs.org`)
- Access: public
- Current `next`: `1.0.1`
- Current `latest`: `0.2.0`

## Release flow

1. Add a changeset in `.changeset/*.md` for package changes.
2. Merge to `main`.
3. Release workflow publishes package versions tagged `next`.

## Consumer install examples

```bash
pnpm add @pipeopshq/mtn-rn-sdk@next
```

Use `@next` while the task-based `1.0.1` line remains on the `next` dist-tag.
