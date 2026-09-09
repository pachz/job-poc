import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertWorkerSecret } from "./lib/workerAuth";

const jobStatus = v.union(
  v.literal("queued"),
  v.literal("downloading"),
  v.literal("bundling"),
  v.literal("uploading"),
  v.literal("completed"),
  v.literal("failed"),
);

const jobDoc = v.object({
  _id: v.id("jobs"),
  _creationTime: v.number(),
  title: v.string(),
  status: jobStatus,
  progress: v.number(),
  message: v.string(),
  imageCount: v.number(),
  downloadedCount: v.number(),
  runtime: v.literal("vercel-function"),
  pdfStorageId: v.optional(v.id("_storage")),
  pdfUrl: v.union(v.string(), v.null()),
  error: v.optional(v.string()),
  createdAt: v.number(),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
});

export const list = query({
  args: {},
  returns: v.array(jobDoc),
  handler: async (ctx) => {
    const jobs = await ctx.db.query("jobs").withIndex("by_created").order("desc").take(50);

    return await Promise.all(
      jobs.map(async (job) => ({
        ...job,
        pdfUrl: job.pdfStorageId ? await ctx.storage.getUrl(job.pdfStorageId) : null,
      })),
    );
  },
});

export const create = mutation({
  args: {
    workerSecret: v.string(),
    title: v.string(),
    imageCount: v.number(),
  },
  returns: v.id("jobs"),
  handler: async (ctx, args) => {
    assertWorkerSecret(args.workerSecret);
    return await ctx.db.insert("jobs", {
      title: args.title,
      status: "queued",
      progress: 0,
      message: "Queued for a Vercel Function",
      imageCount: args.imageCount,
      downloadedCount: 0,
      runtime: "vercel-function",
      createdAt: Date.now(),
    });
  },
});

export const markStarted = mutation({
  args: {
    workerSecret: v.string(),
    jobId: v.id("jobs"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertWorkerSecret(args.workerSecret);
    const job = await ctx.db.get("jobs", args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    await ctx.db.patch("jobs", args.jobId, {
      status: "downloading",
      progress: 5,
      message: "Vercel Function started",
      startedAt: Date.now(),
    });
    return null;
  },
});

export const markDownloading = mutation({
  args: {
    workerSecret: v.string(),
    jobId: v.id("jobs"),
    downloadedCount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertWorkerSecret(args.workerSecret);
    const job = await ctx.db.get("jobs", args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    const ratio = job.imageCount === 0 ? 0 : args.downloadedCount / job.imageCount;
    await ctx.db.patch("jobs", args.jobId, {
      status: "downloading",
      downloadedCount: args.downloadedCount,
      progress: Math.min(70, Math.round(10 + ratio * 60)),
      message: `Downloading PNG ${args.downloadedCount}/${job.imageCount}`,
    });
    return null;
  },
});

export const markBundling = mutation({
  args: {
    workerSecret: v.string(),
    jobId: v.id("jobs"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertWorkerSecret(args.workerSecret);
    const job = await ctx.db.get("jobs", args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    await ctx.db.patch("jobs", args.jobId, {
      status: "bundling",
      progress: 80,
      message: "Bundling PNGs into a PDF",
    });
    return null;
  },
});

export const markUploading = mutation({
  args: {
    workerSecret: v.string(),
    jobId: v.id("jobs"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertWorkerSecret(args.workerSecret);
    const job = await ctx.db.get("jobs", args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    await ctx.db.patch("jobs", args.jobId, {
      status: "uploading",
      progress: 90,
      message: "Uploading PDF to storage",
    });
    return null;
  },
});

export const generateUploadUrl = mutation({
  args: { workerSecret: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    assertWorkerSecret(args.workerSecret);
    return await ctx.storage.generateUploadUrl();
  },
});

export const complete = mutation({
  args: {
    workerSecret: v.string(),
    jobId: v.id("jobs"),
    pdfStorageId: v.id("_storage"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertWorkerSecret(args.workerSecret);
    const job = await ctx.db.get("jobs", args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    await ctx.db.patch("jobs", args.jobId, {
      status: "completed",
      progress: 100,
      message: "PDF ready",
      pdfStorageId: args.pdfStorageId,
      completedAt: Date.now(),
    });
    return null;
  },
});

export const fail = mutation({
  args: {
    workerSecret: v.string(),
    jobId: v.id("jobs"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertWorkerSecret(args.workerSecret);
    const job = await ctx.db.get("jobs", args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    await ctx.db.patch("jobs", args.jobId, {
      status: "failed",
      message: "Vercel Function failed",
      error: args.error,
      completedAt: Date.now(),
    });
    return null;
  },
});
