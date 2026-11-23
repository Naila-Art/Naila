"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { CalendarPlus, MapPin, Volume2, VolumeX } from "lucide-react";
import styles from "./doors.module.css";
import Countdown from "../Countdown";
import RsvpForm from "../RsvpForm";
import WishForm from "../WishForm";
import type { InvitationProps } from "../Invitation";
import { TIME_ZONE } from "@/lib/time";

/**
 * Doors & Arches family.
 *
 * 1. Threshold: the first frame of the opening (closed doors) with a brass medallion to tap.
 * 2. Opening: the video plays with its own sound; the names appear in the sky once the doors
 *    are open, mirrored in the water below.
 * 3. The letter: an ivory panel with an arched crown rises over the scene, which stays
 *    behind it for the whole read.
 */

type Stage = "sealed" | "opening" | "revealed";

const DEFAULT_REVEAL_MS = 3800;
/** Safety net in case a video never plays or never ends. */
const VIDEO_MAX_MS = 12000;
const MUSIC_VOLUME = 0.55;
const MUSIC_FADE_MS = 2400;

function dateParts(iso: string, lang: "ar" | "en") {
  const d = new Date(iso);
  const locale = lang === "ar" ? "ar-EG" : "en-GB";
  const part = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...opts, timeZone: TIME_ZONE }).format(d);
  return {
    weekday: part({ weekday: "long" }),
    day: part({ day: "numeric" }),
    monthYear: part({ month: "long", year: "numeric" }),
    time: part({ hour: "numeric", minute: "2-digit" }),
  };
}

/** Eight-point Andalusian star (two overlapped squares). */
function Khatam({ className, size = 14 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="-10 -10 20 20" aria-hidden>
      <rect x="-6" y="-6" width="12" height="12" />
      <rect x="-6" y="-6" width="12" height="12" transform="rotate(45)" />
    </svg>
  );
}

/** A thin brass rule with a star at its centre — the section separator. */
function Rule() {
  return (
    <div className={styles.rule} aria-hidden>
      <span />
      <Khatam className={styles.ruleStar} />
      <span />
    </div>
  );
}

function Medallion({ initials }: { initials: string }) {
  return (
    <svg className={styles.medallion} viewBox="-60 -60 120 120" aria-hidden>
      <g className={styles.medallionStar}>
        <rect x="-38" y="-38" width="76" height="76" />
        <rect x="-38" y="-38" width="76" height="76" transform="rotate(45)" />
      </g>
      <circle r="30" className={styles.medallionDisc} />
      <circle r="26" className={styles.medallionRing} />
      <text className={styles.medallionText} textAnchor="middle" dominantBaseline="central">
        {initials}
      </text>
    </svg>
  );
}

