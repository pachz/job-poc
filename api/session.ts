import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleVercelRequest } from "../lib/vercelHandler";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleVercelRequest(req, res);
}
