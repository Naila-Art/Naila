/** Browser side of uploads: ask our API for a signed URL, then PUT the file straight to storage (R2). */

export class UploadError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

/** POSTs JSON and returns the parsed body, throwing UploadError with the API's error code on failure. */
export async function postJson<T>(url: string, body: unknown, method = "POST"): Promise<T> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new UploadError((data as { error?: string }).error ?? "failed");
  return data as T;
}

/** PUTs a file to its upload URL. XHR rather than fetch, for progress. */
export function putFile(url: string, file: Blob, contentType: string, onProgress?: (loaded: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    if (onProgress) xhr.upload.onprogress = (ev) => onProgress(ev.loaded);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new UploadError("storage_rejected")));
    // A missing CORS policy on the R2 bucket also lands here.
    xhr.onerror = () => reject(new UploadError("network"));
    xhr.send(file);
  });
}

/** Browsers sometimes leave file.type empty; fall back to the extension. */
export function contentTypeOf(file: File): string {
  if (file.type) return file.type === "audio/mp3" ? "audio/mpeg" : file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return (
    { mp4: "video/mp4", mp3: "audio/mpeg", m4a: "audio/mp4", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" }[
      ext ?? ""
    ] ?? ""
  );
}

export const UPLOAD_ERRORS: Record<string, string> = {
  upload_missing: "الملف ماوصلش. جرب تاني.",
  storage_rejected: "التخزين رفض الملف. جرب تاني.",
  network: "النت فصل أثناء الرفع. جرب تاني.",
  music_wrong_type: "الأغنية لازم تكون MP3 أو M4A.",
  music_too_large: "الأغنية أكبر من 12 ميجا.",
  proof_wrong_type: "صورة التحويل لازم تكون JPG أو PNG.",
  proof_too_large: "الصورة أكبر من 6 ميجا.",
  failed: "حصلت مشكلة. جرب تاني.",
};
