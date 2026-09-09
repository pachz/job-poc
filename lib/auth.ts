const SESSION_PAYLOAD = "job-poc-authenticated";
export const SESSION_COOKIE = "job_poc_session";

function getSessionSecret(): string {
  return process.env.SESSION_SECRET ?? "job-poc-session-secret";
}

export function getAppPassword(): string {
  return process.env.APP_PASSWORD ?? "123456";
}

export function getWorkerSecret(): string {
  return process.env.JOB_WORKER_SECRET ?? "job-poc-worker";
}

async function importKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function createSessionToken(): Promise<string> {
  const key = await importKey(getSessionSecret());
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(SESSION_PAYLOAD),
  );
  return toHex(new Uint8Array(signature));
}

export async function isValidSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) {
    return false;
  }
  const expected = await createSessionToken();
  return timingSafeEqual(token, expected);
}
