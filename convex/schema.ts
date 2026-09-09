import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  jobs: defineTable({
    title: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("downloading"),
      v.literal("bundling"),
      v.literal("uploading"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    progress: v.number(),
    message: v.string(),
    imageCount: v.number(),
    downloadedCount: v.number(),
    runtime: v.literal("vercel-function"),
    pdfStorageId: v.optional(v.id("_storage")),
    error: v.optional(v.string()),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    lastHeartbeatAt: v.optional(v.number()),
  })
    .index("by_created", ["createdAt"])
    .index("by_status", ["status"]),
});
