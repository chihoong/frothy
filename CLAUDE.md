@AGENTS.md

## Deployment

- **Frontend** — hosted on Vercel at https://frothy.vercel.app (project: `frothy`)
- **Backend** — hosted on Railway (project: `frothy`)

> The Railway `worker` service auto-deploys from GitHub on push to `main`, scoped by watch
> patterns (`src/workers/**`, `src/analysis/**`, `src/lib/**`, `prisma/**`, `package.json`,
> `package-lock.json`, `tsconfig*.json`, `railway.toml`) — frontend-only changes don't redeploy it.
> Manual deploy if needed: `railway up -s worker`.
