"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Languages,
  X,
} from "lucide-react";
import styles from "./store.module.css";
import OrderOptions from "./OrderOptions";
import TemplateGallery from "./TemplateGallery";
import {
  EditorialDatePicker,
  EditorialSelect,
  type EditorialSelectOption,
} from "./EditorialControls";
import {
  CEREMONY_TIMES,
  DETAIL_ERRORS_BY_LANG,
  STORE_COPY,
  formatStorePrice,
} from "./storeCopy";
import { useSiteLang } from "@/lib/site-lang";
import { isSelfServe, priceOf, type Pricing } from "@/lib/pricing";
import { TEMPLATE_EDITORIAL_META, templateDisplayName } from "@/lib/templates";
import { UploadError, postJson } from "@/lib/upload-client";
import type { Lang, MusicTrack, PackageId, Template } from "@/lib/types";

interface Props {
  pricing: Pricing;
  templates: Template[];
  music: MusicTrack[];
  initialTemplateId?: string;
  initialPackageId?: PackageId;
}

/** Kept exported for backward compatibility with RequestForm / manage panels. */
export const DETAIL_ERRORS: Record<string, string> = DETAIL_ERRORS_BY_LANG.en;

function looksLikeMapLink(raw: string): boolean {
  const s = raw.trim();
  if (!s) return true; // Always optional
  return /(google\.[a-z.]+|maps\.google\.|maps\.app\.goo\.gl|goo\.gl\/maps|g\.co|share\.google|maps\.apple\.com|waze\.com)/i.test(
    s
  );
}

/**
 * Editorial floating split studio builder (fully bilingual EN / native Arabic):
 * Left card: 3-step guided setup -> creates real draft via POST /api/orders.
 * Right card: Frameless live couture invitation preview updating in real time.
 */
