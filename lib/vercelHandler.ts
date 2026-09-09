import type { VercelRequest, VercelResponse } from "@vercel/node";
import { waitUntil } from "@vercel/functions";
import { routeApi } from "./apiRouter";

function requestPath(req: VercelRequest): string {
  return new URL(req.url ?? "/", "http://localhost").pathname;
}

export async function handleVercelRequest(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const result = await routeApi({
    method: req.method ?? "GET",
    pathname: requestPath(req),
    cookieHeader: req.headers.cookie,
    body: req.body ?? null,
    schedule: (work) => {
      waitUntil(work);
    },
  });

  if (result.setCookie) {
    res.setHeader("Set-Cookie", result.setCookie);
  }
  res.status(result.status).json(result.body);
}
