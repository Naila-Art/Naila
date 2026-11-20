"use client";

import { useState, type FormEvent } from "react";
import styles from "./store.module.css";
import OrderOptions from "./OrderOptions";
import TemplateGallery from "./TemplateGallery";
import { NO_ADDONS, formatEgp, isSelfServe, priceOf, type Pricing } from "@/lib/pricing";
import { UploadError, postJson } from "@/lib/upload-client";
import type { Addons, Lang, MusicTrack, PackageId, Template } from "@/lib/types";

interface Props {
  pricing: Pricing;
  templates: Template[];
  music: MusicTrack[];
  initialTemplateId?: string;
  initialPackageId?: PackageId;
}

export const DETAIL_ERRORS: Record<string, string> = {
  names_required: "اكتب اسم العريس والعروسة.",
  date_invalid: "اختار التاريخ والساعة.",
  venue_required: "اكتب اسم المكان.",
  address_invalid: "العنوان طويل أوي.",
  maps_invalid: "لينك الخريطة لازم يكون من جوجل ماب (افتح المكان على جوجل ماب ← مشاركة ← نسخ اللينك).",
  client_name_required: "اكتب اسمك.",
  client_phone_invalid: "رقم الواتساب مش مظبوط.",
  invalid_template: "اختار تصميم.",
  invalid_package: "اختار باقة.",
  invalid_music: "المزيكا دي مش موجودة، اختار غيرها.",
  lang_locked: "مينفعش تغير اللغة بعد الدفع.",
  failed: "حصلت مشكلة. جرب تاني.",
};

/**
 * The storefront builder: template → details → package & add-ons → contact.
 * Creates a draft the client previews before paying (names can be added right after, on their page).
 */
export default function Builder({ pricing, templates, music, initialTemplateId, initialPackageId }: Props) {
  const onSale = pricing.packages.filter((p) => p.active && isSelfServe(p.id)).map((p) => p.id);
  const [templateId, setTemplateId] = useState(
    templates.some((t) => t.id === initialTemplateId) ? initialTemplateId! : (templates[0]?.id ?? ""),
  );
  const [lang, setLang] = useState<Lang>("ar");
  const [partnerA, setPartnerA] = useState("");
  const [partnerB, setPartnerB] = useState("");
  const [date, setDate] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [packageId, setPackageId] = useState<PackageId>(
    initialPackageId && onSale.includes(initialPackageId) ? initialPackageId : (onSale[0] ?? 1),
  );
  const [addons, setAddons] = useState<Addons>(NO_ADDONS);
  const [musicTrackId, setMusicTrackId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const total = priceOf(pricing, packageId, { ...addons, arabic: lang === "ar" });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { manageToken } = await postJson<{ manageToken: string }>("/api/orders", {
        templateId,
        lang,
        partnerA,
        partnerB,
        date,
        venueName,
        venueAddress,
        mapsUrl: addons.maps ? mapsUrl : "",
        packageId,
        addons,
        musicTrackId: packageId >= 2 ? musicTrackId : "",
        clientName,
        clientPhone,
      });
      window.location.href = `/c/${manageToken}?new=1`;
    } catch (err) {
      setError(DETAIL_ERRORS[err instanceof UploadError ? err.code : "failed"] ?? DETAIL_ERRORS.failed);
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <section className={styles.card}>
        <h2>
          <span className={styles.stepNum}>1</span>اختار التصميم
        </h2>
        {templates.length === 0 ? (
          <p className={styles.hint}>التصميمات بتترفع قريب.</p>
        ) : (
          <TemplateGallery templates={templates} selectedId={templateId} onSelect={setTemplateId} />
        )}
      </section>

      <section className={styles.card}>
        <h2>
          <span className={styles.stepNum}>2</span>بيانات الدعوة
        </h2>
        <div className={styles.field}>
          <span>لغة الدعوة</span>
          <div className={styles.langSwitch} role="radiogroup" aria-label="لغة الدعوة">
            <button type="button" role="radio" aria-checked={lang === "ar"} className={styles.tab} onClick={() => setLang("ar")}>
              عربي
            </button>
            <button type="button" role="radio" aria-checked={lang === "en"} className={styles.tab} onClick={() => setLang("en")}>
              English
            </button>
          </div>
        </div>
        <div className={styles.row}>
          <label className={styles.field}>
            <span>{lang === "ar" ? "اسم العريس" : "First name (e.g. groom)"}</span>
            <input value={partnerA} onChange={(e) => setPartnerA(e.target.value)} maxLength={40} required />
          </label>
          <label className={styles.field}>
            <span>{lang === "ar" ? "اسم العروسة" : "Second name (e.g. bride)"}</span>
            <input value={partnerB} onChange={(e) => setPartnerB(e.target.value)} maxLength={40} required />
          </label>
        </div>
        <label className={styles.field}>
          <span>التاريخ والساعة (بتوقيت مصر)</span>
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <div className={styles.row}>
          <label className={styles.field}>
            <span>اسم المكان</span>
            <input value={venueName} onChange={(e) => setVenueName(e.target.value)} maxLength={80} required placeholder="قاعة..." />
          </label>
          <label className={styles.field}>
            <span>العنوان (اختياري)</span>
            <input value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} maxLength={120} />
          </label>
        </div>
        <p className={styles.hint}>صيغة الدعوة وأسامي المعازيم بتكتبهم من صفحتك بعد الخطوة دي.</p>
      </section>

      <section className={styles.card}>
        <h2>
          <span className={styles.stepNum}>3</span>الباقة والإضافات
        </h2>
        <OrderOptions
          pricing={pricing}
          packageId={packageId}
          addons={addons}
          lang={lang}
          onChange={(n) => {
            setPackageId(n.packageId);
            setAddons(n.addons);
          }}
          music={music}
          musicTrackId={musicTrackId}
          onMusicChange={setMusicTrackId}
          mapsUrl={mapsUrl}
          onMapsUrlChange={setMapsUrl}
        />
      </section>

      <section className={styles.card}>
        <h2>
          <span className={styles.stepNum}>4</span>بياناتك
        </h2>
        <div className={styles.row}>
          <label className={styles.field}>
            <span>اسمك</span>
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} maxLength={60} required autoComplete="name" />
          </label>
          <label className={styles.field}>
            <span>رقم الواتساب</span>
            <input
              type="tel"
              dir="ltr"
              inputMode="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              required
              autoComplete="tel"
              placeholder="01xxxxxxxxx"
            />
          </label>
        </div>
        <p className={styles.hint}>هتاخد لينك صفحتك الخاصة: منها تشوف الدعوة، تضيف المعازيم، وتدفع. احفظه عندك.</p>
      </section>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.bottomBar}>
        <div className={styles.bottomBarInner}>
          <div>
            <small className={styles.hint}>الإجمالي</small>
            <br />
            <strong>{formatEgp(total)}</strong>
          </div>
          <button className={styles.cta} type="submit" disabled={busy || !templateId}>
            {busy ? "ثانية..." : "اعمل الدعوة وشوفها"}
          </button>
        </div>
      </div>
    </form>
  );
}
