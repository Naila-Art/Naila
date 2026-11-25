"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Music, Pause, Play, Search, VolumeX, X } from "lucide-react";
import styles from "./store.module.css";
import { STORE_COPY } from "./storeCopy";
import { MUSIC_MOODS, MUSIC_MOOD_LABELS, musicParts } from "@/lib/music-catalog";
import type { Lang, MusicMood, MusicTrack } from "@/lib/types";

interface TrackPreviewStripProps {
  track: MusicTrack | null | undefined;
  lang: Lang;
  label: string;
  sublabel?: string;
}

function SoundBars({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={styles.soundBars} data-inverse={inverse || undefined} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

/** Architectural concert-programme strip for auditioning a preselected soundtrack. */
export function TrackPreviewStrip({ track, lang, label, sublabel }: TrackPreviewStripProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setPlaying(false);
    setProgress(0);
  }, [track?.url]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
    };
  }, []);

  if (!track) return null;

  const { title, composer } = musicParts(track, lang);
  const moodLabel = track.mood ? MUSIC_MOOD_LABELS[track.mood][lang] : undefined;
  const subParts = [composer, sublabel].filter(Boolean);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.volume = 0.7;
      audio.play().catch(() => undefined);
      setPlaying(true);
    }
  };

  return (
    <div
      className={styles.musicStrip}
      data-playing={playing}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <audio
        ref={audioRef}
        src={track.url}
        preload="none"
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          if (el.duration > 0) setProgress(Math.min(1, el.currentTime / el.duration));
        }}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
      />

      <button
        type="button"
        className={styles.musicPlayBtn}
        data-playing={playing}
        data-keep-autoscroll="true"
        onClick={toggle}
        aria-label={playing ? (lang === "ar" ? "إيقاف المقطوعة" : "Pause track") : (lang === "ar" ? "استماع للمقطوعة" : "Audition track")}
      >
        {playing ? <Pause size={15} strokeWidth={1.8} /> : <Play size={15} strokeWidth={1.8} />}
      </button>

      <div className={styles.musicStripMeta}>
        <span className={styles.musicStripProvenance}>
          <span>{label}</span>
          {moodLabel && (
            <>
              <span className={styles.musicStripProvenanceDot} aria-hidden="true">
                ·
              </span>
              <span>{moodLabel}</span>
            </>
          )}
          {playing && <SoundBars />}
        </span>
        <strong className={styles.musicStripTitle}>{title}</strong>
        {subParts.length > 0 && (
          <small className={styles.musicStripSub}>{subParts.join(" · ")}</small>
        )}
      </div>

      {playing && (
        <span className={styles.musicProgressTrack} aria-hidden="true">
          <span
            className={styles.musicProgressFill}
            style={{ transform: `scaleX(${progress})` }}
          />
        </span>
      )}
    </div>
  );
}

interface MusicPickerProps {
  tracks: MusicTrack[];
  /**
   * Selected value:
   * - `""` = template default (in "empty" mode)
   * - `"none"` = explicitly no music
   * - `track.id` = specific track
   */
  value: string;
  onChange: (trackId: string) => void;
  defaultTrackId?: string;
  lang: Lang;
  variant?: "light" | "dark";
  /**
   * `"empty"` stores `""` when the template's signature track is chosen (used in `/create` & `/order`).
   * `"id"` stores `defaultTrackId` explicitly (used in `/t/[id]` preview dock).
   */
  defaultValueMode?: "empty" | "id";
}

