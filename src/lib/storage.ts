import "server-only";
import { DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { del as blobDel, issueSignedToken, list as blobList, presignUrl } from "@vercel/blob";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import { deleteMediaDir, mediaPath, sniff } from "./media";

/**
 * File storage for template videos and posters.
 *
 * Production: Cloudflare R2 when its R2_* variables are set, otherwise Vercel Blob
 * (BLOB_READ_WRITE_TOKEN). Both work the same way for the browser. The browser uploads straight to R2 with a short-lived signed URL,
 * so files never pass through our server (Vercel caps request bodies at 4.5 MB). Guests load
 * them from R2's public domain (R2_PUBLIC_URL), which supports Range requests for iPhone video.
 *
 * Development without R2 settings: the same flow, but the "signed URL" points at a local
 * endpoint that writes to data/uploads, served by /media/[...path].
 */

export type UploadKind = "video" | "poster" | "art" | "music" | "proof" | "reference";

const IMAGE_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export const UPLOAD_RULES: Record<UploadKind, { types: Record<string, string>; maxBytes: number }> = {
  video: { types: { "video/mp4": "mp4" }, maxBytes: 20 * 1024 * 1024 },
  poster: { types: IMAGE_TYPES, maxBytes: 3 * 1024 * 1024 },
  /** Template page artwork (PNG/WebP with a transparent background works best). */
  art: { types: IMAGE_TYPES, maxBytes: 3 * 1024 * 1024 },
  music: { types: { "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a" }, maxBytes: 12 * 1024 * 1024 },
  /** Instapay transfer screenshot. */
  proof: { types: IMAGE_TYPES, maxBytes: 6 * 1024 * 1024 },
  /** Package 3+: the client's photos, videos, songs and reference images. iPhone videos are .mov. */
  reference: {
    types: { ...IMAGE_TYPES, "video/mp4": "mp4", "video/quicktime": "mov", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a" },
    maxBytes: 50 * 1024 * 1024,
  },
};

/** Most files a client can attach to one order (package 3+ references). */
export const MAX_REFERENCES = 30;

/** Signed upload URLs stay valid this long. */
const UPLOAD_URL_TTL_SECONDS = 15 * 60;

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
}

function r2Config(): R2Config | null {
  const c = {
    accountId: process.env.R2_ACCOUNT_ID?.trim() ?? "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID?.trim() ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY?.trim() ?? "",
    bucket: process.env.R2_BUCKET?.trim() ?? "",
    publicUrl: (process.env.R2_PUBLIC_URL?.trim() ?? "").replace(/\/+$/, ""),
  };
  if (Object.values(c).every(Boolean)) return c;
  if (blobConfig()) return null; // Vercel Blob handles storage
  // ALLOW_LOCAL_STORAGE=1 lets a production build on this computer (e.g. a demo through a tunnel) store files locally.
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_STORAGE !== "1") {
    throw new Error("No file storage configured: set BLOB_READ_WRITE_TOKEN (Vercel Blob) or the R2_* variables");
  }
  return null; // development: store on local disk
}

interface BlobConfig {
  token: string;
  /** e.g. https://abc123.public.blob.vercel-storage.com */
  publicUrl: string;
}

/**
 * Vercel Blob (public store), used when R2 isn't configured. Uploads work like R2: the browser PUTs
 * straight to a short-lived presigned URL, so files never pass through our server.
 * Local development keeps using the disk unless NAILA_STORAGE=blob.
 */
function blobConfig(): BlobConfig | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return null;
  if (process.env.NODE_ENV !== "production" && process.env.NAILA_STORAGE !== "blob") return null;
  // Read-write tokens look like vercel_blob_rw_<storeId>_<secret>.
  const storeId = token.split("_")[3]?.toLowerCase();
  if (!storeId) return null;
  const publicUrl = (process.env.BLOB_PUBLIC_URL?.trim() || `https://${storeId}.public.blob.vercel-storage.com`).replace(/\/+$/, "");
  return { token, publicUrl };
}

let client: S3Client | null = null;
function s3(c: R2Config): S3Client {
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${c.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey },
  });
  return client;
}

export function storageMode(): "r2" | "blob" | "local" {
  return r2Config() ? "r2" : blobConfig() ? "blob" : "local";
}

/** Public base URL for stored files, by storage mode. */
function publicBase(): string {
  const c = r2Config();
  if (c) return c.publicUrl;
  const b = blobConfig();
  return b ? b.publicUrl : "/media";
}

export const TEMPLATE_ID = /^tpl_[0-9a-f]{10}$/;

