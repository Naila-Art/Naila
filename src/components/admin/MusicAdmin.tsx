"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ChevronDown,
  Disc3,
  ExternalLink,
  FileMusic,
  Library,
  Pause,
  Play,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import m from "../manage/manage.module.css";
import a from "./admin.module.css";
import { templateDisplayName } from "@/lib/templates";
import { CATEGORY_COPY } from "@/components/store/storeCopy";
import { MUSIC_MOODS, MUSIC_MOOD_LABELS, musicParts } from "@/lib/music-catalog";
import type { Category, MusicMood, MusicTrack, Template } from "@/lib/types";
import { UPLOAD_ERRORS, UploadError, contentTypeOf, postJson, putFile } from "@/lib/upload-client";

interface Props {
  initialTracks: MusicTrack[];
  templates: Template[];
  initialAssignments: Record<string, string>;
  initialOverrides: Record<string, string>;
}

type AdminTab = "assignments" | "library";

const CATEGORY_LABELS = CATEGORY_COPY.ar;

const CATEGORY_FILTER: { id: Category | "all"; label: string }[] = [
  { id: "all", label: CATEGORY_LABELS.all },
  { id: "wedding", label: CATEGORY_LABELS.wedding },
  { id: "engagement", label: CATEGORY_LABELS.engagement },
  { id: "katb_kitab", label: CATEGORY_LABELS.katb_kitab },
];

/** Renders grouped <optgroup> choices shared by template dropdowns and the bulk-assign bar. */
function TrackSelectOptions({
  customTracks,
  builtInByMood,
  includeResetDefault,
}: {
  customTracks: MusicTrack[];
  builtInByMood: { mood: MusicMood; tracks: MusicTrack[] }[];
  includeResetDefault?: boolean;
}) {
  return (
    <>
      <option value="none">بدون موسيقى (دخول صامت)</option>
      {includeResetDefault && <option value="__default__">إعادة للمقطوعة الافتراضية</option>}
      {customTracks.length > 0 && (
        <optgroup label="مختارات الاستوديو المرفوعة">
          {customTracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nameAr ? `${t.nameAr} — ${t.name}` : t.name}
            </option>
          ))}
        </optgroup>
      )}
      {builtInByMood.map(({ mood, tracks }) =>
        tracks.length > 0 ? (
          <optgroup key={mood} label={MUSIC_MOOD_LABELS[mood].ar}>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nameAr ? `${t.nameAr} — ${t.name}` : t.name}
              </option>
            ))}
          </optgroup>
        ) : null,
      )}
    </>
  );
}

