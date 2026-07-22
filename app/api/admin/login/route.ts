import { NextResponse } from "next/server";
import { adminCookie, createAdminSession, validateAdminCredentials } from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  const body = await request.json() as { username?: string; password?: string };
  if (!body.username || !body.password || !await validateAdminCredentials(body.username, body.password)) {
    return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookie.name, await createAdminSession(body.username), { httpOnly: true, secure: adminCookie.secure, sameSite: "lax", path: "/", maxAge: adminCookie.maxAge });
  return response;
}