/**
 * The only object keys we hand out. Anything else is refused.
 *   templates/tpl_x/opening.mp4 · templates/tpl_x/poster.jpg   (admin)
 *   music/trk_x-rand.mp3                                       (admin music library)
 *   events/evt_x/music-rand.mp3                                (client's own song)
 *   payments/ord_x/proof-rand.jpg                              (Instapay screenshot)
 * Files that can be replaced get a random suffix, because public URLs are cached forever.
 */
const OBJECT_KEYS: Record<UploadKind, RegExp> = {
  video: /^templates\/tpl_[0-9a-f]{10}\/opening\.mp4$/,
  poster: /^templates\/tpl_[0-9a-f]{10}\/poster\.(jpg|png|webp)$/,
  art: /^templates\/tpl_[0-9a-f]{10}\/art-(top|corner|bottom)-[0-9a-f]{8}\.(jpg|png|webp)$/,
  music: /^(music\/trk_[0-9a-f]{10}|events\/evt_[0-9a-z_]{1,40}\/music)-[0-9a-f]{8}\.(mp3|m4a)$/,
  proof: /^payments\/ord_[0-9a-f]{10}\/proof-[0-9a-f]{8}\.(jpg|png|webp)$/,
  reference: /^orders\/ord_[0-9a-f]{10}\/ref-[0-9a-f]{8}\.(jpg|png|webp|mp4|mov|mp3|m4a)$/,
};

export function kindOfKey(key: string): UploadKind | null {
  return (Object.keys(OBJECT_KEYS) as UploadKind[]).find((k) => OBJECT_KEYS[k].test(key)) ?? null;
}

export function isTemplateObjectKey(key: string): boolean {
  const kind = kindOfKey(key);
  return kind === "video" || kind === "poster" || kind === "art";
}

/** `owner` is the folder: "templates/tpl_x", "music/trk_x", "events/evt_x" or "payments/ord_x". */
export function objectKeyFor(owner: string, kind: UploadKind, contentType: string): string {
  const ext = UPLOAD_RULES[kind].types[contentType];
  const rand = randomBytes(4).toString("hex");
  switch (kind) {
    case "video":
      return `${owner}/opening.mp4`;
    case "poster":
      return `${owner}/poster.${ext}`;
    case "art":
      throw new Error("use artObjectKey for template artwork");
    case "music":
      return owner.startsWith("music/") ? `${owner}-${rand}.${ext}` : `${owner}/music-${rand}.${ext}`;
    case "proof":
      return `${owner}/proof-${rand}.${ext}`;
    case "reference":
      return `${owner}/ref-${rand}.${ext}`;
  }
}

/** Object key for one artwork slot of a template; a fresh name each time so browsers never show a stale copy. */
export function artObjectKey(templateId: string, slot: string, contentType: string): string {
  const ext = UPLOAD_RULES.art.types[contentType];
  return `templates/${templateId}/art-${slot}-${randomBytes(4).toString("hex")}.${ext}`;
}

/** Turns a public URL we issued back into its object key (null if it isn't one of ours). */
export function keyFromPublicUrl(url: string): string | null {
  const prefix = `${publicBase()}/`;
  if (!url.startsWith(prefix)) return null;
  const key = url.slice(prefix.length);
  return kindOfKey(key) ? key : null;
}

// Local (development) uploads are authorised with a signature, like an R2 signed URL.
// Derived (not random per module) because in development each route bundle gets its own copy of this module.
// Only used when R2 isn't configured, which production refuses.
const LOCAL_SECRET = createHmac("sha256", "local-uploads").update(process.env.ADMIN_TOKEN ?? "dev").digest();
const localSig = (key: string, exp: number) => createHmac("sha256", LOCAL_SECRET).update(`${key}|${exp}`).digest("hex");