function AdminSoundBars() {
  return (
    <span className={a.adminSoundBars} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

/**
 * Admin Music Studio:
 *   1. Live per-template soundtrack assignments (updates storefront previews & Package 1 instantly).
 *   2. Full music library (custom MP3/M4A uploads + 50 curated commercial-cleared tracks).
 */
export default function MusicAdmin({
  initialTracks,
  templates,
  initialAssignments,
  initialOverrides,
}: Props) {
  const api = `/api/admin/music`;

  const [tab, setTab] = useState<AdminTab>("assignments");
  const [tracks, setTracks] = useState(initialTracks);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [overrides, setOverrides] = useState(initialOverrides);

  // Audio player shared across both tabs.
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [nowPlayingMeta, setNowPlayingMeta] = useState<{
    track: MusicTrack;
    contextLabel?: string;
  } | null>(null);
  const [playProgress, setPlayProgress] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
    };
  }, []);

  const stopPlayback = () => {
    audioRef.current?.pause();
    setPlayingKey(null);
    setNowPlayingMeta(null);
    setPlayProgress(0);
  };

  const togglePlay = (key: string, track?: MusicTrack, contextLabel?: string) => {
    const audio = audioRef.current;
    if (!audio || !track?.url) return;
    if (playingKey === key) {
      stopPlayback();
      return;
    }
    setPlayProgress(0);
    audio.src = track.url;
    audio.volume = 0.75;
    audio.play().catch(() => undefined);
    setPlayingKey(key);
    setNowPlayingMeta({ track, contextLabel });
  };

  const trackById = useMemo(() => new Map(tracks.map((t) => [t.id, t])), [tracks]);
  const customTracks = useMemo(() => tracks.filter((t) => !t.builtIn), [tracks]);
  const builtInTracks = useMemo(() => tracks.filter((t) => t.builtIn), [tracks]);
  const builtInByMood = useMemo(
    () => MUSIC_MOODS.map((mood) => ({ mood, tracks: builtInTracks.filter((t) => t.mood === mood) })),
    [builtInTracks],
  );

  // Summary counts.
  const { assignedTemplateCount, overrideCount, usageCounts } = useMemo(() => {
    const counts = new Map<string, number>();
    let paired = 0;
    for (const tpl of templates) {
      const tid = assignments[tpl.id];
      if (tid && tid !== "none") {
        paired++;
        counts.set(tid, (counts.get(tid) ?? 0) + 1);
      }
    }
    return {
      assignedTemplateCount: paired,
      overrideCount: Object.keys(overrides).length,
      usageCounts: counts,
    };
  }, [templates, assignments, overrides]);

  // ---------------- Tab 1: Per-template assignments ----------------
  const [tplQuery, setTplQuery] = useState("");
  const [tplCat, setTplCat] = useState<Category | "all">("all");
  const [bulkTrackId, setBulkTrackId] = useState<string>(tracks[0]?.id ?? "none");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMsg, setBulkMsg] = useState("");
  const [rowStatus, setRowStatus] = useState<Record<string, "saving" | "saved" | "error">>({});

  const categoryCounts = useMemo(
    () => ({
      all: templates.length,
      wedding: templates.filter((t) => t.category === "wedding").length,
      engagement: templates.filter((t) => t.category === "engagement").length,
      katb_kitab: templates.filter((t) => t.category === "katb_kitab").length,
    }),
    [templates],
  );

  const filteredTemplates = useMemo(() => {
    const q = tplQuery.trim().toLowerCase();
    return templates.filter((t) => {
      if (tplCat !== "all" && t.category !== tplCat) return false;
      if (!q) return true;
      const ar = templateDisplayName(t, "ar");
      const en = templateDisplayName(t, "en").toLowerCase();
      return t.id.toLowerCase().includes(q) || en.includes(q) || ar.includes(tplQuery.trim());
    });
  }, [templates, tplCat, tplQuery]);

  async function assignTemplate(templateId: string, trackId: string) {
    setRowStatus((s) => ({ ...s, [templateId]: "saving" }));
    try {
      const res = await postJson<{ assignments: Record<string, string>; overrides: Record<string, string> }>(
        api,
        { templateId, trackId },
        "PUT",
      );
      setAssignments(res.assignments);
      setOverrides(res.overrides);
      setRowStatus((s) => ({ ...s, [templateId]: "saved" }));
    } catch {
      setRowStatus((s) => ({ ...s, [templateId]: "error" }));
    }
  }

  async function applyBulk() {
    if (filteredTemplates.length === 0 || !bulkTrackId) return;
    const label =
      bulkTrackId === "__default__"
        ? "المقطوعة الافتراضية لكل تصميم"
        : bulkTrackId === "none"
          ? "بدون موسيقى"
          : (trackById.get(bulkTrackId)?.name ?? bulkTrackId);
    if (!confirm(`تطبيق "${label}" على ${filteredTemplates.length} تصميم؟`)) return;

    setBulkBusy(true);
    setBulkMsg("");
    try {
      const patch = Object.fromEntries(filteredTemplates.map((t) => [t.id, bulkTrackId]));
      const res = await postJson<{ assignments: Record<string, string>; overrides: Record<string, string> }>(
        api,
        { assignments: patch },
        "PUT",
      );
      setAssignments(res.assignments);
      setOverrides(res.overrides);
      setBulkMsg(`تم تحديث ${filteredTemplates.length} تصميم.`);
    } catch {
      setBulkMsg("مقدرناش نحفظ التحديث الجماعي. جرب تاني.");
    } finally {
      setBulkBusy(false);
    }
  }

  // ---------------- Tab 2: Upload + Library ----------------
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [mood, setMood] = useState<MusicMood>("oriental");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [libQuery, setLibQuery] = useState("");
  const [libMood, setLibMood] = useState<MusicMood | "all">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredBuiltIn = useMemo(() => {
    const q = libQuery.trim().toLowerCase();
    return builtInTracks.filter((t) => {
      if (libMood !== "all" && t.mood !== libMood) return false;
      if (!q) return true;
      return t.name.toLowerCase().includes(q) || (t.nameAr?.includes(libQuery.trim()) ?? false);
    });
  }, [builtInTracks, libMood, libQuery]);

  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file || !name.trim()) return;
    const form = e.currentTarget;
    setError("");
    setProgress(0);
    try {
      const contentType = contentTypeOf(file);
      const slot = await postJson<{ objectKey: string; uploadUrl: string }>(api, {
        step: "slot",
        contentType,
        size: file.size,
      });
      await putFile(slot.uploadUrl, file, contentType, (loaded) =>
        setProgress(Math.round((loaded / file.size) * 100)),
      );
      const { track } = await postJson<{ track: MusicTrack }>(api, {
        step: "save",
        name: name.trim(),
        nameAr: nameAr.trim() || undefined,
        mood,
        objectKey: slot.objectKey,
      });
      setTracks((t) => [track, ...t]);
      setName("");
      setNameAr("");
      setFile(null);
      form.reset();
    } catch (err) {
      setError(UPLOAD_ERRORS[err instanceof UploadError ? err.code : "failed"] ?? UPLOAD_ERRORS.failed);
    } finally {
      setProgress(null);
    }
  }

  async function remove(t: MusicTrack) {
    if (!confirm(`تمسح "${t.name}"؟ أي تصميم مختارها هيرجع للافتراضي أو يبقى من غير موسيقى.`)) return;
    const res = await fetch(`${api}?id=${encodeURIComponent(t.id)}`, { method: "DELETE" });
    if (res.ok) {
      if (playingKey === t.id || nowPlayingMeta?.track.id === t.id) {
        stopPlayback();
      }
      setTracks((list) => list.filter((x) => x.id !== t.id));
      try {
        const refreshed = await fetch(api);
        if (refreshed.ok) {
          const data = (await refreshed.json()) as {
            assignments: Record<string, string>;
            overrides: Record<string, string>;
          };
          setAssignments(data.assignments);
          setOverrides(data.overrides);
        }
      } catch {}
    }
  }

  const nowAr = nowPlayingMeta ? musicParts(nowPlayingMeta.track, "ar") : null;
  const nowEn = nowPlayingMeta ? musicParts(nowPlayingMeta.track, "en") : null;

  return (
    <main className={`${m.page} ${a.wide}`} dir="rtl" lang="ar">
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          if (el.duration > 0) setPlayProgress(Math.min(1, el.currentTime / el.duration));
        }}
        onEnded={stopPlayback}
      />

      <header className={a.pageHead}>
        <h1 className={a.musicStudioHeading}>استوديو الموسيقى</h1>
        <p className={m.hint}>
          تحكّم في المقطوعة الافتراضية لكل تصميم عند فتح الدعوة، أو ارفع ألحاناً جديدة إلى مكتبة نايلة مع نشر فوري على الموقع.
        </p>

        <div className={a.musicLedgerStrip} aria-label="ملخص المكتبة">
          <div className={a.musicLedgerStat}>
            <strong>
              {assignedTemplateCount} / {templates.length}
            </strong>
            <span>تصميم مرتبط بلحن</span>
          </div>
          <div className={a.musicLedgerStat}>
            <strong>{overrideCount}</strong>
            <span>تخصيص مضاف</span>
          </div>
          <div className={a.musicLedgerStat}>
            <strong>{tracks.length}</strong>
            <span>إجمالي المقطوعات</span>
          </div>
        </div>
      </header>

      <div className={a.musicTabs} role="tablist" aria-label="أقسام الموسيقى">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "assignments"}
          className={a.musicTab}
          onClick={() => setTab("assignments")}
        >
          <Disc3 size={15} strokeWidth={1.7} aria-hidden="true" />
          <span>تعيين موسيقى التصاميم</span>
          <span className={a.musicTabCount}>{templates.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "library"}
          className={a.musicTab}
          onClick={() => setTab("library")}
        >
          <Library size={15} strokeWidth={1.7} aria-hidden="true" />
          <span>مكتبة الألحان</span>
          <span className={a.musicTabCount}>{tracks.length}</span>
        </button>
      </div>

      {nowPlayingMeta && nowAr && nowEn && (
        <div className={a.musicNowPlaying} role="region" aria-label="قيد التشغيل الآن">
          <button
            type="button"
            className={a.musicNowPlayBtn}
            onClick={stopPlayback}
            aria-label="إيقاف الاستماع"
          >
            <Pause size={15} strokeWidth={1.9} />
          </button>
          <div className={a.musicNowPlayInfo}>
            <div className={a.musicNowPlayEyebrow}>
              <AdminSoundBars />
              <span>قيد الاستماع الآن</span>
              {nowPlayingMeta.contextLabel && (
                <>
                  <span>·</span>
                  <span>{nowPlayingMeta.contextLabel}</span>
                </>
              )}
            </div>
            <strong>
              {nowAr.title}
              <span className={a.musicNowPlayEn} dir="ltr">
                {" "}
                — {nowEn.title}
              </span>
            </strong>
          </div>
          <span className={a.musicNowProgressTrack} aria-hidden="true">
            <span
              className={a.musicNowProgressFill}
              style={{ transform: `scaleX(${playProgress})` }}
            />
          </span>
        </div>
      )}

      {tab === "assignments" && (
        <section className={m.panel}>
          <div className={a.musicToolbar}>
            <div className={a.musicSearchWrap}>
              <Search size={15} strokeWidth={1.7} className={a.musicSearchGlyph} aria-hidden="true" />
              <input
                type="search"
                className={a.musicSearchField}
                value={tplQuery}
                onChange={(e) => setTplQuery(e.target.value)}
                placeholder="ابحث باسم التصميم أو المعرّف…"
                aria-label="بحث في التصاميم"
              />
              {tplQuery && (
                <button
                  type="button"
                  className={a.musicSearchClearBtn}
                  onClick={() => setTplQuery("")}
                  aria-label="مسح البحث"
                >
                  <X size={13} strokeWidth={1.8} />
                </button>
              )}
            </div>

            <div className={a.musicIndexBar} role="group" aria-label="تصفية حسب المناسبة">
              {CATEGORY_FILTER.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={a.musicIndexTab}
                  aria-pressed={tplCat === c.id}
                  onClick={() => setTplCat(c.id)}
                >
                  <span>{c.label}</span>
                  <span className={a.musicIndexCount}>{categoryCounts[c.id]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={a.musicBulkBar}>
            <span className={a.musicBulkLabel}>
              <SlidersHorizontal size={15} strokeWidth={1.7} aria-hidden="true" />
              <span>تحديث جماعي للمعروض:</span>
            </span>
            <div className={a.selectWrap}>
              <select
                className={a.selectControl}
                value={bulkTrackId}
                onChange={(e) => setBulkTrackId(e.target.value)}
                disabled={bulkBusy}
                aria-label="المقطوعة للتطبيق الجماعي"
              >
                <TrackSelectOptions customTracks={customTracks} builtInByMood={builtInByMood} includeResetDefault />
              </select>
              <ChevronDown size={15} strokeWidth={1.7} className={a.selectChevron} aria-hidden="true" />
            </div>
            <button
              type="button"
              className={m.primary}
              disabled={bulkBusy || filteredTemplates.length === 0}
              onClick={applyBulk}
            >
              {bulkBusy ? "بيتحفظ..." : `تطبيق على ${filteredTemplates.length} تصميم`}
            </button>
            {bulkMsg && <span className={a.assignStatus}>{bulkMsg}</span>}
          </div>

          <div className={a.assignList}>
            {filteredTemplates.map((tpl) => {
              const currentId = assignments[tpl.id] ?? "none";
              const track = currentId !== "none" ? trackById.get(currentId) : undefined;
              const playKey = `tpl:${tpl.id}:${currentId}`;
              const isPlaying = playingKey === playKey;
              const isOverridden = tpl.id in overrides;
              const status = rowStatus[tpl.id];

              return (
                <div key={tpl.id} className={a.assignRow} data-playing={isPlaying}>
                  <div className={a.assignThumb}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- template poster */}
                    {tpl.posterUrl && <img src={tpl.posterUrl} alt="" />}
                  </div>

                  <div className={a.assignInfo}>
                    <div className={a.assignTitles}>
                      <strong className={a.assignNameAr}>{templateDisplayName(tpl, "ar")}</strong>
                      <span className={a.assignNameEn} dir="ltr">
                        {templateDisplayName(tpl, "en")}
                      </span>
                    </div>
                    <div className={a.assignMeta}>
                      <span>{CATEGORY_LABELS[tpl.category]}</span>
                      <span aria-hidden="true">·</span>
                      <span dir="ltr">{tpl.id}</span>
                      <a
                        href={`/t/${tpl.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={a.assignPreviewLink}
                      >
                        معاينة <ExternalLink size={12} strokeWidth={1.6} aria-hidden="true" />
                      </a>
                      {isOverridden && <span className={a.musicCustomBadge}>مخصّص</span>}
                    </div>
                  </div>

                  <div className={a.assignControls}>
                    <button
                      type="button"
                      className={a.musicIconBtn}
                      data-playing={isPlaying}
                      disabled={!track}
                      onClick={() => togglePlay(playKey, track, templateDisplayName(tpl, "ar"))}
                      aria-label={isPlaying ? "إيقاف" : "تشغيل"}
                      title={track ? track.name : "بدون موسيقى"}
                    >
                      {isPlaying ? <Pause size={15} strokeWidth={1.8} /> : <Play size={15} strokeWidth={1.8} />}
                    </button>

                    <div className={a.selectWrap}>
                      <select
                        className={a.selectControl}
                        value={currentId}
                        onChange={(e) => assignTemplate(tpl.id, e.target.value)}
                        disabled={status === "saving"}
                        aria-label={`موسيقى ${templateDisplayName(tpl, "ar")}`}
                      >
                        <TrackSelectOptions customTracks={customTracks} builtInByMood={builtInByMood} />
                      </select>
                      <ChevronDown size={15} strokeWidth={1.7} className={a.selectChevron} aria-hidden="true" />
                    </div>

                    {isOverridden && (
                      <button
                        type="button"
                        className={a.musicIconBtn}
                        onClick={() => assignTemplate(tpl.id, "__default__")}
                        disabled={status === "saving"}
                        title="إعادة للافتراضي"
                        aria-label="إعادة للافتراضي"
                      >
                        <RotateCcw size={14} strokeWidth={1.7} />
                      </button>
                    )}

                    {status === "saving" && <span className={a.assignStatus}>بيتحفظ...</span>}
                    {status === "saved" && <span className={a.assignStatus}>اتحفظ ✓</span>}
                    {status === "error" && (
                      <span className={a.assignStatus} data-error="true">
                        فشل الحفظ
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === "library" && (
        <>
          <form className={m.panel} onSubmit={upload}>
            <div className={m.panelHead}>
              <h2 className={a.musicPanelTitle}>
                <span className={a.musicPanelIcon} aria-hidden="true">
                  <Upload size={16} strokeWidth={1.6} />
                </span>
                <span>رفع مقطوعة جديدة للمكتبة</span>
              </h2>
            </div>
            <p className={m.hint}>
              صيغ MP3 أو M4A بحد أقصى 12 ميجابايت مع التأكد من صلاحية الاستخدام التجاري. تظهر فور رفعها للتعيين أو لاختيار العملاء.
            </p>

            <label className={a.uploadDropzone} data-has-file={Boolean(file)}>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/mpeg,audio/mp4,.mp3,.m4a"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  if (f && !name) setName(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
                }}
                disabled={progress !== null}
              />
              <span className={a.uploadDropIcon} aria-hidden="true">
                {file ? <FileMusic size={20} strokeWidth={1.6} /> : <Upload size={20} strokeWidth={1.6} />}
              </span>
              <span className={a.uploadDropText}>
                <strong>{file ? file.name : "اختار ملف الصوت من جهازك"}</strong>
                <small>
                  {file
                    ? `${(file.size / 1024 / 1024).toFixed(2)} MB · اضغط لاستبدال الملف`
                    : "MP3 أو M4A · يُفضّل موسيقى هادئة مناسبة للافتتاحية"}
                </small>
              </span>
            </label>

            <div className={a.twoCols}>
              <label className={m.field}>
                <span>الاسم الأساسي (إنجليزي)</span>
                <input
                  className={m.input}
                  dir="ltr"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  placeholder="Silk Road Serenade · Borodin"
                />
              </label>
              <label className={m.field}>
                <span>الاسم بالعربي (اختياري)</span>
                <input
                  className={m.input}
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  maxLength={60}
                  placeholder="سيريناد طريق الحرير · بورودين"
                />
              </label>
            </div>

            <div className={m.field}>
              <span>الطابع الموسيقي</span>
              <div className={a.selectWrap}>
                <select
                  className={a.selectControl}
                  value={mood}
                  onChange={(e) => setMood(e.target.value as MusicMood)}
                >
                  {MUSIC_MOODS.map((md) => (
                    <option key={md} value={md}>
                      {MUSIC_MOOD_LABELS[md].ar} · {MUSIC_MOOD_LABELS[md].en}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} strokeWidth={1.7} className={a.selectChevron} aria-hidden="true" />
              </div>
            </div>

            {progress !== null && (
              <div className={a.progress} aria-label="نسبة الرفع">
                <div style={{ width: `${progress}%` }} />
                <span>{progress < 100 ? `بيترفع ${progress}%` : "بيتحفظ..."}</span>
              </div>
            )}

            {error && <p className={m.error}>{error}</p>}

            <div className={m.inlineActions}>
              <button className={m.primary} type="submit" disabled={!file || !name.trim() || progress !== null}>
                <Upload size={15} strokeWidth={1.7} aria-hidden="true" />
                <span>{progress !== null ? `بيترفع ${progress}%` : "رفع للمكتبة"}</span>
              </button>
              {file && progress === null && (
                <button
                  type="button"
                  className={m.secondary}
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  إلغاء الملف
                </button>
              )}
            </div>
          </form>

          <section className={m.panel}>
            <div className={m.panelHead}>
              <h2 className={a.musicPanelTitle}>
                <span>ملفات الاستوديو المرفوعة</span>
                <span className={a.musicTabCount}>{customTracks.length}</span>
              </h2>
            </div>
            {customTracks.length === 0 ? (
              <p className={m.empty}>لسه مفيش مقطوعات مرفوعة — ارفع أول لحن مخصّص من الفورم فوق أو استخدم المكتبة الجاهزة تحت.</p>
            ) : (
              <div className={a.assignList}>
                {customTracks.map((t) => {
                  const isPlaying = playingKey === t.id;
                  const used = usageCounts.get(t.id) ?? 0;
                  const arParts = musicParts(t, "ar");
                  const enParts = musicParts(t, "en");
                  return (
                    <div key={t.id} className={a.musicLibRow} data-playing={isPlaying}>
                      <button
                        type="button"
                        className={a.musicIconBtn}
                        data-playing={isPlaying}
                        onClick={() => togglePlay(t.id, t)}
                        aria-label={isPlaying ? "إيقاف" : "تشغيل"}
                      >
                        {isPlaying ? <Pause size={15} strokeWidth={1.8} /> : <Play size={15} strokeWidth={1.8} />}
                      </button>
                      <div className={a.musicLibTitle}>
                        <strong>{arParts.title}</strong>
                        <small>
                          <span dir="ltr">{enParts.title}</span>
                          {" · "}
                          {t.mood ? MUSIC_MOOD_LABELS[t.mood].ar : "مختارة"}
                          {" · "}
                          مستخدمة في {used} تصميم
                        </small>
                      </div>
                      <button
                        type="button"
                        className={a.musicDeleteBtn}
                        onClick={() => remove(t)}
                        aria-label={`مسح ${t.name}`}
                      >
                        <Trash2 size={15} strokeWidth={1.6} aria-hidden="true" />
                        <span>مسح</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className={m.panel}>
            <div className={m.panelHead}>
              <h2 className={a.musicPanelTitle}>
                <span>مكتبة نايلة الكلاسيكية</span>
                <span className={a.musicTabCount}>{builtInTracks.length}</span>
              </h2>
            </div>

            <div className={a.musicToolbar}>
              <div className={a.musicSearchWrap}>
                <Search size={15} strokeWidth={1.7} className={a.musicSearchGlyph} aria-hidden="true" />
                <input
                  type="search"
                  className={a.musicSearchField}
                  value={libQuery}
                  onChange={(e) => setLibQuery(e.target.value)}
                  placeholder="ابحث باسم المقطوعة أو المؤلف…"
                  aria-label="بحث في المكتبة الجاهزة"
                />
                {libQuery && (
                  <button
                    type="button"
                    className={a.musicSearchClearBtn}
                    onClick={() => setLibQuery("")}
                    aria-label="مسح البحث"
                  >
                    <X size={13} strokeWidth={1.8} />
                  </button>
                )}
              </div>

              <div className={a.musicIndexBar} role="group" aria-label="تصفية حسب الطابع">
                <button
                  type="button"
                  className={a.musicIndexTab}
                  aria-pressed={libMood === "all"}
                  onClick={() => setLibMood("all")}
                >
                  <span>الكل</span>
                  <span className={a.musicIndexCount}>{builtInTracks.length}</span>
                </button>
                {MUSIC_MOODS.map((md) => {
                  const count = builtInTracks.filter((t) => t.mood === md).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={md}
                      type="button"
                      className={a.musicIndexTab}
                      aria-pressed={libMood === md}
                      onClick={() => setLibMood(md)}
                    >
                      <span>{MUSIC_MOOD_LABELS[md].ar}</span>
                      <span className={a.musicIndexCount}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={a.assignList}>
              {filteredBuiltIn.map((t) => {
                const isPlaying = playingKey === t.id;
                const used = usageCounts.get(t.id) ?? 0;
                const arParts = musicParts(t, "ar");
                const enParts = musicParts(t, "en");
                return (
                  <div key={t.id} className={a.musicLibRow} data-playing={isPlaying}>
                    <button
                      type="button"
                      className={a.musicIconBtn}
                      data-playing={isPlaying}
                      onClick={() => togglePlay(t.id, t)}
                      aria-label={isPlaying ? "إيقاف" : "تشغيل"}
                    >
                      {isPlaying ? <Pause size={15} strokeWidth={1.8} /> : <Play size={15} strokeWidth={1.8} />}
                    </button>
                    <div className={a.musicLibTitle}>
                      <div className={a.musicLibTitleLine}>
                        <strong>{arParts.title}</strong>
                        {arParts.composer && (
                          <span className={a.musicLibComposer}>· {arParts.composer}</span>
                        )}
                      </div>
                      <small>
                        <span dir="ltr">{enParts.title}</span>
                        {" · "}
                        {t.mood ? MUSIC_MOOD_LABELS[t.mood].ar : ""}
                        {" · "}
                        مستخدمة في {used} تصميم
                      </small>
                    </div>
                    <span className={a.musicTagBadge}>مرخّصة تجارياً · CC0</span>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
