"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./store.module.css";
import OrderOptions from "./OrderOptions";
import TemplateGallery, { TemplateThumb } from "./TemplateGallery";
import DateTimePicker from "../DateTimePicker";
import WhatsApp from "../WhatsApp";
import { formatEgp, getPackage, isSelfServe, priceOf, type Pricing } from "@/lib/pricing";
import { UploadError, postJson } from "@/lib/upload-client";
import { CATEGORY_LABELS, type Category, type Lang, type MusicTrack, type PackageId, type Template } from "@/lib/types";
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
  client_phone_invalid: "رقم الواتساب مش مظبوط.",
  invalid_template: "اختار تصميم.",
  invalid_package: "اختار باقة.",
  invalid_music: "المزيكا دي مش موجودة، اختار غيرها.",
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

const STEPS = ["التصميم", "البيانات", "الباقة", "بياناتك", "المراجعة"] as const;
const DRAFT_KEY = "builder-draft-v1";

interface Draft {
  step: number;
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
  clientName: string;
  clientPhone: string;
}

const MAPS_URL = /^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps|share\.google\/|maps\.apple\.com|maps\.apple\/)\b/i;

/**
 * The storefront builder as steps: design → details → package → contact → review.
 * "Back" keeps everything; the draft is also saved in this browser, so closing the page loses nothing.
 * Creates a draft order the client previews before paying.
 */
