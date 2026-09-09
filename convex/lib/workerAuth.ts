export function assertWorkerSecret(workerSecret: string): void {
  const expected = process.env.JOB_WORKER_SECRET ?? "job-poc-worker";
  if (workerSecret !== expected) {
    throw new Error("Unauthorized worker");
  }
}
