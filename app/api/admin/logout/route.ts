import { NextResponse } from "next/server";
import { adminCookie } from "../../../../lib/admin-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookie.name, "", { httpOnly: true, secure: adminCookie.secure, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
