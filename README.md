# MTN Drive SDK Docs Site

Partner-facing documentation built with Docusaurus.

Project location:

- `/Users/thegrandmaster/vault/object-store/mtn-drive-sdk-docs`

## Commands

```bash
pnpm install
pnpm start
pnpm build
pnpm lint:md
```

## PipeOps deployment

This docs app is deployed on PipeOps with Git auto-deploy on `main`.

Set these project settings in PipeOps:

- Framework: `ReactJS` (or equivalent static frontend option)
- Build command: `corepack enable && pnpm install --frozen-lockfile && pnpm build:ci`
- Artifact/output directory: `build`
- Start command (if requested): `npx serve -s build -l $PORT`
- Env var (if requested): `PORT=3000`

Flow:

1. Create/link PipeOps project to this docs project repository/folder on branch `main`.
2. Run one manual deploy from the PipeOps dashboard.
3. Subsequent pushes to `main` auto-deploy.

## Rollback note

Netlify remains available as last-known-good fallback for one release cycle, but deployment CI no longer targets Netlify.
