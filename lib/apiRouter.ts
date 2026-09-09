import {
  SESSION_COOKIE,
  createSessionToken,
  getAppPassword,
  isValidSessionToken,
} from "./auth.js";
import { readCookie, sessionCookieHeader } from "./cookies.js";
import { processJob } from "./processJob.js";
import { createQueuedJob } from "./startJob.js";

export type ApiResult = {
  status: number;
  body: unknown;
  setCookie?: string;
};

export async function routeApi(input: {
  method: string;
  pathname: string;
  cookieHeader: string | undefined;
  body: unknown;
  schedule: (work: Promise<unknown>) => void;
}): Promise<ApiResult> {
  const pathname = input.pathname.replace(/\/$/, "") || "/";

  if (pathname === "/api/session" && input.method === "GET") {
    const token = readCookie(input.cookieHeader, SESSION_COOKIE);
    return {
      status: 200,
      body: { authenticated: await isValidSessionToken(token) },
    };
  }

  if (pathname === "/api/login" && input.method === "POST") {
    const password =
      typeof input.body === "object" &&
      input.body !== null &&
      "password" in input.body &&
      typeof input.body.password === "string"
        ? input.body.password
        : "";

    if (password !== getAppPassword()) {
      return { status: 401, body: { error: "Invalid password" } };
    }

    const token = await createSessionToken();
    return {
      status: 200,
      body: { ok: true },
      setCookie: sessionCookieHeader(token, 60 * 60 * 24 * 7),
    };
  }

  if (pathname === "/api/logout" && input.method === "POST") {
    return {
      status: 200,
      body: { ok: true },
      setCookie: sessionCookieHeader("", 0),
    };
  }

  if (pathname === "/api/jobs/process" && input.method === "POST") {
    const token = readCookie(input.cookieHeader, SESSION_COOKIE);
    if (!(await isValidSessionToken(token))) {
      return { status: 401, body: { error: "Not authenticated" } };
    }

    const jobId = await createQueuedJob();
    input.schedule(processJob(jobId));
    return {
      status: 202,
      body: { jobId, runtime: "vercel-function" },
    };
  }

  return { status: 404, body: { error: "Not found" } };
}
