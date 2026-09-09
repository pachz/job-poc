import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { routeApi } from "./lib/apiRouter";

function requestPath(req: IncomingMessage): string {
  return new URL(req.url ?? "/", "http://localhost").pathname;
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve(null);
        return;
      }
      const raw = Buffer.concat(chunks).toString("utf8");
      try {
        resolve(JSON.parse(raw) as unknown);
      } catch {
        resolve(raw);
      }
    });
    req.on("error", reject);
  });
}

async function handleLocalApi(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const result = await routeApi({
    method: req.method ?? "GET",
    pathname: requestPath(req),
    cookieHeader: req.headers.cookie,
    body: await readBody(req),
    schedule: (work) => {
      void work;
    },
  });

  if (result.setCookie) {
    res.setHeader("Set-Cookie", result.setCookie);
  }
  res.statusCode = result.status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(result.body));
}

export function localApiPlugin(): Plugin {
  return {
    name: "local-vercel-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/api/")) {
          next();
          return;
        }
        void handleLocalApi(req, res).catch(next);
      });
    },
  };
}
