"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import m from "../manage/manage.module.css";
import a from "./admin.module.css";
import { CATEGORY_LABELS, type Category, type Template } from "@/lib/types";
import { UPLOAD_ERRORS, UploadError, postJson, putFile } from "@/lib/upload-client";

interface Props {
  adminKey: string;
  initialTemplates: Template[];
  initialUsage: Record<string, number>;
}

/** Launch target agreed with Ziad: 6 templates per category, 18 in total. */
const TARGET_PER_CATEGORY = 6;
const MAX_VIDEO_MB = 20;
const IDEAL_VIDEO_MB = 4;

const COLOUR_FIELDS: { key: keyof Template["theme"]; label: string; hint: string }[] = [
  { key: "background", label: "الخلفية", hint: "حوالين الفيديو" },
  { key: "surface", label: "الورقة", hint: "لون الجواب اللي بيتفتح" },
  { key: "text", label: "الكتابة", hint: "" },
  { key: "accent", label: "اللون المميز", hint: "الزراير والخطوط" },
  { key: "seal", label: "الختم", hint: "" },
];

const DEFAULT_THEME: Template["theme"] = {
  background: "#f4ede3",
  surface: "#fffaf3",
  text: "#3b2a22",
  accent: "#a8834f",
  seal: "#7a1f2b",
};

const ERRORS: Record<string, string> = {
  name_required: "اكتب اسم التيمبليت.",
  invalid_category: "اختار النوع.",
  invalid_colour: "في لون مش مظبوط.",
  video_required: "ارفع الفيديو.",
  video_too_large: `الفيديو أكبر من ${MAX_VIDEO_MB} ميجا.`,
  video_not_mp4: "الفيديو لازم يكون MP4.",
  poster_too_large: "الصورة أكبر من 3 ميجا.",
  poster_not_image: "الصورة لازم تكون JPG أو PNG أو WebP.",
  not_found: "اللينك ده مش شغال.",
  ...UPLOAD_ERRORS,
  network: "النت فصل أثناء الرفع، أو إعدادات CORS على R2 ناقصة. جرب تاني.",
  upload_failed: "حصلت مشكلة في الرفع. جرب تاني.",
};

const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);

const POSTER_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface Slot {
  templateId: string;
  objectKey: string;
  uploadUrl: string;
}

const requestSlot = (
  adminKey: string,
  body: { kind: "video" | "poster"; contentType: string; size: number; templateId?: string },
) => postJson<Slot>(`/api/admin/${adminKey}/templates/uploads`, body);

/** Grabs a frame near the start of the video as a JPEG, used as the poster when none is uploaded. */
function captureFrame(video: HTMLVideoElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (!video.videoWidth) return resolve(null);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve(null);
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85);
  });
}

