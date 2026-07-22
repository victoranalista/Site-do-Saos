import { NextResponse } from "next/server";
import { isAdminSession } from "../../../../../lib/admin-auth";
import { deletePreset } from "../../../../../lib/preset-store";

export const runtime = "nodejs";

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  if (!await isAdminSession()) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const { id } = await context.params;
  await deletePreset(id);
  return NextResponse.json({ ok: true });
}
