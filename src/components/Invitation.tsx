"use client";
/* eslint-disable @next/next/no-img-element -- decorative template artwork straight from storage, no optimisation needed */

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./invitation.module.css";
import Countdown from "./Countdown";
import WishForm from "./WishForm";
import RsvpForm from "./RsvpForm";
import type { Strings } from "@/lib/i18n";
import type { Lang, Template } from "@/lib/types";
import Icon from "./Icon";

export interface InvitationProps {
  slug: string;
  token?: string;
  lang: Lang;
  strings: Strings;
  template: Template;
  partnerA: string;
  partnerB: string;
  greeting: string;
  isNamed: boolean;
  dateIso: string;
  dateLabel: string;
  timeLabel: string;
  venueName: string;
  venueAddress?: string;
  mapsUrl?: string;
  musicUrl?: string;
  calendarUrl: string;
  /** Package 2+ only. */
  showWishes?: boolean;
  /** Attendance replies (package 2+, when the client turned them on). */
  showRsvp?: boolean;
  /** A personal note written for this guest only (packages 3-4). */
  personalMessage?: string;
  /** Draft (not paid yet): ribbon on top, replies off. */
  isPreview?: boolean;
}

type Stage = "sealed" | "opening" | "open";

/** Length of the CSS envelope animation; keep in sync with invitation.module.css. */
const CSS_OPEN_MS = 2200;
/** Safety net in case a video never fires `ended`. */
const VIDEO_MAX_MS = 15000;

