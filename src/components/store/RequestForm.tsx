"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Languages, Sparkles, X } from "lucide-react";
import styles from "./store.module.css";
import { EditorialDatePicker, EditorialSelect } from "./EditorialControls";
import {
  CATEGORY_COPY,
  DETAIL_ERRORS_BY_LANG,
  STORE_COPY,
  formatStorePrice,
  packageDisplayName,
  packageDisplayPoints,
} from "./storeCopy";
import { useSiteLang } from "@/lib/site-lang";
import type { PackageInfo } from "@/lib/pricing";
import { sampleLink } from "@/lib/samples";
import { CATEGORY_LABELS, type Category, type PackageId } from "@/lib/types";
import { UploadError, postJson } from "@/lib/upload-client";

/** Packages 3-4: Bespoke concierge request studio (bilingual EN / native Arabic). */
export default function RequestForm({
  pkg,
  whatsappUrl,
}: {
  pkg: PackageInfo;
  whatsappUrl: string;
}) {
  const { lang, toggleLang } = useSiteLang();
  const isAr = lang === "ar";
  const copy = STORE_COPY[lang];
  const r = copy.request;
  const errors = DETAIL_ERRORS_BY_LANG[lang];

  const packageId: PackageId = pkg.id;
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [category, setCategory] = useState<Category>("wedding");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const errorText = errorCode ? errors[errorCode] ?? errors.failed : "";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErrorCode("");
    setBusy(true);
    try {
      await postJson("/api/requests", {
        packageId,
        clientName,
        clientPhone,
        category,
        date,
        notes,
      });
      setSent(true);
    } catch (err) {
      setErrorCode(err instanceof UploadError ? err.code : "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.studioGrid} dir={isAr ? "rtl" : "ltr"} lang={lang}>
      {/* Left Card: Concierge Brief Form */}
      <div className={styles.studioCard}>
        <div className={styles.studioCardTop}>
          <div>
            <h1 className={styles.studioTitle}>
              {sent ? r.sentTitle : r.title}
            </h1>
            <p className={styles.studioSubtitle}>
              {sent ? r.sentSubtitle(clientPhone) : r.subtitle}
            </p>
          </div>
          <div className={styles.studioTopControls}>
            <button
              type="button"
              onClick={toggleLang}
              aria-label={copy.switchLangAria}
              className={styles.studioLangBtn}
            >
              <Languages size={14} strokeWidth={1.7} aria-hidden="true" />
              <span>{copy.switchLangTitle}</span>
            </button>
            <Link
              href="/"
              aria-label={copy.backHomeAria}
              className={styles.studioCloseBtn}
            >
              <X size={16} strokeWidth={1.8} />
            </Link>
          </div>
        </div>

        {sent ? (
          <div className={styles.success} role="status">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--bg-sand)",
                color: "var(--accent-bronze)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check size={22} />
            </div>
            <p className={styles.hint}>{r.loggedFor(clientName)}</p>
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {whatsappUrl && (
                <a
                  className={styles.cta}
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {r.chatWhatsapp}
                  <ArrowUpRight size={15} />
                </a>
              )}
              <Link href="/" className={styles.ctaGhost}>
                {r.returnHome}
              </Link>
            </div>
          </div>
        ) : (
          <form
            className={styles.studioBody}
            onSubmit={submit}
            style={{ marginTop: "1.5rem" }}
          >
            <div className={styles.row}>
              <label className={styles.field}>
                <span>{r.yourName}</span>
                <input
                  dir="auto"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  maxLength={60}
                  required
                  placeholder={r.yourNamePlaceholder}
                />
              </label>
              <label className={styles.field}>
                <span>{r.whatsapp}</span>
                <input
                  type="tel"
                  dir="ltr"
                  inputMode="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  required
                  placeholder="01xxxxxxxxx"
                />
              </label>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <span>{r.celebrationType}</span>
                <EditorialSelect
                  value={category}
                  onChange={(val) => setCategory(val as Category)}
                  ariaLabel={r.celebrationType}
                  dir={isAr ? "rtl" : "ltr"}
                  icon={<Sparkles size={15} strokeWidth={1.5} aria-hidden="true" />}
                  options={(Object.keys(CATEGORY_LABELS) as Category[]).map(
                    (c) => ({
                      value: c,
                      label: CATEGORY_COPY[lang][c],
                      sublabel: isAr
                        ? CATEGORY_COPY.en[c]
                        : CATEGORY_LABELS[c],
                    })
                  )}
                />
              </div>
              <div className={styles.field}>
                <span>{r.targetDate}</span>
                <EditorialDatePicker
                  value={date}
                  onChange={setDate}
                  placeholder={r.targetDatePlaceholder}
                  ariaLabel={r.targetDate}
                  locale={lang}
                  clearable
                />
              </div>
            </div>

            <label className={styles.field}>
              <span>{r.aestheticLabel}</span>
              <textarea
                dir="auto"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={2000}
                placeholder={r.aestheticPlaceholder}
              />
            </label>

            {errorText && (
              <p className={styles.error} role="alert">
                {errorText}
              </p>
            )}

            <div className={styles.studioFooterRow}>
              <Link href="/" className={styles.ctaGhost}>
                {r.back}
              </Link>
              <button className={styles.cta} type="submit" disabled={busy}>
                {busy ? r.submitting : r.submit}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Right Card: Suite Highlights & Live Sample */}
      <aside className={styles.studioCard}>
        <p className={styles.sampleEyebrow}>
          {r.bespokeTierPrefix} ·{" "}
          {formatStorePrice(pkg.price, lang, pkg.priceNote)}
        </p>
        <h2 className={styles.studioTitle} style={{ marginTop: "0.45rem" }}>
          {packageDisplayName(pkg, lang)}
        </h2>
        <p className={styles.studioSubtitle}>{r.asideDesc}</p>

        <ul className={styles.samplePoints} style={{ marginTop: "1.5rem" }}>
          {packageDisplayPoints(pkg, lang).map((pt) => (
            <li key={pt}>{pt}</li>
          ))}
        </ul>

        <div
          className={styles.previewStageWrap}
          style={{ marginTop: "1.75rem", minHeight: "16rem" }}
        >
          <div className={styles.previewCanvas} style={{ minHeight: "16rem" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/showcase/alhambra-end.jpg"
              alt=""
              className={styles.previewCanvasMedia}
            />
            <div className={styles.previewCanvasScrim} />
            <div className={styles.previewInviteCard}>
              <p
                className={`${styles.previewInviteEyebrow} ${
                  isAr ? styles.previewInviteEyebrowAr : ""
                }`}
              >
                {r.liveSampleEyebrow}
              </p>
              <p
                className={`${styles.previewInviteCouple} ${
                  isAr ? styles.previewInviteCoupleAr : ""
                }`}
              >
                {r.liveSampleCouple}
              </p>
              <p className={styles.previewInviteMeta}>{r.liveSampleMeta}</p>
              <a
                href={sampleLink(packageId)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.previewOpenBtn}
              >
                <span
                  className={
                    isAr
                      ? styles.previewOpenLabelAr
                      : styles.previewOpenLabelEn
                  }
                >
                  {r.openLiveSample}
                </span>
                <ArrowUpRight
                  size={13}
                  strokeWidth={1.7}
                  aria-hidden="true"
                  className={styles.previewOpenArrow}
                />
              </a>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
