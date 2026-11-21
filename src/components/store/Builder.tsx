"use client";

import { normalizePhone } from "@/lib/guests";
import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "./store.module.css";
import OrderOptions from "./OrderOptions";
import TemplateGallery, { TemplateThumb } from "./TemplateGallery";
import DateTimePicker from "../DateTimePicker";
import WhatsApp from "../WhatsApp";
import { formatEgp, getPackage, isSelfServe, priceOf, type Pricing } from "@/lib/pricing";
import { UploadError, contentTypeOf, postJson, putFile } from "@/lib/upload-client";
import { CATEGORY_LABELS, type Category, type Lang, type MusicTrack, type PackageId, type Template } from "@/lib/types";
import { SLUG_ERRORS, normalizeSlug, slugProblem, suggestSlug } from "@/lib/slug";
import Icon from "../Icon";

interface Props {
  pricing: Pricing;
  templates: Template[];
  music: MusicTrack[];
  initialTemplateId?: string;
  initialPackageId?: PackageId;
}

export const DETAIL_ERRORS: Record<string, string> = {
  names_required: "اكتب اسم العريس والعروسة.",
  date_invalid: "اختار اليوم والشهر والسنة والساعة.",
  venue_required: "اكتب اسم المكان.",
  address_invalid: "العنوان طويل أوي.",
  maps_invalid: "لينك الخريطة لازم يكون من جوجل ماب أو آبل ماب (افتح المكان ← مشاركة ← نسخ اللينك).",
  text_invalid: "اكتب الجملة اللي في أول الدعوة (لحد 200 حرف).",
  client_name_required: "اكتب اسمك.",
  client_phone_invalid: "رقم الواتساب مش مظبوط. اكتبه 11 رقم زي 01001234567.",
  invalid_template: "اختار تصميم.",
  invalid_package: "اختار باقة.",
  invalid_music: "المزيكا دي مش موجودة، اختار غيرها.",
  rsvp_required: "اختار أيوه أو لأ.",
  link_invalid: "اللينك لازم يبدأ بـ https://",
  file_type: "الملف لازم يكون صورة أو فيديو (MP4/MOV) أو أغنية (MP3/M4A).",
  file_large: "في ملف أكبر من 50 ميجا. لو كبير ارفعه على درايف وحط اللينك.",
  too_many_files: "أقصى عدد 30 ملف. الباقي حطه على درايف وحط اللينك.",
  slug_checking: "استنى ثانية، بنشوف اللينك متاح ولا لأ.",
  ...SLUG_ERRORS,
  failed: "حصلت مشكلة. جرب تاني.",
};

/** Ready-made opening lines per occasion; the client can pick one or write their own. */
const TEXT_SUGGESTIONS: Record<Category, Record<Lang, string[]>> = {
  wedding: {
    ar: ["يشرفنا حضوركم حفل زفافنا", "بكل الحب ندعوكم لمشاركتنا فرحتنا", "تتشرف العائلتان بدعوتكم لحضور حفل زفاف"],
    en: ["Together with their families, invite you to celebrate their wedding", "Request the pleasure of your company"],
  },
  engagement: {
    ar: ["يسعدنا مشاركتكم فرحة خطوبتنا", "بكل الحب ندعوكم لحفل خطوبتنا"],
    en: ["Invite you to celebrate their engagement"],
  },
  katb_kitab: {
    ar: ["يشرفنا حضوركم عقد قراننا", "ندعوكم لمشاركتنا كتب كتابنا"],
    en: ["Invite you to witness their marriage contract"],
  },
};

type QuestionId = "names" | "design" | "date" | "venue" | "maps" | "text" | "package" | "materials" | "rsvp" | "contact" | "link";

interface Question {
  id: QuestionId;
  title: string;
  hint?: string;
  /** Optional questions get a "تخطي" button. */
  optional?: boolean;
}

