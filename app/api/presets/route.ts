import { NextResponse } from "next/server";
import { initialPresets } from "../../../lib/presets";
import { listPresets } from "../../../lib/preset-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const featuredOnly = new URL(request.url).searchParams.get("featured") === "true";
  try {
    const presets = await listPresets({ publishedOnly: true, featuredOnly });
    return NextResponse.json(presets);
  } catch {
    const fallback = featuredOnly ? initialPresets.filter((preset) => preset.featuredOrder).sort((a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99)) : initialPresets;
    return NextResponse.json(fallback);
  }
}
