import "server-only";
import { DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { promises as fs } from "fs";
import { deleteMediaDir, mediaPath, sniff } from "./media";

/**
 * File storage for template videos and posters.
 *
 * Production: Cloudflare R2. The browser uploads straight to R2 with a short-lived signed URL,
 * so files never pass through our server (Vercel caps request bodies at 4.5 MB). Guests load
 * them from R2's public domain (R2_PUBLIC_URL), which supports Range requests for iPhone video.
 *
 * Development without R2 settings: the same flow, but the "signed URL" points at a local
 * endpoint that writes to data/uploads, served by /media/[...path].
 */

export type UploadKind = "video" | "poster";

export const UPLOAD_RULES: Record<UploadKind, { types: Record<string, string>; maxBytes: number }> = {
  video: { types: { "video/mp4": "mp4" }, maxBytes: 20 * 1024 * 1024 },
  poster: { types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }, maxBytes: 3 * 1024 * 1024 },
};

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
  if (process.env.NODE_ENV === "production") {
    throw new Error("R2 is not configured: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL");
  }
  return null; // development: store on local disk
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

export function storageMode(): "r2" | "local" {
  return r2Config() ? "r2" : "local";
}

/** Object keys we hand out look like templates/tpl_0123456789/opening.mp4 — nothing else is accepted. */
export const TEMPLATE_ID = /^tpl_[0-9a-f]{10}$/;
const OBJECT_KEY = /^templates\/tpl_[0-9a-f]{10}\/(opening\.mp4|poster\.(jpg|png|webp))$/;

export function isTemplateObjectKey(key: string): boolean {
  return OBJECT_KEY.test(key);
}

export function objectKeyFor(templateId: string, kind: UploadKind, contentType: string): string {
  const ext = UPLOAD_RULES[kind].types[contentType];
  return `templates/${templateId}/${kind === "video" ? "opening.mp4" : `poster.${ext}`}`;
}

export function publicUrl(objectKey: string): string {
  const c = r2Config();
  return c ? `${c.publicUrl}/${objectKey}` : `/media/${objectKey}`;
}

/** Where the browser should PUT the file. */
export async function createUploadUrl(objectKey: string, contentType: string, adminKey: string): Promise<string> {
  const c = r2Config();
  if (!c) return `/api/admin/${adminKey}/uploads?key=${encodeURIComponent(objectKey)}`;
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
  let head: Uint8Array;
  let size: number;

  if (c) {
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
  if (kind === "video" ? type !== "mp4" : !type || type === "mp4") return "wrong_type";
  return "ok";
}

/** Deletes every file of a template. */
export async function deleteTemplateFiles(templateId: string): Promise<void> {
  if (!TEMPLATE_ID.test(templateId)) return;
  const c = r2Config();
  if (!c) return deleteMediaDir(["templates", templateId]);

  const listed = await s3(c).send(new ListObjectsV2Command({ Bucket: c.bucket, Prefix: `templates/${templateId}/` }));
  const objects = (listed.Contents ?? []).flatMap((o) => (o.Key ? [{ Key: o.Key }] : []));
  if (objects.length) await s3(c).send(new DeleteObjectsCommand({ Bucket: c.bucket, Delete: { Objects: objects } }));
}
