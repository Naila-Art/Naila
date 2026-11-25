"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Languages, Music, X } from "lucide-react";
import styles from "./store.module.css";
import { MusicPicker } from "./MusicPicker";
import { STORE_COPY } from "./storeCopy";
import { useSiteLang } from "@/lib/site-lang";
import { templateDisplayName } from "@/lib/templates";
import { musicParts } from "@/lib/music-catalog";
import type { MusicTrack, Template } from "@/lib/types";
import { localeHref } from "@/lib/locale";

interface DockProps {
  template: Template;
  music?: MusicTrack[];
  defaultTrackId?: string;
  selectedTrackId?: string;
  onSelectTrack?: (trackId: string) => void;
}

export default function TemplatePreviewDock({
  template,
  music = [],
  defaultTrackId = "",
  selectedTrackId = "",
  onSelectTrack,
}: DockProps) {
  const { lang, toggleLang } = useSiteLang();
  const isAr = lang === "ar";
  const copy = STORE_COPY[lang];
  const title = templateDisplayName(template, lang);
  const [pickerOpen, setPickerOpen] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPickerOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target) || triggerBtnRef.current?.contains(target)) {
        return;
      }
      setPickerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [pickerOpen]);

  const activeTrack =
    selectedTrackId && selectedTrackId !== "none"
      ? music.find((m) => m.id === selectedTrackId)
      : undefined;

  const isCustomized = Boolean(selectedTrackId && selectedTrackId !== defaultTrackId);
  const pairingTitle =
    selectedTrackId === "none"
      ? copy.options.noMusicLabel
      : activeTrack
        ? musicParts(activeTrack, lang).title
        : "";

  const createQuery =
    selectedTrackId && selectedTrackId !== defaultTrackId
      ? `/create?t=${template.id}&m=${encodeURIComponent(selectedTrackId)}`
      : `/create?t=${template.id}`;

  return (
    <>
      {pickerOpen && onSelectTrack && (
        <div
          ref={popoverRef}
          dir={isAr ? "rtl" : "ltr"}
          className={styles.previewDockPopover}
          data-keep-autoscroll="true"
          role="dialog"
          aria-label={copy.previewDock.musicPickerTitle}
        >
          <div className={styles.previewDockPopoverHead}>
            <div className={styles.previewDockPopoverHeadText}>
              <strong className={styles.previewDockPopoverTitle}>
                {copy.previewDock.musicPickerTitle}
              </strong>
              {pairingTitle && (
                <span className={styles.previewDockPopoverPairing}>
                  {isAr ? `اللحن الحالي: ${pairingTitle}` : `Now paired: ${pairingTitle}`}
                </span>
              )}
              <small className={styles.previewDockPopoverHint}>
                {copy.previewDock.musicPickerHint}
              </small>
            </div>
            <button
              type="button"
              className={styles.previewDockClose}
              onClick={() => setPickerOpen(false)}
              aria-label={copy.previewDock.closePickerAria}
            >
              <X size={15} strokeWidth={1.7} />
            </button>
          </div>
          <div className={styles.previewDockDivider} aria-hidden="true" />
          <MusicPicker
            tracks={music}
            value={selectedTrackId}
            onChange={onSelectTrack}
            defaultTrackId={defaultTrackId}
            lang={lang}
            variant="dark"
            defaultValueMode="id"
          />
        </div>
      )}

      <div
        dir={isAr ? "rtl" : "ltr"}
        className={styles.previewDockBar}
        data-keep-autoscroll="true"
      >
        <Link href={localeHref(lang, "/#templates")} className={styles.previewDockLink}>
          {isAr ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{copy.previewDock.templates}</span>
        </Link>

        {music.length > 0 && onSelectTrack && (
          <button
            ref={triggerBtnRef}
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            aria-expanded={pickerOpen}
            data-customized={isCustomized || undefined}
            className={styles.previewDockPillBtn}
            title={pairingTitle || copy.previewDock.musicBtn}
          >
            <Music size={13} strokeWidth={1.7} aria-hidden="true" />
            <span>{copy.previewDock.musicBtn}</span>
            {isCustomized && <span className={styles.previewDockCustomDot} aria-hidden="true" />}
          </button>
        )}

        <button
          type="button"
          onClick={toggleLang}
          aria-label={copy.switchLangAria}
          className={styles.previewDockPillBtn}
        >
          <Languages size={13} strokeWidth={1.7} aria-hidden="true" />
          <span>{copy.switchLangTitle}</span>
        </button>

        <Link href={localeHref(lang, createQuery)} className={styles.previewDockCta}>
          <span className={styles.previewDockCtaText}>
            {copy.previewDock.usePrefix} {title}
          </span>
          <ArrowUpRight size={14} style={{ flexShrink: 0 }} />
        </Link>
      </div>
    </>
  );
}
