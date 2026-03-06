# MTN Drive Documentation Site

Partner-facing documentation built with Docusaurus for both the MTN Drive SDK and API.

Project location:

- `/Users/thegrandmaster/vault/object-store/mtn-drive-sdk-docs`

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
pnpm check:docs
pnpm lint:md
```

- `pnpm dev`: local development server (Webpack/HMR)
- `pnpm start`: serves prebuilt `build/` output (production-like, no Webpack dev runtime)
- `pnpm check:docs`: runs SDK and API docs conformance checks

## Site sections

- SDK docs route base: `/sdk`
- API docs route base: `/api`

## PipeOps deployment

This docs app is deployed on PipeOps with Git auto-deploy on `main`.

Set these project settings in PipeOps:

- Framework: `ReactJS` (or equivalent static frontend option)
- Build command: `corepack enable && pnpm install --frozen-lockfile && pnpm build:ci`
- Artifact/output directory: `build`
- Start command: `pnpm start`
- Env var (if requested): `PORT=3000`

Fallback runtime commands (only if PipeOps does not preserve npm script env expansion):

- `pnpm exec docusaurus serve -h 0.0.0.0 -p $PORT`
- `npx serve -s build -l $PORT`

Flow:

1. Create/link PipeOps project to this docs project repository/folder on branch `main`.
2. Run one manual deploy from the PipeOps dashboard.
3. Subsequent pushes to `main` auto-deploy.

## Rollback note

Netlify remains available as last-known-good fallback for one release cycle, but deployment CI no longer targets Netlify.
