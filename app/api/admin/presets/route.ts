import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { isAdminSession } from "../../../../lib/admin-auth";
import { listPresets, savePreset } from "../../../../lib/preset-store";
import type { Preset } from "../../../../lib/presets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function text(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET() {
  if (!await isAdminSession()) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  return NextResponse.json(await listPresets());
}

export async function POST(request: Request) {
  if (!await isAdminSession()) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const form = await request.formData();
  const title = text(form, "title");
  const checkoutUrl = text(form, "checkoutUrl");
  if (!title || !checkoutUrl) return NextResponse.json({ error: "Título e link de compra são obrigatórios." }, { status: 400 });

  const id = text(form, "id") || crypto.randomUUID();
  let imageUrl = text(form, "existingImageUrl");
  const image = form.get("image");
  if (image instanceof File && image.size > 0) {
    if (!image.type.startsWith("image/") || image.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Envie uma imagem de até 8 MB." }, { status: 400 });
    const extension = image.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const blob = await put(`presets/${id}.${extension}`, image, { access: "public", addRandomSuffix: true });
    imageUrl = blob.url;
  }
  if (!imageUrl) return NextResponse.json({ error: "Escolha uma imagem para o preset." }, { status: 400 });

  const featuredRaw = Number(text(form, "featuredOrder"));
  const preset: Preset = {
    id,
    slug: text(form, "slug") || slugify(title),
    title,
    platform: text(form, "platform") as Preset["platform"],
    category: text(form, "category") as Preset["category"],
    description: text(form, "description"),
    imageUrl,
    checkoutUrl,
    installments: text(form, "installments"),
    cashPrice: text(form, "cashPrice"),
    badge: text(form, "badge") || "NOVO",
    featuredOrder: [1, 2, 3].includes(featuredRaw) ? featuredRaw : null,
    published: form.get("published") === "true",
  };
  await savePreset(preset);
  return NextResponse.json(preset);
}