export default function Builder({ pricing, templates, music, initialTemplateId, initialPackageId }: Props) {
  const onSale = pricing.packages.filter((p) => p.active && isSelfServe(p.id)).map((p) => p.id);
  const firstTemplate = templates.some((t) => t.id === initialTemplateId) ? initialTemplateId! : (templates[0]?.id ?? "");
  const firstPackage = initialPackageId && onSale.includes(initialPackageId) ? initialPackageId : (onSale[0] ?? 1);

  const [d, setD] = useState<Draft>({
    step: 0,
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
    clientName: "",
    clientPhone: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const restored = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));

  // Restore a draft from this browser (unless the link chose a specific design or package).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null") as Draft | null;
      if (saved && typeof saved === "object") {
        setD((x) => ({
          ...x,
          ...saved,
          templateId: initialTemplateId && templates.some((t) => t.id === initialTemplateId) ? initialTemplateId : saved.templateId || x.templateId,
          packageId: initialPackageId && onSale.includes(initialPackageId) ? initialPackageId : onSale.includes(saved.packageId) ? saved.packageId : x.packageId,
          step: Math.min(saved.step ?? 0, STEPS.length - 1),
        }));
      }
    } catch {}
    restored.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch {}
  }, [d]);

  const template = templates.find((t) => t.id === d.templateId);
  const category: Category = template?.category ?? "wedding";
  const suggestions = TEXT_SUGGESTIONS[category][d.lang];
  const total = priceOf(pricing, d.packageId);
  const pkg = getPackage(pricing, d.packageId);

  /** Checks the current step; returns an error message or "". */
  function check(step: number): string {
    if (step === 0 && !template) return DETAIL_ERRORS.invalid_template;
    if (step === 1) {
      if (!d.partnerA.trim() || !d.partnerB.trim()) return DETAIL_ERRORS.names_required;
      if (!d.date) return DETAIL_ERRORS.date_invalid;
      if (!d.venueName.trim()) return DETAIL_ERRORS.venue_required;
      if (d.mapsUrl.trim() && !MAPS_URL.test(d.mapsUrl.trim())) return DETAIL_ERRORS.maps_invalid;
      if (d.generalText.trim().length > 200) return DETAIL_ERRORS.text_invalid;
    }
    if (step === 3) {
      if (!d.clientName.trim()) return DETAIL_ERRORS.client_name_required;
      if (d.clientPhone.replace(/\D/g, "").length < 10) return DETAIL_ERRORS.client_phone_invalid;
    }
    return "";
  }

  function go(step: number) {
    setError("");
    set({ step });
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function next() {
    const problem = check(d.step);
    if (problem) return setError(problem);
    go(d.step + 1);
  }

  async function submit() {
    for (let s = 0; s < 4; s++) {
      const problem = check(s);
      if (problem) {
        go(s);
        return setError(problem);
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
        clientName: d.clientName,
        clientPhone: d.clientPhone,
      });
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      window.location.href = `/order/${manageToken}?new=1`;
    } catch (err) {
      setError(DETAIL_ERRORS[err instanceof UploadError ? err.code : "failed"] ?? DETAIL_ERRORS.failed);
      setBusy(false);
    }
  }

  return (
    <div className={styles.wizard} ref={topRef}>
      <ol className={styles.progress} aria-label="الخطوات">
        {STEPS.map((label, i) => (
          <li key={label} data-state={i < d.step ? "done" : i === d.step ? "current" : "todo"}>
            <button type="button" disabled={i > d.step} onClick={() => go(i)} aria-current={i === d.step ? "step" : undefined}>
              <span className={styles.progressNum}>{i < d.step ? <Icon name="check" size={15} strokeWidth={2.4} /> : i + 1}</span>
              <span className={styles.progressLabel}>{label}</span>
            </button>
          </li>
        ))}
      </ol>

      {d.step === 0 && (
        <section className={styles.card}>
          <h2>اختار التصميم</h2>
          {templates.length === 0 ? (
            <p className={styles.hint}>التصميمات بتترفع قريب.</p>
          ) : (
            <TemplateGallery templates={templates} selectedId={d.templateId} onSelect={(id) => set({ templateId: id })} />
          )}
        </section>
      )}

      {d.step === 1 && (
        <section className={styles.card}>
          <h2>بيانات الدعوة</h2>
          <div className={styles.field}>
            <span>لغة الدعوة</span>
            <div className={styles.langSwitch} role="radiogroup" aria-label="لغة الدعوة">
              {(["ar", "en"] as Lang[]).map((l) => (
                <button key={l} type="button" role="radio" aria-checked={d.lang === l} className={styles.tab} onClick={() => set({ lang: l, generalText: "" })}>
                  {l === "ar" ? "عربي" : "English"}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.row}>
            <label className={styles.field}>
              <span>{d.lang === "ar" ? "اسم العريس" : "First name (e.g. groom)"}</span>
              <input value={d.partnerA} onChange={(e) => set({ partnerA: e.target.value })} maxLength={40} />
            </label>
            <label className={styles.field}>
              <span>{d.lang === "ar" ? "اسم العروسة" : "Second name (e.g. bride)"}</span>
              <input value={d.partnerB} onChange={(e) => set({ partnerB: e.target.value })} maxLength={40} />
            </label>
          </div>
          <div className={styles.field}>
            <span>التاريخ والساعة (بتوقيت مصر)</span>
            <DateTimePicker value={d.date} onChange={(date) => set({ date })} />
          </div>
          <div className={styles.row}>
            <label className={styles.field}>
              <span>اسم المكان</span>
              <input value={d.venueName} onChange={(e) => set({ venueName: e.target.value })} maxLength={80} placeholder="قاعة..." />
            </label>
            <label className={styles.field}>
              <span>العنوان (اختياري)</span>
              <input value={d.venueAddress} onChange={(e) => set({ venueAddress: e.target.value })} maxLength={120} />
            </label>
          </div>
          <label className={styles.field}>
            <span>لينك المكان من جوجل ماب أو آبل ماب (اختياري)</span>
            <input
              type="url"
              dir="ltr"
              inputMode="url"
              placeholder="https://maps.app.goo.gl/..."
              value={d.mapsUrl}
              onChange={(e) => set({ mapsUrl: e.target.value })}
            />
          </label>
          <div className={styles.field}>
            <span>الجملة اللي في أول الدعوة</span>
            <input
              value={d.generalText}
              maxLength={200}
              placeholder={suggestions[0]}
              onChange={(e) => set({ generalText: e.target.value })}
            />
            <div className={styles.suggestions}>
              {suggestions.map((t) => (
                <button key={t} type="button" className={styles.suggestion} aria-pressed={d.generalText === t} onClick={() => set({ generalText: t })}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {d.step === 2 && (
        <section className={styles.card}>
          <h2>الباقة</h2>
          <OrderOptions
            pricing={pricing}
            packageId={d.packageId}
            onChange={(packageId) => set({ packageId })}
            music={music}
            musicTrackId={d.musicTrackId}
            onMusicChange={(musicTrackId) => set({ musicTrackId })}
          />
          {d.packageId >= 3 && (
            <label className={styles.field}>
              <span>احكيلنا عايز إيه (الستايل، الألوان، ريفرنسات)</span>
              <textarea
                value={d.brief}
                maxLength={2000}
                onChange={(e) => set({ brief: e.target.value })}
                placeholder="هتقدر كمان ترفع صورك وفيديوهاتك من صفحتك بعد الخطوة دي."
              />
            </label>
          )}
          {d.packageId >= 3 && <p className={styles.hint}>في الباقة دي هتضيف ضيوفك بالاسم ورسالة خاصة لأي حد من صفحتك.</p>}
        </section>
      )}

      {d.step === 3 && (
        <section className={styles.card}>
          <h2>بياناتك</h2>
          <div className={styles.row}>
            <label className={styles.field}>
              <span>اسمك</span>
              <input value={d.clientName} onChange={(e) => set({ clientName: e.target.value })} maxLength={60} autoComplete="name" />
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
            هتاخد لينك صفحة طلبك: منها تشوف المعاينة وتعدّل وتدفع. ولينك الدعوة هيوصلك على <WhatsApp /> بعد الدفع.
          </p>
        </section>
      )}

      {d.step === 4 && (
        <section className={styles.card}>
          <h2>راجع قبل ما تكمل</h2>
          <div className={styles.review}>
            {template && (
              <div className={styles.reviewThumb}>
                <TemplateThumb template={template} showBadge={false} />
              </div>
            )}
            <dl className={styles.reviewList}>
              <dt>التصميم</dt>
              <dd>
                {template?.name} · {CATEGORY_LABELS[category]}
              </dd>
              <dt>الأسامي</dt>
              <dd>
                {d.partnerA} و {d.partnerB}
              </dd>
              <dt>الميعاد</dt>
              <dd>{formatPicked(d.date)}</dd>
              <dt>المكان</dt>
              <dd>
                {d.venueName}
                {d.venueAddress && ` · ${d.venueAddress}`}
              </dd>
              <dt>أول الدعوة</dt>
              <dd>{d.generalText || suggestions[0]}</dd>
              <dt>الباقة</dt>
              <dd>
                {pkg?.name} · {formatEgp(total)}
              </dd>
              <dt>بياناتك</dt>
              <dd>
                {d.clientName} · <bdi dir="ltr">{d.clientPhone}</bdi>
              </dd>
            </dl>
          </div>
          <p className={styles.hint}>بعد الخطوة دي هتشوف المعاينة كاملة، وتدفع لما تبقى مبسوط بيها.</p>
        </section>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.bottomBar}>
        <div className={styles.bottomBarInner}>
          <div className={styles.navButtons}>
            {d.step > 0 && (
              <button type="button" className={styles.ctaGhost} onClick={() => go(d.step - 1)} disabled={busy}>
                <Icon name="arrowRight" size={18} /> رجوع
              </button>
            )}
            {d.step < STEPS.length - 1 ? (
              <button type="button" className={styles.cta} onClick={next}>
                التالي <Icon name="arrowLeft" size={18} />
              </button>
            ) : (
              <button type="button" className={styles.cta} onClick={submit} disabled={busy}>
                {busy ? "ثانية..." : "اعمل الدعوة وشوف المعاينة"}
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