export default function Builder({
  pricing,
  templates,
  music,
  initialTemplateId,
  initialPackageId,
}: Props) {
  const { lang: uiLang, toggleLang } = useSiteLang();
  const isUiAr = uiLang === "ar";
  const copy = STORE_COPY[uiLang];
  const b = copy.builder;
  const errors = DETAIL_ERRORS_BY_LANG[uiLang];

  const onSale = pricing.packages
    .filter((p) => p.active && isSelfServe(p.id))
    .map((p) => p.id);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [templateId, setTemplateId] = useState(
    templates.some((t) => t.id === initialTemplateId)
      ? initialTemplateId!
      : templates[0]?.id ?? ""
  );
  const [inviteLang, setInviteLang] = useState<Lang>("ar");
  const [partnerA, setPartnerA] = useState("");
  const [partnerB, setPartnerB] = useState("");
  const [datePart, setDatePart] = useState("");
  const [timePart, setTimePart] = useState("19:00");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [packageId, setPackageId] = useState<PackageId>(
    initialPackageId && onSale.includes(initialPackageId)
      ? initialPackageId
      : onSale[0] ?? 1
  );
  const [musicTrackId, setMusicTrackId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [busy, setBusy] = useState(false);

  const ceremonyTimeOptions = useMemo<EditorialSelectOption[]>(
    () =>
      CEREMONY_TIMES.map((item) => ({
        value: item.value,
        label: isUiAr ? item.labelAr : item.labelEn,
        sublabel: isUiAr ? item.subAr : item.subEn,
      })),
    [isUiAr]
  );

  const combinedDate = datePart ? `${datePart}T${timePart || "19:00"}` : "";
  const total = priceOf(pricing, packageId);
  const activeIndex = Math.max(
    0,
    templates.findIndex((t) => t.id === templateId)
  );
  const activeTemplate = templates[activeIndex] ?? templates[0];
  const activeMeta = activeTemplate
    ? TEMPLATE_EDITORIAL_META[activeTemplate.id]
    : undefined;
  const activeTemplateTitle = activeTemplate
    ? templateDisplayName(activeTemplate, uiLang)
    : b.fallbackDesignName;
  const activeTemplateDesc = activeMeta
    ? isUiAr
      ? activeMeta.taglineAr
      : activeMeta.taglineEn
    : b.fallbackDesignDesc;

  const errorText = errorCode ? errors[errorCode] ?? errors.failed : "";

  const cycleTemplate = (delta: -1 | 1) => {
    if (templates.length === 0) return;
    const next = (activeIndex + delta + templates.length) % templates.length;
    setTemplateId(templates[next].id);
  };

  function validateStep(current: 1 | 2 | 3): boolean {
    setErrorCode("");
    if (current === 1) {
      if (!partnerA.trim() || !partnerB.trim()) {
        setErrorCode("names_required");
        return false;
      }
      if (!datePart) {
        setErrorCode("date_invalid");
        return false;
      }
      if (!venueName.trim()) {
        setErrorCode("venue_required");
        return false;
      }
      if (mapsUrl.trim() && !looksLikeMapLink(mapsUrl)) {
        setErrorCode("maps_invalid");
        return false;
      }
    }
    if (current === 2 && !templateId) {
      setErrorCode("invalid_template");
      return false;
    }
    return true;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErrorCode("");
    setBusy(true);
    try {
      const { manageToken } = await postJson<{ manageToken: string }>(
        "/api/orders",
        {
          templateId,
          lang: inviteLang,
          partnerA,
          partnerB,
          date: combinedDate,
          venueName,
          venueAddress,
          mapsUrl: mapsUrl.trim(),
          packageId,
          musicTrackId: packageId >= 2 ? musicTrackId : "",
          clientName,
          clientPhone,
        }
      );
      window.location.href = `/c/${manageToken}?new=1`;
    } catch (err) {
      const code = err instanceof UploadError ? err.code : "failed";
      setErrorCode(code);
      setBusy(false);
    }
  }

  const previewDateLabel = (() => {
    if (!combinedDate) {
      return inviteLang === "ar"
        ? "١٤ فبراير ٢٠٢٧ · ٧:٠٠ م"
        : "February 14, 2027 · 7:00 PM";
    }
    const d = new Date(combinedDate);
    if (Number.isNaN(d.getTime())) return combinedDate;
    return new Intl.DateTimeFormat(inviteLang === "ar" ? "ar-EG" : "en-US", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  })();

  const displayPartnerA =
    partnerA.trim() || (inviteLang === "ar" ? "أحمد" : "Ahmed");
  const displayPartnerB =
    partnerB.trim() || (inviteLang === "ar" ? "سارة" : "Sara");
  const displayVenue =
    venueName.trim() ||
    (inviteLang === "ar"
      ? "قاعة الماسة · القاهرة الجديدة"
      : "The Grand Conservatory · New Cairo");

  return (
    <div className={styles.studioGrid} dir={isUiAr ? "rtl" : "ltr"} lang={uiLang}>
      {/* LEFT CARD: Guided 3-Step Studio Form */}
      <form className={styles.studioCard} onSubmit={submit}>
        <div className={styles.studioCardTop}>
          <div>
            <h1 className={styles.studioTitle}>{b.titles[step]}</h1>
            <p className={styles.studioSubtitle}>{b.subtitles[step]}</p>
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

        {/* 3-Segment Slim Progress Bar */}
        <div className={styles.stepProgress} aria-hidden="true">
          {[1, 2, 3].map((s) => (
            <div key={s} className={styles.stepBar}>
              <div
                className={styles.stepBarFill}
                style={{ width: step >= s ? "100%" : "0%" }}
              />
            </div>
          ))}
        </div>

        <div className={styles.studioBody}>
          {step === 1 && (
            <>
              {/* Full-Width Architectural Hairline Bilingual Invitation Language Switcher */}
              <div className={styles.field}>
                <span>{b.inviteLangLabel}</span>
                <div
                  className={styles.editorialLangBar}
                  role="radiogroup"
                  aria-label={b.inviteLangLabel}
                  data-selected={inviteLang}
                  dir="ltr"
                >
                  <span
                    aria-hidden="true"
                    className={styles.editorialLangIndicator}
                  />
                  <button
                    type="button"
                    role="radio"
                    aria-checked={inviteLang === "ar"}
                    className={`${styles.editorialLangBtn} ${
                      inviteLang === "ar" ? styles.editorialLangBtnActive : ""
                    }`}
                    onClick={() => setInviteLang("ar")}
                  >
                    <span className={styles.editorialLangCode}>AR</span>
                    <span className={styles.editorialLangNameAr}>العربية</span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={inviteLang === "en"}
                    className={`${styles.editorialLangBtn} ${
                      inviteLang === "en" ? styles.editorialLangBtnActive : ""
                    }`}
                    onClick={() => setInviteLang("en")}
                  >
                    <span className={styles.editorialLangCode}>EN</span>
                    <span className={styles.editorialLangNameEn}>English</span>
                  </button>
                </div>
              </div>

              <div className={styles.row}>
                <label className={styles.field}>
                  <span>{b.partnerOneLabel}</span>
                  <input
                    dir="auto"
                    value={partnerA}
                    onChange={(e) => setPartnerA(e.target.value)}
                    placeholder={inviteLang === "ar" ? "أحمد" : "Ahmed"}
                    maxLength={60}
                    required
                  />
                </label>
                <label className={styles.field}>
                  <span>{b.partnerTwoLabel}</span>
                  <input
                    dir="auto"
                    value={partnerB}
                    onChange={(e) => setPartnerB(e.target.value)}
                    placeholder={inviteLang === "ar" ? "سارة" : "Sara"}
                    maxLength={60}
                    required
                  />
                </label>
              </div>

              {/* Custom Luxury Date Picker & Ceremony Time Dropdown */}
              <div className={styles.row}>
                <div className={styles.field}>
                  <span>{b.dateLabel}</span>
                  <EditorialDatePicker
                    value={datePart}
                    onChange={(next) => {
                      setDatePart(next);
                      if (errorCode) setErrorCode("");
                    }}
                    placeholder={b.datePlaceholder}
                    ariaLabel={b.dateLabel}
                    locale={uiLang}
                  />
                </div>
                <div className={styles.field}>
                  <span>{b.timeLabel}</span>
                  <EditorialSelect
                    value={timePart}
                    onChange={setTimePart}
                    options={ceremonyTimeOptions}
                    placeholder={b.timePlaceholder}
                    ariaLabel={b.timeLabel}
                    dir={isUiAr ? "rtl" : "ltr"}
                    icon={<Clock size={15} strokeWidth={1.5} aria-hidden="true" />}
                  />
                </div>
              </div>

              <div className={styles.row}>
                <label className={styles.field}>
                  <span>{b.venueLabel}</span>
                  <input
                    dir="auto"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder={
                      inviteLang === "ar" ? "قاعة الماسة" : "The Garden Hall"
                    }
                    maxLength={80}
                    required
                  />
                </label>
                <label className={styles.field}>
                  <span>{b.addressLabel}</span>
                  <input
                    dir="auto"
                    value={venueAddress}
                    onChange={(e) => setVenueAddress(e.target.value)}
                    placeholder={
                      inviteLang === "ar" ? "القاهرة الجديدة" : "New Cairo"
                    }
                    maxLength={120}
                  />
                </label>
              </div>

              <label className={styles.field}>
                <span className={styles.fieldLabelRow}>
                  <span>{b.mapsLabel}</span>
                  {mapsUrl.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setMapsUrl("");
                        if (errorCode === "maps_invalid") setErrorCode("");
                      }}
                      className={styles.fieldClearLink}
                    >
                      {b.clear}
                    </button>
                  )}
                </span>
                <input
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  dir="ltr"
                  value={mapsUrl}
                  onChange={(e) => {
                    setMapsUrl(e.target.value);
                    if (errorCode === "maps_invalid") setErrorCode("");
                  }}
                  placeholder={b.mapsPlaceholder}
                />
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <TemplateGallery
                templates={templates}
                selectedId={templateId}
                onSelect={setTemplateId}
              />

              <OrderOptions
                pricing={pricing}
                packageId={packageId}
                onPackageChange={setPackageId}
                music={music}
                musicTrackId={musicTrackId}
                onMusicChange={setMusicTrackId}
              />
            </>
          )}

          {step === 3 && (
            <>
              <div className={styles.row}>
                <label className={styles.field}>
                  <span>{b.yourNameLabel}</span>
                  <input
                    dir="auto"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder={b.yourNamePlaceholder}
                    maxLength={60}
                    required
                  />
                </label>
                <label className={styles.field}>
                  <span>{b.whatsappLabel}</span>
                  <input
                    type="tel"
                    dir="ltr"
                    inputMode="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    required
                  />
                </label>
              </div>

              <div className={styles.total}>
                <span>
                  {activeTemplateTitle} · {b.totalNote}
                </span>
                <strong>{formatStorePrice(total, uiLang)}</strong>
              </div>

              <p className={styles.hint}>
                {b.bespokePrompt}{" "}
                <Link
                  href="/request?p=3"
                  style={{
                    textDecoration: "underline",
                    color: "var(--accent-bronze)",
                  }}
                >
                  {b.bespokeLink}
                </Link>
              </p>
            </>
          )}

          {errorText && (
            <div className={styles.error} role="alert">
              <span>{errorText}</span>
              {errorCode === "maps_invalid" && mapsUrl.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setMapsUrl("");
                    setErrorCode("");
                  }}
                  className={styles.errorQuickAction}
                >
                  {b.skipOptionalLink}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <div className={styles.studioFooterRow}>
          {step > 1 ? (
            <button
              type="button"
              className={styles.ctaGhost}
              onClick={() => {
                setErrorCode("");
                setStep((prev) => (prev === 3 ? 2 : 1));
              }}
            >
              {b.back}
            </button>
          ) : (
            <Link href="/" className={styles.ctaGhost}>
              {b.back}
            </Link>
          )}

          {step < 3 ? (
            <button
              type="button"
              className={styles.cta}
              onClick={() => {
                if (validateStep(step)) {
                  setStep(step === 1 ? 2 : 3);
                }
              }}
            >
              {b.continueBtn}
            </button>
          ) : (
            <button type="submit" className={styles.cta} disabled={busy}>
              {busy ? b.submitting : b.submit}
            </button>
          )}
        </div>
      </form>

      {/* RIGHT CARD: Frameless Real-Time Couture Preview */}
      <aside
        className={styles.studioCard}
        aria-label={isUiAr ? "معاينة الدعوة" : "Live invitation preview"}
      >
        <h2 className={styles.studioTitle}>{b.previewTitle}</h2>

        {/* Architectural Editorial Step Rail */}
        <ol
          className={styles.previewEditorialRail}
          aria-label={isUiAr ? "خطوات التصميم" : "Studio steps"}
        >
          <span
            aria-hidden="true"
            className={styles.previewRailProgress}
            style={{ width: `${(step / 3) * 100}%` }}
          />
          {b.steps.map((st, idx) => {
            const stepNum = idx + 1;
            const isCurrent = step === stepNum;
            const isDone = step > stepNum;
            return (
              <li
                key={st.num}
                className={`${styles.previewRailItem} ${
                  isCurrent ? styles.previewRailItemActive : ""
                } ${isDone ? styles.previewRailItemDone : ""}`}
              >
                <span className={styles.previewRailRoman} aria-hidden="true">
                  {st.num}
                </span>
                <span className={styles.previewRailLabel}>{st.label}</span>
              </li>
            );
          })}
        </ol>

        {/* Clean Frameless Invitation Stage */}
        <div className={styles.previewStageWrap}>
          <div
            className={styles.previewCanvas}
            style={{
              backgroundColor: activeTemplate?.theme.background ?? "#29231f",
            }}
          >
            {activeTemplate?.posterUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeTemplate.posterUrl}
                alt=""
                className={styles.previewCanvasMedia}
              />
            )}
            <div className={styles.previewCanvasScrim} />

            <div
              className={styles.previewInviteCard}
              dir={inviteLang === "ar" ? "rtl" : "ltr"}
            >
              <p
                className={`${styles.previewInviteEyebrow} ${
                  inviteLang === "ar" ? styles.previewInviteEyebrowAr : ""
                }`}
              >
                {inviteLang === "ar"
                  ? "يسعدنا حضوركم"
                  : "TOGETHER WITH THEIR FAMILIES"}
              </p>
              <p
                className={`${styles.previewInviteCouple} ${
                  inviteLang === "ar" ? styles.previewInviteCoupleAr : ""
                }`}
              >
                {displayPartnerA} {inviteLang === "ar" ? "و" : "&"}{" "}
                {displayPartnerB}
              </p>
              <span aria-hidden="true" className={styles.previewInviteDivider} />
              <p className={styles.previewInviteMeta}>
                {previewDateLabel}
                <br />
                {displayVenue}
                {venueAddress.trim() ? ` · ${venueAddress.trim()}` : ""}
              </p>

              {/* Sleek Matte Espresso Editorial Preview Button */}
              {activeTemplate ? (
                <Link
                  href={`/t/${activeTemplate.id}`}
                  target="_blank"
                  className={styles.previewOpenBtn}
                >
                  <span
                    className={
                      inviteLang === "ar"
                        ? styles.previewOpenLabelAr
                        : styles.previewOpenLabelEn
                    }
                  >
                    {inviteLang === "ar" ? "افتح الدعوة" : "Open invitation"}
                  </span>
                  <ArrowUpRight
                    size={13}
                    strokeWidth={1.7}
                    aria-hidden="true"
                    className={styles.previewOpenArrow}
                  />
                </Link>
              ) : (
                <span className={styles.previewOpenBtn}>
                  <span
                    className={
                      inviteLang === "ar"
                        ? styles.previewOpenLabelAr
                        : styles.previewOpenLabelEn
                    }
                  >
                    {inviteLang === "ar" ? "افتح الدعوة" : "Open invitation"}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.previewMetaBar}>
          <div>
            <p className={styles.previewDesignName}>{activeTemplateTitle}</p>
            <p className={styles.previewDesignDesc}>{activeTemplateDesc}</p>
          </div>

          <div className={styles.previewCtrlPill}>
            <button
              type="button"
              aria-label={b.prevThemeAria}
              onClick={() => cycleTemplate(-1)}
              className={styles.previewCtrlBtn}
            >
              {isUiAr ? (
                <ChevronRight size={16} strokeWidth={1.8} />
              ) : (
                <ChevronLeft size={16} strokeWidth={1.8} />
              )}
            </button>
            {activeTemplate && (
              <Link
                href={`/t/${activeTemplate.id}`}
                target="_blank"
                aria-label={b.openDemoAria}
                title={b.openDemoAria}
                className={styles.previewCtrlBtn}
              >
                <ArrowUpRight size={16} strokeWidth={1.8} />
              </Link>
            )}
            <button
              type="button"
              aria-label={b.nextThemeAria}
              onClick={() => cycleTemplate(1)}
              className={styles.previewCtrlBtn}
            >
              {isUiAr ? (
                <ChevronLeft size={16} strokeWidth={1.8} />
              ) : (
                <ChevronRight size={16} strokeWidth={1.8} />
              )}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
