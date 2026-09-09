import { ConvexHttpClient } from "convex/browser";

export function getConvexHttpClient(): ConvexHttpClient {
  const url = process.env.CONVEX_URL ?? process.env.VITE_CONVEX_URL;
  if (!url) {
    throw new Error("CONVEX_URL is not set");
  }
  return new ConvexHttpClient(url);
}