const QUESTIONS: Question[] = [
  { id: "names", title: "مين العريس والعروسة؟", hint: "هنكتب الأسامي على كل التصميمات علشان تختار وانت شايف شكلها." },
  { id: "design", title: "اختار التصميم", hint: "كل تصميم ظاهر بأساميكم. تقدر تغيره بعدين قبل الدفع." },
  { id: "date", title: "إمتى الفرح؟", hint: "بتوقيت مصر. العد التنازلي في الدعوة بيتحسب منه." },
  { id: "venue", title: "فين الفرح؟" },
  { id: "maps", title: "لينك المكان على الخريطة", hint: "الضيوف يدوسوا عليه مرة ويوصلوا. افتح المكان على جوجل ماب أو آبل ماب ← مشاركة ← نسخ اللينك.", optional: true },
  { id: "text", title: "أول جملة في الدعوة", hint: "اختار واحدة من دول أو اكتب بتاعتك.", optional: true },
  { id: "package", title: "اختار الباقة", hint: "هتشوف الدعوة كاملة قبل ما تدفع." },
  {
    id: "materials",
    title: "ابعتلنا صورك وفيديوهاتك والأغاني",
    hint: "وأي ريفرنسات أو كلام عن الستايل اللي عايزه، أو لينك درايف فيه ملفاتك. فريقنا هيشتغل عليهم. تقدر تزود أو تشيل من صفحة طلبك لحد ما تدفع.",
    optional: true,
  },
  { id: "rsvp", title: "عايز الضيوف يأكدوا حضورهم؟", hint: "كل ضيف يقول جاي ولا يمكن ولا لأ، وجايين كام فرد، وانت تشوف العدد كله في صفحتك." },
  { id: "contact", title: "بياناتك", hint: "هنبعتلك لينك صفحة طلبك، ولينك الدعوة بعد الدفع." },
  { id: "link", title: "اختار لينك دعوتك", hint: "حروف إنجليزي وأرقام وشرطة. لو تخطيت هنعملك لينك تلقائي.", optional: true },
];

const DRAFT_KEY = "builder-draft-v2";

/** Package 3+ files: same limits as the server (see UPLOAD_RULES.reference). */
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "audio/mpeg", "audio/mp4", "audio/x-m4a"];
const ACCEPT_ATTR = `${ACCEPTED.join(",")},.mp3,.m4a,.mov`;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_FILES = 30;
const OLD_DRAFT_KEY = "builder-draft-v1";

interface Draft {
  /** The question on screen; "review" = the summary page. */
  at: QuestionId | "review";
  /** Came from the review page: saving goes back there. */
  fromReview: boolean;
  templateId: string;
  lang: Lang;
  partnerA: string;
  partnerB: string;
  date: string;
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
  generalText: string;
  packageId: PackageId;
  musicTrackId: string;
  brief: string;
  /** Package 3+: a link to the client's files (e.g. Google Drive). */
  briefLink: string;
  rsvp: boolean | null;
  clientName: string;
  clientPhone: string;
  slug: string;
  /** Optional questions the client skipped (shown as "اتخطى" on the review page). */
  skipped: QuestionId[];
}

const MAPS_URL = /^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps|share\.google\/|maps\.apple\.com|maps\.apple\/)\b/i;

type SlugState = { slug: string; status: "idle" | "checking" | "ok" | "bad"; reason?: string };

/**
 * The storefront builder, one question at a time like a chat: each answer is kept in this browser
 * as soon as it's given, optional ones can be skipped, and a review page lists every answer with
 * an edit button. Creates a draft order the client previews before paying.
 */
