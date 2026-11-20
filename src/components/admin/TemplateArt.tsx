"use client";

import { useState } from "react";
import m from "../manage/manage.module.css";
import a from "./admin.module.css";
import { ART_SLOTS, type ArtSlot, type Template } from "@/lib/types";
import { UPLOAD_ERRORS, UploadError, postJson, putFile } from "@/lib/upload-client";
import Icon from "../Icon";

const SLOT_INFO: Record<ArtSlot, { label: string; hint: string }> = {
  top: { label: "فوق الأسامي", hint: "ورد أو قوس أو فريم بعرض الصفحة، بيظهر فوق الكلام أول ما الدعوة تتفتح." },
  corner: { label: "ركن الأقسام", hint: "وردة أو زخرفة صغيرة في ركن كل قسم (العد التنازلي، التهاني، المكان)، وبتتعكس في الركن اللي قصادها." },
  bottom: { label: "آخر الصفحة", hint: "رسمة بعرض الصفحة بتقفل بيها الدعوة تحت خالص." },
};

const TYPES = ["image/png", "image/webp", "image/jpeg"];
const MAX_MB = 3;

const ERRORS: Record<string, string> = {
  art_not_image: "الصورة لازم تكون PNG أو WebP أو JPG.",
  art_too_large: `الصورة أكبر من ${MAX_MB} ميجا.`,
  not_found: "التيمبليت ده اتمسح.",
  ...UPLOAD_ERRORS,
  network: "النت فصل أثناء الرفع. جرب تاني.",
  upload_failed: "حصلت مشكلة في الرفع. جرب تاني.",
};

/**
 * Optional artwork for an uploaded template, drawn in the same style as its video, so the page
 * after the opening looks like part of the same design. Each image is shown on the invitation right away.
 */
export default function TemplateArt({ template, onChange }: { template: Template; onChange: (t: Template) => void }) {
  const [busy, setBusy] = useState<ArtSlot | null>(null);
  const [error, setError] = useState("");

  async function upload(slot: ArtSlot, file: File | undefined) {
    setError("");
    if (!file) return;
    if (!TYPES.includes(file.type)) return setError(ERRORS.art_not_image);
    if (file.size > MAX_MB * 1024 * 1024) return setError(ERRORS.art_too_large);
    setBusy(slot);
    try {
      const up = await postJson<{ objectKey: string; uploadUrl: string }>(`/api/admin/templates/uploads`, {
        kind: "art",
        slot,
        templateId: template.id,
        contentType: file.type,
        size: file.size,
      });
      await putFile(up.uploadUrl, file, file.type);
      const res = await postJson<{ template: Template }>(`/api/admin/templates`, { id: template.id, slot, objectKey: up.objectKey }, "PATCH");
      onChange(res.template);
    } catch (err) {
      setError(err instanceof UploadError ? (ERRORS[err.code] ?? ERRORS.upload_failed) : ERRORS.upload_failed);
    } finally {
      setBusy(null);
    }
  }

  async function remove(slot: ArtSlot) {
    setError("");
    setBusy(slot);
    try {
      const res = await postJson<{ template: Template }>(`/api/admin/templates`, { id: template.id, slot, objectKey: null }, "PATCH");
      onChange(res.template);
    } catch (err) {
      setError(err instanceof UploadError ? (ERRORS[err.code] ?? ERRORS.upload_failed) : ERRORS.upload_failed);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={a.artPanel}>
      <p className={m.hint}>
        اختياري. ارسم أو اطلع من جوجل فلو صور بنفس ستايل الفيديو، والأحسن PNG بخلفية شفافة. كل صورة بتظهر في الدعوة على طول، وتقدر تشوفها من
        زرار المعاينة.
      </p>
      {ART_SLOTS.map((slot) => {
        const url = template.art?.[slot];
        return (
          <div key={slot} className={a.artSlot}>
            <div className={a.artThumb} style={{ background: template.theme.surface }}>
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element -- storage URLs, no optimisation needed
                <img src={url} alt="" />
              ) : (
                <Icon name="image" size={22} />
              )}
            </div>
            <div className={a.artInfo}>
              <strong>{SLOT_INFO[slot].label}</strong>
              <small className={m.hint}>{SLOT_INFO[slot].hint}</small>
              <div className={m.inlineActions}>
                <label className={m.secondary} aria-disabled={busy !== null}>
                  {busy === slot ? "بيترفع..." : url ? "غيّر الصورة" : "اختار صورة"}
                  <input
                    type="file"
                    accept={TYPES.join(",")}
                    hidden
                    disabled={busy !== null}
                    onChange={(e) => {
                      void upload(slot, e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                {url && (
                  <button type="button" className={m.linkBtn} disabled={busy !== null} onClick={() => void remove(slot)}>
                    شيل
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {error && (
        <p className={m.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
