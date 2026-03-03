---
title: Install from npm
---

## 1) Install prerelease channel

```bash
pnpm add @pipeopshq/mtn-rn-sdk@next
```

`@pipeopshq/mtn-rn-sdk` is the only package React Native apps need to install directly.

Current channel state:

- `next` resolves to `1.0.0`
- `latest` still resolves to `0.2.0`

## 2) Confirm resolution

```bash
pnpm why @pipeopshq/mtn-rn-sdk
```

## Notes

- Use `@next` until `1.0.0` is promoted to `latest`.
- Packages are published to npm as public packages.