/** Editorial concert-programme music picker with minimalist search, italic mood index & live auditioning. */
export function MusicPicker({
  tracks,
  value,
  onChange,
  defaultTrackId,
  lang,
  variant = "light",
  defaultValueMode = "empty",
}: MusicPickerProps) {
  const isAr = lang === "ar";
  const optCopy = STORE_COPY[lang].options;
  const [query, setQuery] = useState("");
  const [mood, setMood] = useState<MusicMood | "all" | "custom">("all");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
    };
  }, []);

  const customCount = useMemo(() => tracks.filter((t) => !t.builtIn).length, [tracks]);
  const moodItems = useMemo(
    () =>
      MUSIC_MOODS.map((m) => ({
        id: m,
        count: tracks.filter((t) => t.mood === m).length,
      })).filter((m) => m.count > 0),
    [tracks],
  );

  const defaultTrack = useMemo(
    () =>
      defaultTrackId && defaultTrackId !== "none"
        ? tracks.find((t) => t.id === defaultTrackId) ?? null
        : null,
    [tracks, defaultTrackId],
  );

  const effectiveSelectedId =
    value === "none" ? "none" : value || (defaultTrack ? defaultTrack.id : "");

  const filteredTracks = useMemo(() => {
    const trimmed = query.trim();
    const q = trimmed.toLowerCase();
    return tracks.filter((t) => {
      if (mood === "custom") {
        if (t.builtIn) return false;
      } else if (mood !== "all") {
        if (t.mood !== mood) return false;
      }
      if (!q) return true;
      const moodEn = t.mood ? MUSIC_MOOD_LABELS[t.mood].en.toLowerCase() : "";
      const moodAr = t.mood ? MUSIC_MOOD_LABELS[t.mood].ar : "";
      return (
        t.name.toLowerCase().includes(q) ||
        (t.nameAr?.includes(trimmed) ?? false) ||
        moodEn.includes(q) ||
        moodAr.includes(trimmed)
      );
    });
  }, [tracks, mood, query]);

  const toggleAudition = (track: MusicTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playingId === track.id) {
      audio.pause();
      setPlayingId(null);
      setProgress(0);
      return;
    }
    setProgress(0);
    audio.src = track.url;
    audio.volume = 0.72;
    audio.play().catch(() => undefined);
    setPlayingId(track.id);
  };

  const stopAudition = () => {
    audioRef.current?.pause();
    setPlayingId(null);
    setProgress(0);
  };

  const selectTrack = (nextValue: string) => {
    stopAudition();
    onChange(nextValue);
  };

  const pickTrack = (id: string) => {
    if (defaultValueMode === "empty" && defaultTrack && id === defaultTrack.id) {
      selectTrack("");
    } else {
      selectTrack(id);
    }
  };

  const pickDefaultValue = defaultValueMode === "empty" ? "" : (defaultTrack?.id ?? "");
  const isDefaultSelected =
    Boolean(defaultTrack) &&
    (value === "" || (defaultValueMode === "id" && value === defaultTrack?.id));

  const renderTrackRow = (track: MusicTrack, opts: { isSignature?: boolean; selected: boolean; onSelect: () => void }) => {
    const playing = playingId === track.id;
    const { title, composer } = musicParts(track, lang);
    const moodLabel = track.mood ? MUSIC_MOOD_LABELS[track.mood][lang] : optCopy.curatedTrackSub;

    return (
      <div
        key={opts.isSignature ? `sig-${track.id}` : track.id}
        className={styles.musicRow}
        data-selected={opts.selected}
        data-playing={playing}
      >
        <button
          type="button"
          className={styles.musicPlayBtn}
          data-playing={playing}
          data-keep-autoscroll="true"
          onClick={() => toggleAudition(track)}
          aria-label={playing ? (isAr ? "إيقاف" : "Pause") : (isAr ? "تشغيل" : "Play")}
        >
          {playing ? <Pause size={13} strokeWidth={1.9} /> : <Play size={13} strokeWidth={1.9} />}
        </button>

        <button
          type="button"
          role="option"
          aria-selected={opts.selected}
          className={styles.musicRowSelect}
          onClick={opts.onSelect}
        >
          <span className={styles.musicRowMeta}>
            <strong className={styles.musicRowTitle}>{title}</strong>
            <small className={styles.musicRowSub}>
              {composer && <span className={styles.musicRowComposer}>{composer}</span>}
              {composer && <span aria-hidden="true">·</span>}
              <span>{moodLabel}</span>
              {playing && <SoundBars inverse={variant === "dark"} />}
            </small>
          </span>

          <span className={styles.musicRowTrail}>
            {opts.isSignature && (
              <span className={styles.musicSignatureStamp}>
                <i className={styles.musicSignatureDiamond} aria-hidden="true" />
                {isAr ? "موسيقى التصميم" : "Signature"}
              </span>
            )}
            {opts.selected && (
              <span className={styles.musicSelectedMark} aria-hidden="true">
                <Check size={12} strokeWidth={2.4} />
              </span>
            )}
          </span>
        </button>

        {playing && (
          <span className={styles.musicProgressTrack} aria-hidden="true">
            <span
              className={styles.musicProgressFill}
              style={{ transform: `scaleX(${progress})` }}
            />
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={styles.musicPicker} data-variant={variant} dir={isAr ? "rtl" : "ltr"}>
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          if (el.duration > 0) setProgress(Math.min(1, el.currentTime / el.duration));
        }}
        onEnded={() => {
          setPlayingId(null);
          setProgress(0);
        }}
      />

      <div className={styles.musicSearchRow}>
        <Search size={14} strokeWidth={1.7} className={styles.musicSearchIcon} aria-hidden="true" />
        <input
          type="search"
          className={styles.musicSearchInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isAr ? "ابحثي باسم المقطوعة أو المؤلف..." : "Search pieces or composers…"}
          aria-label={isAr ? "بحث في مكتبة الموسيقى" : "Search music library"}
        />
        {query && (
          <button
            type="button"
            className={styles.musicSearchClear}
            onClick={() => setQuery("")}
            aria-label={isAr ? "مسح البحث" : "Clear search"}
          >
            <X size={13} strokeWidth={1.8} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className={styles.musicMoodIndex} role="group" aria-label={isAr ? "تصفية حسب الطابع" : "Filter by mood"}>
        <button
          type="button"
          className={styles.musicMoodTab}
          aria-pressed={mood === "all"}
          onClick={() => setMood("all")}
        >
          <span>{isAr ? "الكل" : "All"}</span>
          <span className={styles.musicMoodCount}>{tracks.length}</span>
        </button>
        {customCount > 0 && (
          <button
            type="button"
            className={styles.musicMoodTab}
            aria-pressed={mood === "custom"}
            onClick={() => setMood("custom")}
          >
            <span>{isAr ? "مختارات الاستوديو" : "Studio Picks"}</span>
            <span className={styles.musicMoodCount}>{customCount}</span>
          </button>
        )}
        {moodItems.map((m) => (
          <button
            key={m.id}
            type="button"
            className={styles.musicMoodTab}
            aria-pressed={mood === m.id}
            onClick={() => setMood(m.id)}
          >
            <span>{MUSIC_MOOD_LABELS[m.id][lang]}</span>
            <span className={styles.musicMoodCount}>{m.count}</span>
          </button>
        ))}
      </div>

      <div className={styles.musicList} role="listbox" aria-label={isAr ? "المقطوعات المتاحة" : "Available soundtracks"}>
        {defaultTrack &&
          !query.trim() &&
          mood === "all" &&
          renderTrackRow(defaultTrack, {
            isSignature: true,
            selected: isDefaultSelected,
            onSelect: () => selectTrack(pickDefaultValue),
          })}

        {!query.trim() && (
          <div className={styles.musicRow} data-selected={value === "none"}>
            <span className={styles.musicSilentMedallion} aria-hidden="true">
              <VolumeX size={14} strokeWidth={1.6} />
            </span>
            <button
              type="button"
              role="option"
              aria-selected={value === "none"}
              className={styles.musicRowSelect}
              onClick={() => selectTrack("none")}
            >
              <span className={styles.musicRowMeta}>
                <strong className={styles.musicRowTitle}>{optCopy.noMusicLabel}</strong>
                <small className={styles.musicRowSub}>{optCopy.noMusicSub}</small>
              </span>
              <span className={styles.musicRowTrail}>
                {value === "none" && (
                  <span className={styles.musicSelectedMark} aria-hidden="true">
                    <Check size={12} strokeWidth={2.4} />
                  </span>
                )}
              </span>
            </button>
          </div>
        )}

        {filteredTracks.length === 0 ? (
          <div className={styles.musicEmptyState}>
            <Music size={20} strokeWidth={1.3} aria-hidden="true" />
            <p>{isAr ? "لا توجد مقطوعات مطابقة لبحثك." : "No pieces match that search."}</p>
            {(query.trim() || mood !== "all") && (
              <button
                type="button"
                className={styles.musicEmptyReset}
                onClick={() => {
                  setQuery("");
                  setMood("all");
                }}
              >
                {isAr ? "عرض كل المقطوعات" : "Reset search"}
              </button>
            )}
          </div>
        ) : (
          filteredTracks.map((track) => {
            if (!query.trim() && mood === "all" && defaultTrack?.id === track.id) return null;
            return renderTrackRow(track, {
              selected: effectiveSelectedId === track.id,
              onSelect: () => pickTrack(track.id),
            });
          })
        )}
      </div>
    </div>
  );
}
