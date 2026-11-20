import { isAdmin } from "@/lib/admin";
import { bad } from "@/lib/api";
import { saveMedia } from "@/lib/media";
import { UPLOAD_RULES, isTemplateObjectKey, storageMode } from "@/lib/storage";

type Ctx = { params: Promise<{ key: string }> };

/** Development stand-in for R2: receives the PUT the browser would otherwise send to R2. */
export async function PUT(req: Request, ctx: Ctx) {
  const { key } = await ctx.params;
  if (!isAdmin(key) || storageMode() !== "local") return bad("not_found", 404);

  const objectKey = new URL(req.url).searchParams.get("key") ?? "";
  if (!isTemplateObjectKey(objectKey)) return bad("invalid_key");

  const data = new Uint8Array(await req.arrayBuffer());
  const max = objectKey.endsWith(".mp4") ? UPLOAD_RULES.video.maxBytes : UPLOAD_RULES.poster.maxBytes;
  if (data.length === 0 || data.length > max) return bad("invalid_size");

  await saveMedia(objectKey.split("/"), data);
  return new Response(null, { status: 200 });
}
