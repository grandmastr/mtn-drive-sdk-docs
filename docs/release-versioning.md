---
title: Release Channels and Versioning
---

## Package naming

- `@pipeopshq/mtn-rn-sdk`

## Channel

- Active release channel: `next`
- Publish target: npm (`registry.npmjs.org`)
- Access: public
- Current `next`: `1.0.0`
- Current `latest`: `0.2.0`

## Release flow

1. Add a changeset in `.changeset/*.md` for package changes.
2. Merge to `main`.
3. Release workflow publishes package versions tagged `next`.

## Consumer install examples

```bash
pnpm add @pipeopshq/mtn-rn-sdk@next
```

Use `@next` until `1.0.0` is promoted to the `latest` dist-tag.