export function verifyLocalUpload(key: string, exp: number, sig: string): boolean {
  if (!Number.isFinite(exp) || exp < Date.now() || !kindOfKey(key)) return false;
  const a = Buffer.from(localSig(key, exp));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function publicUrl(objectKey: string): string {
  return `${publicBase()}/${objectKey}`;
}

/** Where the browser should PUT the file. */
export async function createUploadUrl(objectKey: string, contentType: string): Promise<string> {
  const c = r2Config();
  const b = c ? null : blobConfig();
  if (b) {
    const kind = kindOfKey(objectKey);
    if (!kind) throw new Error(`not an upload key: ${objectKey}`);
    const validUntil = Date.now() + UPLOAD_URL_TTL_SECONDS * 1000;
    const limits = { allowedContentTypes: [contentType], maximumSizeInBytes: UPLOAD_RULES[kind].maxBytes };
    const signed = await issueSignedToken({ token: b.token, pathname: objectKey, operations: ["put"], validUntil, ...limits });
    const { presignedUrl } = await presignUrl(signed, {
      operation: "put",
      pathname: objectKey,
      access: "public",
      validUntil,
      ...limits,
      // Template videos/posters keep fixed names, so re-uploading must be allowed to replace them.
      allowOverwrite: true,
      addRandomSuffix: false,
      cacheControlMaxAge: 31536000,
    });
    return presignedUrl;
  }
  if (!c) {
    const exp = Date.now() + UPLOAD_URL_TTL_SECONDS * 1000;
    return `/api/uploads/local?key=${encodeURIComponent(objectKey)}&exp=${exp}&sig=${localSig(objectKey, exp)}`;
  }
  return getSignedUrl(
    s3(c),
    new PutObjectCommand({
      Bucket: c.bucket,
      Key: objectKey,
      ContentType: contentType,
      // Each upload gets a fresh template id, so the file at a URL never changes.
      CacheControl: "public, max-age=31536000, immutable",
    }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS },
  );
}

/**
 * After the browser says it uploaded: check the file exists, isn't too big, and really is
 * the right type (by its first bytes, not by what the browser claimed).
 */
export async function verifyUpload(objectKey: string, kind: UploadKind): Promise<"ok" | "missing" | "too_large" | "wrong_type"> {
  const c = r2Config();
  const b = c ? null : blobConfig();
  let head: Uint8Array;
  let size: number;

  if (b) {
    try {
      const res = await fetch(`${b.publicUrl}/${objectKey}`, { headers: { Range: "bytes=0-15" }, cache: "no-store" });
      if (!res.ok) return "missing";
      head = new Uint8Array(await res.arrayBuffer()).slice(0, 16);
      // Content-Range looks like "bytes 0-15/123456"
      size = Number(res.headers.get("content-range")?.split("/")[1] ?? res.headers.get("content-length") ?? 0);
    } catch {
      return "missing";
    }
  } else if (c) {
    try {
      const res = await s3(c).send(new GetObjectCommand({ Bucket: c.bucket, Key: objectKey, Range: "bytes=0-15" }));
      head = await res.Body!.transformToByteArray();
      // ContentRange looks like "bytes 0-15/123456"
      size = Number(res.ContentRange?.split("/")[1] ?? res.ContentLength ?? 0);
    } catch {
      return "missing";
    }
  } else {
    const full = mediaPath(objectKey.split("/"));
    if (!full) return "missing";
    try {
      const fh = await fs.open(full, "r");
      try {
        size = (await fh.stat()).size;
        head = new Uint8Array(16);
        await fh.read(head, 0, 16, 0);
      } finally {
        await fh.close();
      }
    } catch {
      return "missing";
    }
  }

  if (size > UPLOAD_RULES[kind].maxBytes) return "too_large";
  const type = sniff(head);
  const ok =
    kind === "video"
      ? type === "mp4"
      : kind === "music"
        ? type === "mp3" || type === "mp4"
        : kind === "reference"
          ? type === "mp4" || type === "mp3" || type === "jpg" || type === "png" || type === "webp"
          : type === "jpg" || type === "png" || type === "webp";
  return ok ? "ok" : "wrong_type";
}

/** Deletes one file (best effort: a leftover file is harmless). */
export async function deleteObject(objectKey: string): Promise<void> {
  if (!kindOfKey(objectKey)) return;
  const c = r2Config();
  const b = c ? null : blobConfig();
  try {
    if (b) {
      await blobDel(`${b.publicUrl}/${objectKey}`, { token: b.token });
      return;
    }
    if (!c) {
      const full = mediaPath(objectKey.split("/"));
      if (full) await fs.rm(full, { force: true });
      return;
    }
    await s3(c).send(new DeleteObjectsCommand({ Bucket: c.bucket, Delete: { Objects: [{ Key: objectKey }] } }));
  } catch {
    // ignore
  }
}

/** Deletes every file of a template. */
export async function deleteTemplateFiles(templateId: string): Promise<void> {
  if (!TEMPLATE_ID.test(templateId)) return;
  const c = r2Config();
  const b = c ? null : blobConfig();
  if (b) {
    const { blobs } = await blobList({ prefix: `templates/${templateId}/`, token: b.token });
    if (blobs.length) await blobDel(blobs.map((x) => x.url), { token: b.token });
    return;
  }
  if (!c) return deleteMediaDir(["templates", templateId]);

  const listed = await s3(c).send(new ListObjectsV2Command({ Bucket: c.bucket, Prefix: `templates/${templateId}/` }));
  const objects = (listed.Contents ?? []).flatMap((o) => (o.Key ? [{ Key: o.Key }] : []));
  if (objects.length) await s3(c).send(new DeleteObjectsCommand({ Bucket: c.bucket, Delete: { Objects: objects } }));
}
