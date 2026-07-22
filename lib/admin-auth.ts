import { cookies } from "next/headers";

const COOKIE_NAME = "mateus_saos_admin";
const SESSION_SECONDS = 60 * 60 * 12;

function credentials() {
  return {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
    secret: process.env.ADMIN_SESSION_SECRET,
  };
}

async function signature(payload: string) {
  const secret = credentials().secret;
  if (!secret) return "";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function validateAdminCredentials(username: string, password: string) {
  const runtime = credentials();
  return Boolean(runtime.username && runtime.password && username === runtime.username && password === runtime.password);
}

export async function createAdminSession(username: string) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `${username}:${expires}`;
  return `${payload}:${await signature(payload)}`;
}

export async function isAdminSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return false;
  const parts = token.split(":");
  if (parts.length !== 3) return false;
  const [username, expiresRaw, suppliedSignature] = parts;
  const expires = Number(expiresRaw);
  const runtime = credentials();
  if (!runtime.username || username !== runtime.username || !Number.isFinite(expires) || expires < Date.now() / 1000) return false;
  return suppliedSignature === await signature(`${username}:${expiresRaw}`);
}

export const adminCookie = {
  name: COOKIE_NAME,
  maxAge: SESSION_SECONDS,
  secure: process.env.NODE_ENV === "production",
};