export default function Builder({ pricing, templates, music, initialTemplateId, initialPackageId }: Props) {
  const onSale = pricing.packages.filter((p) => p.active && isSelfServe(p.id)).map((p) => p.id);
  const firstTemplate = templates.some((t) => t.id === initialTemplateId) ? initialTemplateId! : (templates[0]?.id ?? "");
  const firstPackage = initialPackageId && onSale.includes(initialPackageId) ? initialPackageId : (onSale[0] ?? 1);

  const [d, setD] = useState<Draft>({
    at: "names",
    fromReview: false,
    templateId: firstTemplate,
    lang: "ar",
    partnerA: "",
    partnerB: "",
    date: "",
    venueName: "",
    venueAddress: "",
    mapsUrl: "",
    generalText: "",
    packageId: firstPackage,
    musicTrackId: "",
    brief: "",
    briefLink: "",
    rsvp: null,
    clientName: "",
    clientPhone: "",
    slug: "",
    skipped: [],
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  /** Package 3+ files, kept in memory until the order exists (a browser can't save them for later). */
  const [files, setFiles] = useState<File[]>([]);
  const [uploadMsg, setUploadMsg] = useState("");
  const [slugState, setSlugState] = useState<SlugState>({ slug: "", status: "idle" });
  // Read after mount so the server and browser render the same thing first.
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.host), []);
  const restored = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));

  // Restore a draft from this browser (unless the link chose a specific design or package).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? localStorage.getItem(OLD_DRAFT_KEY) ?? "null") as Partial<Draft> | null;
      if (saved && typeof saved === "object") {
        setD((x) => {
          const merged: Draft = {
            ...x,
            ...saved,
            templateId: initialTemplateId && templates.some((t) => t.id === initialTemplateId) ? initialTemplateId : saved.templateId || x.templateId,
            packageId:
              initialPackageId && onSale.includes(initialPackageId)
                ? initialPackageId
                : saved.packageId && onSale.includes(saved.packageId)
                  ? saved.packageId
                  : x.packageId,
            skipped: Array.isArray(saved.skipped) ? saved.skipped : [],
            rsvp: typeof saved.rsvp === "boolean" ? saved.rsvp : null,
            slug: typeof saved.slug === "string" ? saved.slug : "",
            briefLink: typeof saved.briefLink === "string" ? saved.briefLink : "",
            fromReview: false,
          };
          // Old drafts (numbered steps) start again from the first question, with their answers kept.
          if (!QUESTIONS.some((q) => q.id === merged.at) && merged.at !== "review") merged.at = "names";
          return merged;
        });
      }
    } catch {}
    restored.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
      localStorage.removeItem(OLD_DRAFT_KEY);
    } catch {}
  }, [d]);

  // Focus the first field of each new question, so it feels like answering a chat.
  useEffect(() => {
    const el = topRef.current?.querySelector<HTMLElement>("[data-autofocus]");
    el?.focus({ preventScroll: true });
  }, [d.at]);

  // Live check of the link the client is typing (debounced).
  useEffect(() => {
    const slug = normalizeSlug(d.slug);
    if (!slug) return setSlugState({ slug: "", status: "idle" });
    const problem = slugProblem(slug);
    if (problem) return setSlugState({ slug, status: "bad", reason: problem });
    setSlugState({ slug, status: "checking" });
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/slug?s=${encodeURIComponent(slug)}`, { signal: ctrl.signal, cache: "no-store" });
        const r = (await res.json()) as { available: boolean; reason?: string };
        setSlugState({ slug, status: r.available ? "ok" : "bad", reason: r.reason });
      } catch {
        if (!ctrl.signal.aborted) setSlugState({ slug, status: "idle" });
      }
    }, 400);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [d.slug]);

  const template = templates.find((t) => t.id === d.templateId);
  const category: Category = template?.category ?? "wedding";
  const suggestions = TEXT_SUGGESTIONS[category][d.lang];
  const total = priceOf(pricing, d.packageId);
  const pkg = getPackage(pricing, d.packageId);
  // Attendance replies come with package 2+, so the question only shows then.
  // The files question is for packages made by our team (3+).
  const questions = QUESTIONS.filter((q) => (q.id !== "rsvp" || d.packageId >= 2) && (q.id !== "materials" || d.packageId >= 3));
  // A saved spot that no longer applies (e.g. the attendance question after switching to package 1) falls back to the review.
  const index = questions.findIndex((q) => q.id === d.at);
  const current = index >= 0 ? questions[index] : null;
  const names = d.partnerA.trim() && d.partnerB.trim() ? { a: d.partnerA.trim(), b: d.partnerB.trim() } : undefined;

  /** Checks one question; returns an error code or "". */
  function check(id: QuestionId): string {
    switch (id) {
      case "names":
        return !d.partnerA.trim() || !d.partnerB.trim() ? "names_required" : "";
      case "design":
        return template ? "" : "invalid_template";
      case "date":
        return d.date ? "" : "date_invalid";
      case "venue":
        return d.venueName.trim() ? "" : "venue_required";
      case "maps":
        return d.mapsUrl.trim() && !MAPS_URL.test(d.mapsUrl.trim()) ? "maps_invalid" : "";
      case "text":
        return d.generalText.trim().length > 200 ? "text_invalid" : "";
      case "package":
        return onSale.includes(d.packageId) ? "" : "invalid_package";
      case "materials":
        if (d.briefLink.trim() && !/^https?:\/\/\S{3,}$/i.test(d.briefLink.trim())) return "link_invalid";
        if (files.length > MAX_FILES) return "too_many_files";
        if (files.some((f) => !ACCEPTED.includes(contentTypeOf(f)))) return "file_type";
        return files.some((f) => f.size > MAX_FILE_BYTES) ? "file_large" : "";
      case "rsvp":
        return d.rsvp === null ? "rsvp_required" : "";
      case "contact":
        if (!d.clientName.trim()) return "client_name_required";
        return normalizePhone(d.clientPhone) ? "" : "client_phone_invalid";
      case "link": {
        const slug = normalizeSlug(d.slug);
        if (!slug) return "";
        if (slugState.slug !== slug || slugState.status === "checking") return "slug_checking";
        return slugState.status === "bad" ? (slugState.reason ?? "slug_taken") : "";
      }
    }
  }

  function show(at: Draft["at"], patch: Partial<Draft> = {}) {
    setError("");
    set({ at, ...patch });
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** Next question, or back to the review page when editing from there. */
  function advance(skippedNow = false) {
    if (!current) return;
    const skipped = skippedNow ? [...new Set([...d.skipped, current.id])] : d.skipped.filter((id) => id !== current.id);
    const nextQ = questions[index + 1];
    // Offer a ready-made link from the names when the client reaches that question with nothing typed.
    const slugPatch = nextQ?.id === "link" && !d.slug ? { slug: suggestSlug(d.partnerA, d.partnerB) } : {};
    if (d.fromReview || !nextQ) show("review", { skipped, fromReview: false, ...slugPatch });
    else show(nextQ.id, { skipped, ...slugPatch });
  }

  function next(e?: FormEvent) {
    e?.preventDefault();
    if (!current) return;
    const problem = check(current.id);
    if (problem) return setError(DETAIL_ERRORS[problem] ?? DETAIL_ERRORS.failed);
    advance();
  }

  function skip() {
    if (!current) return;
    // Skipping clears what was half-typed, so the review shows exactly what the invitation will use.
    if (current.id === "maps") set({ mapsUrl: "" });
    if (current.id === "text") set({ generalText: "" });
    if (current.id === "link") set({ slug: "" });
    if (current.id === "materials") {
      set({ brief: "", briefLink: "" });
      setFiles([]);
    }
    advance(true);
  }

  function back() {
    if (!current) return show(questions[questions.length - 1].id);
    if (d.fromReview) return show("review", { fromReview: false });
    if (index > 0) show(questions[index - 1].id);
  }

  async function submit() {
    for (const q of questions) {
      const problem = check(q.id);
      if (problem) {
        show(q.id, { fromReview: true });
        return setError(DETAIL_ERRORS[problem] ?? DETAIL_ERRORS.failed);
      }
    }
    setError("");
    setBusy(true);
    try {
      const { manageToken } = await postJson<{ manageToken: string }>("/api/orders", {
        templateId: d.templateId,
        lang: d.lang,
        partnerA: d.partnerA,
        partnerB: d.partnerB,
        date: d.date,
        venueName: d.venueName,
        venueAddress: d.venueAddress,
        mapsUrl: d.mapsUrl,
        generalText: d.generalText || suggestions[0],
        packageId: d.packageId,
        musicTrackId: d.packageId >= 2 ? d.musicTrackId : "",
        brief: d.packageId >= 3 ? d.brief : "",
        briefLink: d.packageId >= 3 ? d.briefLink.trim() : "",
        rsvp: d.packageId >= 2 && d.rsvp === true,
        clientName: d.clientName,
        clientPhone: d.clientPhone,
        slug: normalizeSlug(d.slug) || undefined,
      });
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      // Package 3+: send the chosen files now that the order exists. One that fails can be re-added from the order page.
      const toSend = d.packageId >= 3 ? files : [];
      const api = `/api/manage/${encodeURIComponent(manageToken)}`;
      for (const [i, file] of toSend.entries()) {
        setUploadMsg(`بيرفع ملفاتك ${i + 1} من ${toSend.length}...`);
        try {
          const contentType = contentTypeOf(file);
          const up = await postJson<{ objectKey: string; uploadUrl: string }>(`${api}/uploads`, { kind: "reference", contentType, size: file.size });
          await putFile(up.uploadUrl, file, contentType);
          await postJson(`${api}/references`, { objectKey: up.objectKey, name: file.name });
        } catch {}
      }
      window.location.href = `/order/${manageToken}?new=1`;
    } catch (err) {
      const code = err instanceof UploadError ? err.code : "failed";
      if (code in SLUG_ERRORS) {
        show("link", { fromReview: true });
        setSlugState({ slug: normalizeSlug(d.slug), status: "bad", reason: code });
      }
      setError(DETAIL_ERRORS[code] ?? DETAIL_ERRORS.failed);
      setBusy(false);
    }
  }

  /** One-line answer for the chat history and the review page. */
  function answer(id: QuestionId): string {
    if (d.skipped.includes(id)) return "اتخطى";
    switch (id) {
      case "names":
        return names ? `${names.a} و ${names.b}` : "";
      case "design":
        return template ? `${template.name} · ${CATEGORY_LABELS[category]}` : "";
      case "date":
        return formatPicked(d.date);
      case "venue":
        return [d.venueName, d.venueAddress].filter((x) => x.trim()).join(" · ");
      case "maps":
        return d.mapsUrl ? "اتضاف" : "";
      case "text":
        return d.generalText || suggestions[0];
      case "package":
        return pkg ? `${pkg.name} · ${formatEgp(total)}` : "";
      case "materials": {
        const parts = [files.length ? `${files.length} ملف` : "", d.briefLink.trim() ? "لينك" : "", d.brief.trim() ? "كلام" : ""].filter(Boolean);
        return parts.join(" · ");
      }
      case "rsvp":
        return d.rsvp === null ? "" : d.rsvp ? "أيوه" : "لأ";
      case "contact":
        return d.clientName ? `${d.clientName} · ${d.clientPhone}` : "";
      case "link":
        return normalizeSlug(d.slug) ? `${origin}/i/${normalizeSlug(d.slug)}` : "لينك تلقائي";
    }
  }

  // The two answers right before this question, shown as chat bubbles above it (tap to edit).
  const history = index > 0 ? questions.slice(Math.max(0, index - 2), index).filter((q) => answer(q.id)) : [];
  const slugNow = normalizeSlug(d.slug);

  return (
    <div className={styles.wizard} ref={topRef}>
      <div className={styles.qProgress}>
        <span>{current ? `سؤال ${index + 1} من ${questions.length}` : "المراجعة"}</span>
        <div className={styles.qBar} aria-hidden>
          <span style={{ width: `${current ? ((index + 1) / (questions.length + 1)) * 100 : 100}%` }} />
        </div>
      </div>

      {current && (
        <>
          {!d.fromReview && history.length > 0 && (
            <ol className={styles.chatHistory}>
              {history.map((q) => (
                <li key={q.id}>
                  <span className={styles.chatQ}>{q.title}</span>
                  <button type="button" className={styles.chatA} onClick={() => show(q.id)} title="تعديل">
                    {answer(q.id)}
                  </button>
                </li>
              ))}
            </ol>
          )}

          <form className={`${styles.card} ${styles.qCard}`} onSubmit={next} key={current.id} noValidate>
            <h2>{current.title}</h2>
            {current.hint && <p className={styles.hint}>{current.hint}</p>}

            {current.id === "names" && (
              <>
                <div className={styles.langSwitch} role="radiogroup" aria-label="لغة الدعوة">
                  {(["ar", "en"] as Lang[]).map((l) => (
                    <button key={l} type="button" role="radio" aria-checked={d.lang === l} className={styles.tab} onClick={() => set({ lang: l, generalText: "" })}>
                      {l === "ar" ? "الدعوة بالعربي" : "English"}
                    </button>
                  ))}
                </div>
                <div className={styles.row}>
                  <label className={styles.field}>
                    <span>{d.lang === "ar" ? "اسم العريس" : "First name (e.g. groom)"}</span>
                    <input data-autofocus value={d.partnerA} onChange={(e) => set({ partnerA: e.target.value })} maxLength={40} />
                  </label>
                  <label className={styles.field}>
                    <span>{d.lang === "ar" ? "اسم العروسة" : "Second name (e.g. bride)"}</span>
                    <input value={d.partnerB} onChange={(e) => set({ partnerB: e.target.value })} maxLength={40} />
                  </label>
                </div>
              </>
            )}

            {current.id === "design" &&
              (templates.length === 0 ? (
                <p className={styles.hint}>التصميمات بتترفع قريب.</p>
              ) : (
                <TemplateGallery templates={templates} selectedId={d.templateId} onSelect={(id) => set({ templateId: id })} names={names} lang={d.lang} />
              ))}

            {current.id === "date" && <DateTimePicker value={d.date} onChange={(date) => set({ date })} />}

            {current.id === "venue" && (
              <div className={styles.row}>
                <label className={styles.field}>
                  <span>اسم المكان</span>
                  <input data-autofocus value={d.venueName} onChange={(e) => set({ venueName: e.target.value })} maxLength={80} placeholder="قاعة..." />
                </label>
                <label className={styles.field}>
                  <span>العنوان (اختياري)</span>
                  <input value={d.venueAddress} onChange={(e) => set({ venueAddress: e.target.value })} maxLength={120} />
                </label>
              </div>
            )}

            {current.id === "maps" && (
              <label className={styles.field}>
                <span>لينك جوجل ماب أو آبل ماب</span>
                <input
                  data-autofocus
                  type="url"
                  dir="ltr"
                  inputMode="url"
                  placeholder="https://maps.app.goo.gl/..."
                  value={d.mapsUrl}
                  onChange={(e) => set({ mapsUrl: e.target.value })}
                />
              </label>
            )}

            {current.id === "text" && (
              <div className={styles.field}>
                <input data-autofocus value={d.generalText} maxLength={200} placeholder={suggestions[0]} onChange={(e) => set({ generalText: e.target.value })} />
                <div className={styles.suggestions}>
                  {suggestions.map((t) => (
                    <button key={t} type="button" className={styles.suggestion} aria-pressed={d.generalText === t} onClick={() => set({ generalText: t })}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {current.id === "package" && (
              <>
                <OrderOptions
                  pricing={pricing}
                  packageId={d.packageId}
                  onChange={(packageId) => set({ packageId })}
                  music={music}
                  musicTrackId={d.musicTrackId}
                  onMusicChange={(musicTrackId) => set({ musicTrackId })}
                />
                {d.packageId >= 3 && <p className={styles.hint}>في الباقة دي هتضيف ضيوفك بالاسم ورسالة خاصة لأي حد من صفحتك.</p>}
              </>
            )}

            {current.id === "materials" && (
              <>
                <label className={styles.field}>
                  <span>احكيلنا عايز إيه (الستايل، الألوان، الأغنية...)</span>
                  <textarea data-autofocus value={d.brief} maxLength={2000} onChange={(e) => set({ brief: e.target.value })} />
                </label>
                <label className={styles.dropzone}>
                  <input
                    type="file"
                    multiple
                    accept={ACCEPT_ATTR}
                    onChange={(e) => {
                      const picked = Array.from(e.target.files ?? []);
                      setFiles((x) => [...x, ...picked]);
                      setError("");
                      e.target.value = "";
                    }}
                  />
                  <Icon name="plus" size={22} />
                  <span>اختار صور أو فيديوهات أو أغاني (لحد 50 ميجا للملف)</span>
                </label>
                {files.length > 0 && (
                  <ul className={styles.fileList}>
                    {files.map((f, i) => (
                      <li key={`${f.name}-${i}`}>
                        <Icon name={f.type.startsWith("video") ? "video" : f.type.startsWith("audio") || /\.(mp3|m4a)$/i.test(f.name) ? "music" : "image"} size={18} />
                        <span dir="auto">{f.name}</span>
                        <small>{(f.size / 1024 / 1024).toFixed(1)} ميجا</small>
                        <button type="button" onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} aria-label={`شيل ${f.name}`}>
                          <Icon name="x" size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <label className={styles.field}>
                  <span>أو لينك درايف فيه ملفاتك (اختياري)</span>
                  <input
                    type="url"
                    dir="ltr"
                    inputMode="url"
                    value={d.briefLink}
                    onChange={(e) => set({ briefLink: e.target.value })}
                    placeholder="https://drive.google.com/..."
                  />
                </label>
                <p className={styles.hint}>الملفات بتترفع لما تضغط &quot;اعمل الدعوة&quot; في الآخر. لو قفلت الصفحة قبلها هتحتاج تختارها تاني.</p>
              </>
            )}

            {current.id === "rsvp" && (
              <div className={styles.choiceRow} role="radiogroup" aria-label={current.title}>
                {[
                  { v: true, label: "أيوه", note: "ننصح بيه" },
                  { v: false, label: "لأ" },
                ].map((o) => (
                  <button
                    key={String(o.v)}
                    type="button"
                    role="radio"
                    aria-checked={d.rsvp === o.v}
                    className={styles.choice}
                    data-autofocus={o.v ? "" : undefined}
                    onClick={() => {
                      set({ rsvp: o.v });
                      setError("");
                    }}
                  >
                    <strong>{o.label}</strong>
                    {o.note && <small>{o.note}</small>}
                  </button>
                ))}
              </div>
            )}

            {current.id === "contact" && (
              <>
                <div className={styles.row}>
                  <label className={styles.field}>
                    <span>اسمك</span>
                    <input data-autofocus value={d.clientName} onChange={(e) => set({ clientName: e.target.value })} maxLength={60} autoComplete="name" />
                  </label>
                  <label className={styles.field}>
                    <span>رقم الواتساب</span>
                    <input
                      type="tel"
                      dir="ltr"
                      inputMode="tel"
                      value={d.clientPhone}
                      onChange={(e) => set({ clientPhone: e.target.value })}
                      autoComplete="tel"
                      placeholder="01xxxxxxxxx"
                    />
                  </label>
                </div>
                <p className={styles.hint}>
                  لينك صفحة طلبك: منها تشوف المعاينة وتعدّل وتدفع. ولينك الدعوة هيوصلك على <WhatsApp /> بعد الدفع.
                </p>
              </>
            )}

            {current.id === "link" && (
              <div className={styles.field}>
                <div className={styles.slugInput} dir="ltr">
                  <span>{origin}/i/</span>
                  <input
                    data-autofocus
                    value={d.slug}
                    onChange={(e) => set({ slug: e.target.value.toLowerCase() })}
                    maxLength={50}
                    placeholder="omar-salma"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-label="لينك الدعوة"
                  />
                </div>
                {slugNow && (
                  <p className={styles.slugStatus} data-state={slugState.slug === slugNow ? slugState.status : "checking"} role="status">
                    {slugState.slug !== slugNow || slugState.status === "checking"
                      ? "بنشوف..."
                      : slugState.status === "ok"
                        ? `متاح: ${origin}/i/${slugNow}`
                        : slugState.status === "bad"
                          ? (SLUG_ERRORS[slugState.reason ?? "slug_taken"] ?? SLUG_ERRORS.slug_taken)
                          : ""}
                  </p>
                )}
              </div>
            )}

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            {/* Enter in any field moves on. */}
            <button type="submit" hidden aria-hidden tabIndex={-1} />
          </form>
        </>
      )}

      {!current && (
        <section className={styles.card}>
          <h2>راجع إجاباتك</h2>
          <p className={styles.hint}>كل إجاباتك في مكان واحد. لو في حاجة غلط عدلها من هنا. مش هنعمل حاجة ولا هتدفع غير لما تقول.</p>
          <div className={styles.review}>
            {template && (
              <div className={styles.reviewThumb}>
                <TemplateThumb template={template} showBadge={false} names={names} lang={d.lang} />
              </div>
            )}
            <ul className={styles.reviewRows}>
              {questions.map((q) => (
                <li key={q.id}>
                  <div>
                    <small>{q.title}</small>
                    <span dir="auto">{answer(q.id) || "لسه"}</span>
                  </div>
                  <button type="button" className={styles.editBtn} onClick={() => show(q.id, { fromReview: true })}>
                    تعديل
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <p className={styles.hint}>بعد الخطوة دي هتشوف الدعوة كاملة، وتدفع لما تبقى مبسوط بيها.</p>
        </section>
      )}

      <div className={styles.bottomBar}>
        <div className={styles.bottomBarInner}>
          <div className={styles.navButtons}>
            {(index > 0 || !current || d.fromReview) && (
              <button type="button" className={styles.ctaGhost} onClick={back} disabled={busy} aria-label="رجوع">
                <Icon name="arrowRight" size={18} />
              </button>
            )}
            {current?.optional && (
              <button type="button" className={styles.ctaGhost} onClick={skip}>
                تخطي
              </button>
            )}
            {current ? (
              <button type="button" className={styles.cta} onClick={() => next()}>
                {d.fromReview ? "حفظ" : index === questions.length - 1 ? "راجع" : "التالي"} {!d.fromReview && <Icon name="arrowLeft" size={18} />}
              </button>
            ) : (
              <button type="button" className={styles.cta} onClick={submit} disabled={busy}>
                {busy ? uploadMsg || "ثانية..." : "اعمل الدعوة وشوفها"}
              </button>
            )}
          </div>
          <div>
            <small className={styles.hint}>الإجمالي</small>
            <br />
            <strong>{formatEgp(total)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

/** "2027-02-14T19:30" → "14 فبراير 2027 · 7:30 مساءً" */
function formatPicked(value: string): string {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return "";
  const h = Number(m[4]);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]} · ${h12}:${m[5]} ${h >= 12 ? "مساءً" : "صباحاً"}`;
}
