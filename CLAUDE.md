@AGENTS.md

## Deployment

- **Frontend** — hosted on Vercel at https://frothy.vercel.app (project: `frothy`)
- **Backend** — hosted on Railway (project: `frothy`)

> Note: the Railway `worker` service does **not** auto-deploy on push/merge to `main`.
> Deploy it manually with `railway up -s worker` (or trigger a redeploy in the Railway dashboard).
