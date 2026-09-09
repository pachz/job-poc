import { api } from "../convex/_generated/api.js";
import type { Id } from "../convex/_generated/dataModel";
import { getWorkerSecret } from "./auth.js";
import { getConvexHttpClient } from "./convex.js";
import { PNG_SOURCES } from "./pngSources.js";

export async function createQueuedJob(): Promise<Id<"jobs">> {
  const convex = getConvexHttpClient();
  return await convex.mutation(api.jobs.create, {
    workerSecret: getWorkerSecret(),
    title: "Bundle 10 PNGs into PDF",
    imageCount: PNG_SOURCES.length,
  });
}
