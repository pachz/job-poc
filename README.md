# Job POC

Vite React app + Convex, with image processing on **Vercel Functions**. No Next.js.

## What it does

1. Login with the hardcoded password `123456`.
2. Start a job from the dashboard.
3. A Vercel Function (`api/jobs/process.ts`) downloads 10 hardcoded PNGs, bundles them into a PDF, and uploads the PDF.
4. Convex stores job status and the file. The UI updates live.

## Local development

```bash
npm run dev
```

That starts Convex and Vite together. Open [http://localhost:5173](http://localhost:5173) and sign in with `123456`.

Useful scripts:

- `npm run dev` — Convex + Vite
- `npm run dev:web` — Vite only (if Convex is already running)
- `npm run dev:convex` — Convex only
- `npm run convex:dashboard` — open the Convex dashboard
- `npm run convex:codegen` — regenerate Convex types
- `npm run convex:deploy` — production Convex deploy only

The same `/api/*` handlers run locally through a Vite plugin, so you can test the job without Next.js.

Make sure `.env.local` contains:

```
CONVEX_URL=<from npx convex dev>
VITE_CONVEX_URL=<same value>
```

## Deploy on Vercel

1. Import this GitHub repo in Vercel. Framework preset: **Vite**.
2. Deploy Convex production functions with `npx convex deploy` (production only).
3. Add Vercel environment variables:
   - `VITE_CONVEX_URL` — production Convex URL (used by the React app at build time)
   - `CONVEX_URL` — same production Convex URL (used by Vercel Functions at runtime)
   - `APP_PASSWORD` — `123456` unless you change it
   - `JOB_WORKER_SECRET` and `SESSION_SECRET` — optional; POC defaults exist
4. In the Convex dashboard, set the same `JOB_WORKER_SECRET` if you override it.
5. Recommended Vercel build command:

```bash
npx convex deploy --cmd 'npm run build'
```

with `CONVEX_DEPLOY_KEY` from the Convex dashboard.

The processing route is a Node.js Vercel Function with `maxDuration = 60`.
