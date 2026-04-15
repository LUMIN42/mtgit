# mtgit monorepo skeleton

This repo uses an `apps/*` layout with npm workspaces and a shared TypeScript base config:

- `apps/frontend`: existing React + Vite app
- `apps/api`: new Express + tRPC API skeleton
- `tsconfig.base.json`: shared TypeScript settings for both apps

## Quick start

```bash
npm install
npm run dev
```

Use npm only in this repo; `package-lock.json` at the root is the canonical lockfile.

## API environment

Create `apps/api/.env` from `apps/api/.env.example` and set:

```bash
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/<database>?retryWrites=true&w=majority
```

By default, this starts:

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`
- API health: `GET http://localhost:3001/health`
- tRPC endpoint: `http://localhost:3001/trpc`

## Useful scripts

```bash
npm run dev:frontend
npm run dev:api
npm run typecheck
npm run build
```