export default function DoorsInvitation(props: InvitationProps) {
  const { strings: s, template, lang } = props;
  const isAr = lang === "ar";
  const [stage, setStage] = useState<Stage>("sealed");
  const [videoDone, setVideoDone] = useState(false);
  const [muted, setMuted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fadeRef = useRef<number>(undefined);
  const revealAt = template.revealAtMs ?? DEFAULT_REVEAL_MS;
  const parts = useMemo(() => dateParts(props.dateIso, lang), [props.dateIso, lang]);
  const initials = `${props.partnerA.trim().charAt(0)}${isAr ? " " : "·"}${props.partnerB.trim().charAt(0)}`;

  // Scrolling stays locked until the names are on screen.
  useEffect(() => {
    document.body.style.overflow = stage === "revealed" ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [stage]);

  // The scroll cue bows out as soon as the guest starts reading.
  useEffect(() => {
    if (stage !== "revealed") return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [stage]);

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      if (fadeRef.current) cancelAnimationFrame(fadeRef.current);
    },
    [],
  );

  const startMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0;
    audio.play().catch(() => undefined);
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / MUSIC_FADE_MS);
      audio.volume = MUSIC_VOLUME * k * k;
      if (k < 1) fadeRef.current = requestAnimationFrame(step);
    };
    fadeRef.current = requestAnimationFrame(step);
  }, []);

  const reveal = useCallback(() => {
    setStage((st) => {
      if (st === "revealed") return st;
      startMusic();
      return "revealed";
    });
  }, [startMusic]);

  const open = () => {
    if (stage !== "sealed") return;
    setStage("opening");

    // Music must be unlocked inside the tap itself (iOS); it starts silent and fades in at the reveal.
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0;
      audio.play().then(() => audio.pause()).catch(() => undefined);
    }

    fetch(`/api/invitations/${encodeURIComponent(props.slug)}/open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: props.token }),
      keepalive: true,
    }).catch(() => undefined);

    const video = videoRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!video || reduced) {
      setVideoDone(true);
      reveal();
      return;
    }
    video.muted = muted;
    video.play().catch(() => {
      setVideoDone(true);
      reveal();
    });
    timerRef.current = setTimeout(() => {
      setVideoDone(true);
      reveal();
    }, VIDEO_MAX_MS);
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (v && stage === "opening" && v.currentTime * 1000 >= revealAt) reveal();
  };

  const onEnded = () => {
    clearTimeout(timerRef.current);
    setVideoDone(true);
    reveal();
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (audioRef.current) audioRef.current.muted = next;
    if (videoRef.current) videoRef.current.muted = next;
  };

  const scene = template.scene ?? {};
  const themeVars = {
    "--bg": template.theme.background,
    "--surface": template.theme.surface,
    "--text": template.theme.text,
    "--accent": template.theme.accent,
    "--seal": template.theme.seal,
    "--ambient": template.ambientUrl ? `url("${template.ambientUrl}")` : "none",
    ...(scene.skyTop != null && { "--sky-top": `${scene.skyTop}%` }),
    ...(scene.skyWidth != null && { "--sky-width": `${scene.skyWidth}%` }),
    ...(scene.reflectionTop != null && { "--reflection-top": `${scene.reflectionTop}%` }),
    ...(scene.ink && { "--scene-ink": scene.ink }),
  } as CSSProperties;

  const names = (
    <>
      <span>{props.partnerA}</span>
      <span className={styles.amp}>{s.and}</span>
      <span>{props.partnerB}</span>
    </>
  );

  const hasMusic = Boolean(props.musicUrl);
  const showSound = stage !== "sealed" && (hasMusic || Boolean(template.videoUrl));

  return (
    <main className={styles.page} style={themeVars} dir={isAr ? "rtl" : "ltr"} lang={lang} data-lang={lang}>
      {props.isPreview && <div className={styles.previewRibbon}>{s.previewRibbon}</div>}

      <div className={styles.column}>
        {/* ---------------- The scene: stays behind the letter for the whole read ---------------- */}
        <section
          className={styles.scene}
          data-stage={stage}
          data-done={videoDone || undefined}
          data-scrolled={scrolled || undefined}
          data-reflection={scene.reflectionTop === null ? "off" : undefined}
        >
          {template.endPosterUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.sceneEnd} src={template.endPosterUrl} alt="" />
          )}
          {template.videoUrl && (
            <video
              ref={videoRef}
              className={styles.sceneVideo}
              src={template.videoUrl}
              poster={template.posterUrl}
              playsInline
              muted
              preload="auto"
              onTimeUpdate={onTimeUpdate}
              onEnded={onEnded}
            />
          )}
          <div className={styles.veil} />

          {/* Threshold */}
          <div className={styles.threshold} aria-hidden={stage !== "sealed"}>
            {props.isNamed && <p className={styles.thresholdGreeting}>{props.greeting}</p>}
            <button type="button" className={styles.knock} onClick={open} disabled={stage !== "sealed"}>
              <Medallion initials={initials} />
              <span className={styles.knockLabel}>{s.openTheDoors}</span>
            </button>
          </div>

          {/* Names in the sky, mirrored in the pool */}
          <div className={styles.sky} aria-hidden={stage !== "revealed"}>
            <h1 className={styles.skyNames}>{names}</h1>
            <p className={styles.skyDate}>
              {parts.weekday} · {parts.day} {parts.monthYear}
            </p>
          </div>
          <div className={styles.reflection} aria-hidden>
            <p className={styles.reflectionNames}>{names}</p>
          </div>

          <div className={styles.scrollCue} aria-hidden>
            <span>{s.scrollDown}</span>
            <i />
          </div>
        </section>

        {/* ---------------- The letter ---------------- */}
        <article className={styles.letter} aria-hidden={stage !== "revealed"}>
          <svg className={styles.crown} viewBox="0 0 400 72" preserveAspectRatio="none" aria-hidden>
            <path className={styles.crownFill} d="M0 72 V40 C96 38 150 30 178 12 Q200 -2 222 12 C250 30 304 38 400 40 V72 Z" />
            <path className={styles.crownLine} d="M14 52 C108 50 156 42 182 25 Q200 13 218 25 C244 42 292 50 386 52" />
          </svg>

          <div className={styles.sheet}>
            <header className={styles.opening}>
              <Khatam className={styles.openingStar} size={22} />
              <p className={props.isNamed ? styles.greetingNamed : styles.greeting}>{props.greeting}</p>
              {props.personalMessage && <p className={styles.personal}>{props.personalMessage}</p>}
              <h2 className={styles.names}>{names}</h2>

              <div className={styles.date}>
                <span className={styles.dateWeekday}>{parts.weekday}</span>
                <span className={styles.dateDay}>{parts.day}</span>
                <span className={styles.dateMonth}>{parts.monthYear}</span>
                <span className={styles.dateTime}>
                  {s.at} {parts.time}
                </span>
              </div>
              <p className={styles.venue}>{props.venueName}</p>
            </header>

            <Rule />

            <section className={styles.block}>
              <h2 className={styles.heading}>{s.countdown}</h2>
              <Countdown
                dateIso={props.dateIso}
                strings={s}
                ui={{ countdown: styles.countdown, unit: styles.unit, unitValue: styles.unitValue, unitLabel: styles.unitLabel, where: styles.venue }}
              />
              <a className={styles.quietLink} href={props.calendarUrl} target="_blank" rel="noopener noreferrer">
                <CalendarPlus size={16} strokeWidth={1.5} aria-hidden />
                {s.addToCalendar}
              </a>
            </section>

            {props.schedule && props.schedule.length > 0 && (
              <>
                <Rule />
                <section className={styles.block}>
                  <h2 className={styles.heading}>{s.theEvening}</h2>
                  <ol className={styles.timeline}>
                    {props.schedule.map((item, i) => (
                      <li key={`${item.time}-${i}`} className={styles.moment}>
                        <span className={styles.momentTime}>{item.time}</span>
                        <Khatam className={styles.momentStar} size={12} />
                        <span className={styles.momentLabel}>{item.label}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              </>
            )}

            {(props.dressCode || props.notes) && (
              <>
                <Rule />
                <section className={`${styles.block} ${styles.details}`}>
                  {props.dressCode && (
                    <div className={styles.detail}>
                      <h2 className={styles.heading}>{s.dressCode}</h2>
                      <p className={styles.detailValue}>{props.dressCode}</p>
                    </div>
                  )}
                  {props.notes && (
                    <div className={styles.detail}>
                      <h2 className={styles.heading}>{s.goodToKnow}</h2>
                      <p className={styles.detailText}>{props.notes}</p>
                    </div>
                  )}
                </section>
              </>
            )}

            <Rule />

            <section className={styles.block}>
              <h2 className={styles.heading}>{s.rsvpTitle}</h2>
              {props.isPreview ? (
                <p className={styles.muted}>{s.previewNoReplies}</p>
              ) : (
                <RsvpForm slug={props.slug} token={props.token} strings={s} initial={props.initialRsvp} ui={formUi} />
              )}
            </section>

            {props.showWishes !== false && (
              <>
                <Rule />
                <section className={styles.block}>
                  <h2 className={styles.heading}>{s.wishesTitle}</h2>
                  {props.isPreview ? (
                    <p className={styles.muted}>{s.previewNoReplies}</p>
                  ) : (
                    <WishForm slug={props.slug} token={props.token} strings={s} ui={formUi} />
                  )}
                </section>
              </>
            )}

            <Rule />

            {/* Location comes last, per the design rules. */}
            <section className={styles.block}>
              <h2 className={styles.heading}>{s.location}</h2>
              <p className={styles.venueLarge}>{props.venueName}</p>
              {props.venueAddress && <p className={styles.muted}>{props.venueAddress}</p>}
              {props.mapsUrl && (
                <a className={styles.archButton} href={props.mapsUrl} target="_blank" rel="noopener noreferrer">
                  <MapPin size={17} strokeWidth={1.5} aria-hidden />
                  {s.openMaps}
                </a>
              )}
            </section>
          </div>

          <svg className={styles.base} viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden>
            <path className={styles.crownFill} d="M0 0 H400 V12 C304 14 250 22 222 34 Q200 42 178 34 C150 22 96 14 0 12 Z" />
          </svg>
        </article>

        {/* ---------------- Farewell over the courtyard ---------------- */}
        <footer className={styles.farewell} aria-hidden={stage !== "revealed"}>
          <p className={styles.farewellLove}>{s.withLove}</p>
          <p className={styles.farewellNames}>{names}</p>
        </footer>
      </div>

      {(hasMusic || template.videoUrl) && (
        <>
          {hasMusic && <audio ref={audioRef} src={props.musicUrl} loop preload="auto" />}
          {showSound && (
            <button type="button" className={styles.sound} onClick={toggleMute} aria-label={muted ? s.unmute : s.mute} aria-pressed={muted}>
              {muted ? <VolumeX size={18} strokeWidth={1.5} /> : <Volume2 size={18} strokeWidth={1.5} />}
            </button>
          )}
        </>
      )}
    </main>
  );
}

/** Shared form components, dressed in this family's stylesheet. */
const formUi = {
  form: styles.form,
  input: styles.input,
  textarea: styles.textarea,
  rsvpButtons: styles.rsvpButtons,
  primaryButton: styles.archButton,
  secondaryButton: styles.outlineButton,
  textButton: styles.textButton,
  formDone: styles.formDone,
  error: styles.error,
};
