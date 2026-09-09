import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { localApiPlugin } from "./vite-plugin-api";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  process.env.CONVEX_URL ??= env.CONVEX_URL;
  process.env.VITE_CONVEX_URL ??= env.VITE_CONVEX_URL;
  process.env.APP_PASSWORD ??= env.APP_PASSWORD;
  process.env.JOB_WORKER_SECRET ??= env.JOB_WORKER_SECRET;
  process.env.SESSION_SECRET ??= env.SESSION_SECRET;

  return {
    plugins: [react(), localApiPlugin()],
  };
});
