import { SESSION_COOKIE } from "./auth.js";

export function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === name) {
      return rawValue.join("=");
    }
  }
  return undefined;
}

export function sessionCookieHeader(token: string, maxAge: number): string {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const pieces = [
    `${SESSION_COOKIE}=${token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (secure) {
    pieces.push("Secure");
  }
  return pieces.join("; ");
}
