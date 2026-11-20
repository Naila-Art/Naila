import "server-only";
import { promises as fs } from "fs";
import path from "path";

/**
 * Local-disk storage used in development when R2 isn't configured (see storage.ts).
 * Files live under data/uploads and are served by /media/[...path] with Range support.
 */
export const MEDIA_DIR = path.join(process.cwd(), "data", "uploads");

/** Resolves a /media path inside MEDIA_DIR, refusing anything that escapes it. */
export function mediaPath(parts: string[]): string | null {
  if (parts.some((p) => !/^[a-zA-Z0-9_.-]+$/.test(p) || p === "." || p === "..")) return null;
  const full = path.join(MEDIA_DIR, ...parts);
  return full.startsWith(MEDIA_DIR + path.sep) ? full : null;
}

export async function saveMedia(parts: string[], data: Uint8Array): Promise<string> {
  const full = mediaPath(parts);
  if (!full) throw new Error("bad media path");
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, data);
  return `/media/${parts.join("/")}`;
}

export async function deleteMediaDir(parts: string[]): Promise<void> {
  const full = mediaPath(parts);
  if (full) await fs.rm(full, { recursive: true, force: true });
}

/** Checks the file's first bytes, not just its name or the browser's claimed type. */
export function sniff(data: Uint8Array): "mp4" | "jpg" | "png" | "webp" | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...data.subarray(from, to));
  if (data.length > 12 && ascii(4, 8) === "ftyp") return "mp4";
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "jpg";
  if (data[0] === 0x89 && ascii(1, 4) === "PNG") return "png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

export const CONTENT_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
