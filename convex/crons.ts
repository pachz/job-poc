import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("fail stale vercel jobs", { minutes: 1 }, internal.jobs.failStaleInternal);

export default crons;
