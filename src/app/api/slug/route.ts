import { NextResponse } from "next/server";
import { isSlugFree } from "@/lib/store";
import { normalizeSlug, slugProblem } from "@/lib/slug";

/** GET /api/slug?s=omar-salma → { slug, available, reason? }. Live check while the client types their link. */
export async function GET(req: Request) {
  const slug = normalizeSlug(new URL(req.url).searchParams.get("s") ?? "");
  const problem = slugProblem(slug);
  if (problem) return NextResponse.json({ slug, available: false, reason: problem });
  const available = await isSlugFree(slug);
  return NextResponse.json({ slug, available, reason: available ? undefined : "slug_taken" }, { headers: { "Cache-Control": "no-store" } });
}
