import { bad } from "@/lib/api";
import { saveMedia } from "@/lib/media";
import { UPLOAD_RULES, kindOfKey, storageMode, verifyLocalUpload } from "@/lib/storage";

/** Development stand-in for R2: receives the PUT the browser would otherwise send to a signed R2 URL. */
export async function PUT(req: Request) {
  if (storageMode() !== "local") return bad("not_found", 404);
  const url = new URL(req.url);
  const key = url.searchParams.get("key") ?? "";
  if (!verifyLocalUpload(key, Number(url.searchParams.get("exp")), url.searchParams.get("sig") ?? "")) {
    return bad("forbidden", 403);
  }
  const data = new Uint8Array(await req.arrayBuffer());
  if (data.length === 0 || data.length > UPLOAD_RULES[kindOfKey(key)!].maxBytes) return bad("invalid_size");
  await saveMedia(key.split("/"), data);
  return new Response(null, { status: 200 });
}