export default function TemplatesAdmin({ adminKey, initialTemplates, initialUsage }: Props) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [usage] = useState(initialUsage);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [toast, setToast] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("wedding");
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [video, setVideo] = useState<File | null>(null);
  const [poster, setPoster] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");

  const videoUrl = useMemo(() => (video ? URL.createObjectURL(video) : ""), [video]);
  const posterUrl = useMemo(() => (poster ? URL.createObjectURL(poster) : ""), [poster]);
  useEffect(() => () => void (videoUrl && URL.revokeObjectURL(videoUrl)), [videoUrl]);
  useEffect(() => () => void (posterUrl && URL.revokeObjectURL(posterUrl)), [posterUrl]);
  const previewRef = useRef<HTMLVideoElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  const uploaded = templates.filter((t) => t.createdAt);
  const counts = useMemo(() => {
    const c: Record<Category, number> = { wedding: 0, engagement: 0, katb_kitab: 0 };
    for (const t of uploaded) c[t.category]++;
    return c;
  }, [uploaded]);
  const shown = filter === "all" ? templates : templates.filter((t) => t.category === filter);

  function pickVideo(file: File | undefined) {
    setError("");
    if (!file) return setVideo(null);
    if (!/\.mp4$/i.test(file.name) && file.type !== "video/mp4") {
      setVideo(null);
      return setError("الفيديو لازم يكون MP4. لو جوجل فلو طلّعه بصيغة تانية، حوّله الأول.");
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setVideo(null);
      return setError(ERRORS.video_too_large);
    }
    setVideo(file);
    if (!name) setName(file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
  }

  function upload(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError(ERRORS.name_required);
    if (!video) return setError(ERRORS.video_required);

    void (async () => {
      try {
        setProgress(0);
        let posterBlob: Blob | null = poster;
        if (!posterBlob && previewRef.current) posterBlob = await captureFrame(previewRef.current);
        if (posterBlob && !POSTER_TYPES.includes(posterBlob.type)) throw new UploadError("poster_not_image");

        // Progress covers both files, weighted by size.
        const total = video.size + (posterBlob?.size ?? 0);
        let done = 0;
        const track = (loaded: number) => setProgress(Math.min(99, Math.round(((done + loaded) / total) * 100)));

        // 1. Video: ask for an upload slot (this also creates the template id), then send it straight to storage.
        const slot = await requestSlot(adminKey, { kind: "video", contentType: "video/mp4", size: video.size });
        await putFile(slot.uploadUrl, video, "video/mp4", track);
        done += video.size;

        // 2. Poster, same template id.
        let posterKey: string | undefined;
        if (posterBlob) {
          const p = await requestSlot(adminKey, {
            kind: "poster",
            contentType: posterBlob.type,
            size: posterBlob.size,
            templateId: slot.templateId,
          });
          await putFile(p.uploadUrl, posterBlob, posterBlob.type, track);
          posterKey = p.objectKey;
        }

        // 3. Save the template; the server checks the files before accepting it.
        setProgress(100);
        const body = await postJson<{ template: Template }>(`/api/admin/${adminKey}/templates`, {
          templateId: slot.templateId,
          name: name.trim(),
          category,
          theme,
          videoKey: slot.objectKey,
          posterKey,
        });
        setTemplates((list) => [body.template, ...list]);
        setToast("التيمبليت اترفع");
        setName("");
        setVideo(null);
        setPoster(null);
        formRef.current?.reset();
      } catch (err) {
        setError(err instanceof UploadError ? (ERRORS[err.code] ?? ERRORS.upload_failed) : ERRORS.upload_failed);
      } finally {
        setProgress(null);
      }
    })();
  }

  async function remove(t: Template) {
    const used = usage[t.id] ?? 0;
    const warning = used
      ? `في ${used} دعوة شغالة بالتيمبليت ده، وهيرجعوا للظرف العادي. تمسحه؟`
      : `تمسح "${t.name}"؟`;
    if (!confirm(warning)) return;
    const res = await fetch(`/api/admin/${adminKey}/templates?id=${encodeURIComponent(t.id)}`, { method: "DELETE" });
    if (res.ok) {
      setTemplates((list) => list.filter((x) => x.id !== t.id));
      setToast("اتمسح");
    } else setToast("ماعرفناش نمسحه");
  }

  return (
    <main className={m.page} dir="rtl" lang="ar">
      <header className={m.header}>
        <div className={m.kicker}>داشبورد الإدارة</div>
        <h1>التيمبليتس</h1>
        <div className={a.targets}>
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
            <div key={c} className={a.target} data-done={counts[c] >= TARGET_PER_CATEGORY}>
              <span>{CATEGORY_LABELS[c]}</span>
              <strong>
                {counts[c]} / {TARGET_PER_CATEGORY}
              </strong>
            </div>
          ))}
        </div>
      </header>

      <section className={m.panel}>
        <div className={m.panelHead}>
          <h2>رفع تيمبليت جديد</h2>
        </div>
        <p className={m.hint}>
          فيديو جوجل فلو لازم يكون من غير أي كتابة، لأن الأسامي والتاريخ بيتكتبوا فوقه. MP4، طولي (9:16)، والأفضل
          يكون 1–2 ميجا.
        </p>

        <form ref={formRef} className={a.form} onSubmit={upload}>
          <label className={m.field}>
            <span>الفيديو (MP4)</span>
            <input
              type="file"
              accept="video/mp4,.mp4"
              onChange={(e) => pickVideo(e.target.files?.[0])}
              disabled={progress !== null}
            />
          </label>

          {video && (
            <div className={a.previewRow}>
              <div className={a.phone} style={{ background: theme.background }}>
                <video
                  ref={previewRef}
                  src={videoUrl}
                  poster={posterUrl || undefined}
                  muted
                  playsInline
                  controls
                  preload="auto"
                  onLoadedData={(e) => {
                    // Move just past the first frame so the auto-captured poster isn't a black frame.
                    if (e.currentTarget.currentTime === 0) e.currentTarget.currentTime = 0.1;
                  }}
                />
              </div>
              <div className={a.previewInfo}>
                <div>
                  {mb(video.size)} ميجا
                  {video.size > IDEAL_VIDEO_MB * 1024 * 1024 && (
                    <span className={m.warn}> كبير شوية، هيتأخر يفتح على النت الضعيف. الأفضل تضغطه لـ 1–2 ميجا.</span>
                  )}
                </div>
                <label className={m.field}>
                  <span>صورة البداية (اختياري)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setPoster(e.target.files?.[0] ?? null)}
                    disabled={progress !== null}
                  />
                </label>
                {!poster && <span className={m.hint}>لو مارفعتش صورة، هناخد أول فريم من الفيديو.</span>}
              </div>
            </div>
          )}

          <div className={a.twoCols}>
            <label className={m.field}>
              <span>اسم التيمبليت</span>
              <input className={m.input} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className={m.field}>
              <span>النوع</span>
              <select className={m.input} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className={a.colours}>
            <legend>الألوان (اختارها على ألوان الفيديو)</legend>
            {COLOUR_FIELDS.map(({ key, label, hint }) => (
              <label key={key} className={a.colour}>
                <input
                  type="color"
                  value={theme[key]}
                  onChange={(e) => setTheme((th) => ({ ...th, [key]: e.target.value }))}
                />
                <span>
                  {label}
                  {hint && <small>{hint}</small>}
                </span>
              </label>
            ))}
          </fieldset>

          <div className={a.sample} style={{ background: theme.surface, color: theme.text, borderColor: theme.accent }}>
            <span className={a.sampleSeal} style={{ background: theme.seal }} />
            <strong>أحمد و سارة</strong>
            <span style={{ color: theme.accent }}>تشرفنا بحضورك يا أستاذ محمود</span>
          </div>

          {error && <p className={m.error}>{error}</p>}

          {progress !== null && (
            <div className={a.progress} aria-label="نسبة الرفع">
              <div style={{ width: `${progress}%` }} />
              <span>{progress < 100 ? `بيترفع ${progress}%` : "بيتحفظ..."}</span>
            </div>
          )}

          <button className={m.primary} type="submit" disabled={progress !== null || !video}>
            رفع التيمبليت
          </button>
        </form>
      </section>

      <section className={m.panel}>
        <div className={m.panelHead}>
          <h2>التيمبليتس ({templates.length})</h2>
        </div>
        <div className={a.tabs}>
          {(["all", ...Object.keys(CATEGORY_LABELS)] as (Category | "all")[]).map((c) => (
            <button
              key={c}
              type="button"
              className={m.chip}
              aria-pressed={filter === c}
              onClick={() => setFilter(c)}
            >
              {c === "all" ? "الكل" : CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <p className={m.empty}>مافيش تيمبليتس هنا لسه.</p>
        ) : (
          <ul className={a.grid}>
            {shown.map((t) => (
              <li key={t.id} className={a.card}>
                <div className={a.thumb} style={{ background: t.theme.background }}>
                  {t.videoUrl ? (
                    <video src={t.videoUrl} poster={t.posterUrl} muted playsInline loop preload="none" controls />
                  ) : (
                    <span className={a.noVideo} style={{ background: t.theme.seal }} />
                  )}
                </div>
                <div className={a.cardBody}>
                  <strong>{t.name}</strong>
                  <span className={m.hint}>
                    {CATEGORY_LABELS[t.category]}
                    {!t.createdAt && " · الظرف الافتراضي"}
                    {(usage[t.id] ?? 0) > 0 && ` · ${usage[t.id]} دعوة`}
                  </span>
                  <div className={a.swatches}>
                    {COLOUR_FIELDS.map(({ key }) => (
                      <span key={key} style={{ background: t.theme[key] }} title={key} />
                    ))}
                  </div>
                  <div className={m.inlineActions}>
                    <a className={m.secondary} href={`/admin/${adminKey}/templates/${t.id}`} target="_blank" rel="noreferrer">
                      معاينة ↗
                    </a>
                    {t.createdAt && (
                      <button type="button" className={m.linkBtn} onClick={() => remove(t)}>
                        مسح
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {toast && <div className={m.toast}>{toast}</div>}
    </main>
  );
}
