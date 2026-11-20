import { createReadStream, promises as fs } from "fs";
import path from "path";
import { Readable } from "stream";
import { CONTENT_TYPES, mediaPath } from "@/lib/media";

type Ctx = { params: Promise<{ path: string[] }> };

/** Serves uploaded media. Supports Range requests — Safari on iPhone won't play a video without them. */
export async function GET(req: Request, { params }: Ctx) {
  const full = mediaPath((await params).path);
  if (!full) return new Response("Not found", { status: 404 });
  let size: number;
  try {
    const stat = await fs.stat(full);
    if (!stat.isFile()) throw new Error();
    size = stat.size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const type = CONTENT_TYPES[path.extname(full).slice(1)] ?? "application/octet-stream";
  const headers: Record<string, string> = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    // File names change with every upload (new template id), so caching hard is safe.
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  const range = req.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (range) {
    let start = range[1] ? Number(range[1]) : NaN;
    let end = range[2] ? Number(range[2]) : size - 1;
    if (Number.isNaN(start)) {
      // "bytes=-500" = the last 500 bytes
      start = Math.max(0, size - end);
      end = size - 1;
    }
    end = Math.min(end, size - 1);
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${size}` } });
    }
    const stream = Readable.toWeb(createReadStream(full, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }

  const stream = Readable.toWeb(createReadStream(full)) as ReadableStream;
  return new Response(stream, { headers: { ...headers, "Content-Length": String(size) } });
}
