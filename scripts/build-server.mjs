import { build } from "esbuild";

await build({
  entryPoints: [
    "lib/apiRouter.ts",
    "lib/auth.ts",
    "lib/convex.ts",
    "lib/cookies.ts",
    "lib/pngSources.ts",
    "lib/processJob.ts",
    "lib/startJob.ts",
    "lib/vercelHandler.ts",
  ],
  outdir: "lib",
  format: "esm",
  platform: "node",
  target: "node20",
  logLevel: "info",
});
