---
title: Quickstart (Core)
---

## Install

```bash
pnpm add @pipeopshq/mtn-core@next
```

## Create client

```ts
import { createClient } from '@pipeopshq/mtn-core';

const client = createClient({
  authProvider: {
    getAccessToken: async () => mtnAppAuth.getMtnAccessToken(),
    clearAuthState: async () => mtnAppAuth.clearSession(),
  },
});

const sessions = await client.sessions.list();
```

## Behavior summary

- `getAccessToken()` returns MTN token from the MTN app.
- SDK handles auth/session handshake internally before protected calls.
- On auth failure, SDK surfaces typed auth errors and clears state when configured.