export default function Invitation(props: InvitationProps) {
  const { strings: s, template, lang } = props;
  const [stage, setStage] = useState<Stage>("sealed");
  const [muted, setMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const finishOpening = useCallback(() => {
    clearTimeout(timerRef.current);
    setStage("open");
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Lock scrolling until the invitation is opened.
  useEffect(() => {
    document.body.style.overflow = stage === "open" ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [stage]);

  const open = () => {
    if (stage !== "sealed") return;
    setStage("opening");

    // The tap is the user gesture that lets the browser start music.
    audioRef.current?.play().catch(() => undefined);

    // Count the open only now (not on page load), so link-preview bots don't count as "opened".
    fetch(`/api/invitations/${encodeURIComponent(props.slug)}/open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: props.token }),
      keepalive: true,
    }).catch(() => undefined);

    const video = videoRef.current;
    if (video) {
      video.play().catch(finishOpening);
      timerRef.current = setTimeout(finishOpening, VIDEO_MAX_MS);
    } else {
      timerRef.current = setTimeout(finishOpening, CSS_OPEN_MS);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  };

  const themeVars = {
    "--bg": template.theme.background,
    "--surface": template.theme.surface,
    "--text": template.theme.text,
    "--accent": template.theme.accent,
    "--seal": template.theme.seal,
  } as CSSProperties;

  const art = template.art ?? {};
  // Decorative only: empty alt, and they never catch taps.
  const corners = art.corner ? (
    <>
      <img className={`${styles.artCorner} ${styles.artCornerStart}`} src={art.corner} alt="" aria-hidden />
      <img className={`${styles.artCorner} ${styles.artCornerEnd}`} src={art.corner} alt="" aria-hidden />
    </>
  ) : null;

  const couple = (
    <h1 className={styles.couple}>
      <span>{props.partnerA}</span>
      <span className={styles.amp}>{s.and}</span>
      <span>{props.partnerB}</span>
    </h1>
  );

  return (
    <main className={styles.page} style={themeVars} dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      {props.isPreview && (
        <>
          <div className={styles.previewRibbon}>{s.previewRibbon}</div>
          {/* Covers the whole screen (video, names, everything) so screenshots and screen recordings can't pass for the real thing. */}
          <div className={styles.watermark} aria-hidden />
        </>
      )}
      <div className={styles.column}>
        {/* ---------- Opening (fades away once the letter takes over) ---------- */}
        <section className={styles.hero} data-stage={stage} aria-hidden={stage === "open"}>
          {template.videoUrl ? (
            <video
              ref={videoRef}
              className={styles.video}
              src={template.videoUrl}
              poster={template.posterUrl}
              muted
              playsInline
              preload="auto"
              onEnded={finishOpening}
            />
          ) : (
            <div className={styles.envelope} aria-hidden>
              <div className={styles.envBack} />
              <div className={styles.envCard}>
                <span className={styles.envCardMark}>{props.partnerA.charAt(0)} · {props.partnerB.charAt(0)}</span>
              </div>
              <div className={styles.envPocket} />
              <div className={styles.envFlap} />
              <div className={styles.seal}>
                {props.partnerA.charAt(0)}
                {props.partnerB.charAt(0)}
              </div>
            </div>
          )}

          {/* Text layer over the animation — always visible, per the design rules. */}
          <div className={styles.heroText}>
            {couple}
            <p className={styles.heroDate}>{props.dateLabel}</p>
          </div>

          {stage === "sealed" && (
            <button type="button" className={styles.tapTarget} onClick={open} aria-label={s.tapToOpen}>
              <span className={styles.tapHint}>{s.tapToOpen}</span>
            </button>
          )}
        </section>

        {/* ---------- The letter: the card that came out of the envelope grows to full screen ---------- */}
        {stage === "open" && (
          <article className={styles.letter}>
            <header className={styles.letterHead}>
              {art.top && <img className={styles.artTop} src={art.top} alt="" aria-hidden />}
              <p className={props.isNamed ? styles.greetingNamed : styles.greeting}>{props.greeting}</p>
              {props.personalMessage && <p className={styles.personalMessage}>{props.personalMessage}</p>}
              <div className={styles.divider} />
              {couple}
              <div className={styles.divider} />
              <p className={styles.when}>
                {props.dateLabel}
                <br />
                {props.timeLabel}
              </p>
              <p className={styles.where}>{props.venueName}</p>
            </header>

            <section className={`${styles.card} ${styles.reveal}`} data-art={art.corner ? "corner" : undefined}>
              {corners}
              <h2 className={styles.sectionTitle}>{s.countdown}</h2>
              <Countdown dateIso={props.dateIso} strings={s} />
              <a className={styles.linkButton} href={props.calendarUrl} target="_blank" rel="noopener noreferrer">
                {s.addToCalendar}
              </a>
            </section>

            {props.showRsvp && (
              <section className={`${styles.card} ${styles.reveal}`} data-art={art.corner ? "corner" : undefined}>
                {corners}
                <h2 className={styles.sectionTitle}>{s.rsvpTitle}</h2>
                {props.isPreview ? (
                  <p className={styles.muted}>{s.previewNoReplies}</p>
                ) : (
                  <RsvpForm slug={props.slug} token={props.token} strings={s} />
                )}
              </section>
            )}

            {props.showWishes !== false && (
              <section className={`${styles.card} ${styles.reveal}`} data-art={art.corner ? "corner" : undefined}>
              {corners}
                <h2 className={styles.sectionTitle}>{s.wishesTitle}</h2>
                {props.isPreview ? (
                  <p className={styles.muted}>{s.previewNoReplies}</p>
                ) : (
                  <WishForm slug={props.slug} token={props.token} strings={s} />
                )}
              </section>
            )}

            {/* Location comes last, per the design rules. */}
            <section className={`${styles.card} ${styles.reveal}`} data-art={art.corner ? "corner" : undefined}>
              {corners}
              <h2 className={styles.sectionTitle}>{s.location}</h2>
              <p className={styles.where}>{props.venueName}</p>
              {props.venueAddress && <p className={styles.muted}>{props.venueAddress}</p>}
              {props.mapsUrl && (
                <a className={styles.primaryButton} href={props.mapsUrl} target="_blank" rel="noopener noreferrer">
                  {s.openMaps}
                </a>
              )}
            </section>
            {art.bottom && <img className={styles.artBottom} src={art.bottom} alt="" aria-hidden />}
          </article>
        )}
      </div>

      {props.musicUrl && (
        <>
          <audio ref={audioRef} src={props.musicUrl} loop preload="auto" />
          {stage !== "sealed" && (
            <button type="button" className={styles.mute} onClick={toggleMute} aria-label={muted ? s.unmute : s.mute}>
              <Icon name={muted ? "volumeOff" : "volume"} size={20} />
            </button>
          )}
        </>
      )}
    </main>
  );
}
