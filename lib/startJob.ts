import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { getWorkerSecret } from "./auth";
import { getConvexHttpClient } from "./convex";
import { PNG_SOURCES } from "./pngSources";

export async function createQueuedJob(): Promise<Id<"jobs">> {
  const convex = getConvexHttpClient();
  return await convex.mutation(api.jobs.create, {
    workerSecret: getWorkerSecret(),
    title: "Bundle 10 PNGs into PDF",
    imageCount: PNG_SOURCES.length,
  });
}
