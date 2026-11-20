"use client";

import { useState, type FormEvent } from "react";
import m from "../manage/manage.module.css";
import a from "./admin.module.css";
import type { MusicTrack } from "@/lib/types";
import { UPLOAD_ERRORS, UploadError, contentTypeOf, postJson, putFile } from "@/lib/upload-client";

/** Music library for package 2+: clients pick a track from here in the builder. */
export default function MusicAdmin({ initial }: { initial: MusicTrack[] }) {
  const [tracks, setTracks] = useState(initial);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const api = `/api/admin/music`;

  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file || !name.trim()) return;
    const form = e.currentTarget;
    setError("");
    setProgress(0);
    try {
      const contentType = contentTypeOf(file);
      const slot = await postJson<{ objectKey: string; uploadUrl: string }>(api, { step: "slot", contentType, size: file.size });
      await putFile(slot.uploadUrl, file, contentType, (loaded) => setProgress(Math.round((loaded / file.size) * 100)));
      const { track } = await postJson<{ track: MusicTrack }>(api, { step: "save", name: name.trim(), objectKey: slot.objectKey });
      setTracks((t) => [track, ...t]);
      setName("");
      setFile(null);
      form.reset();
    } catch (err) {
      setError(UPLOAD_ERRORS[err instanceof UploadError ? err.code : "failed"] ?? UPLOAD_ERRORS.failed);
    } finally {
      setProgress(null);
    }
  }

  async function remove(t: MusicTrack) {
    if (!confirm(`تمسح "${t.name}"؟ الدعوات اللي مختاراها هتبقى من غير مزيكا.`)) return;
    const res = await fetch(`${api}?id=${encodeURIComponent(t.id)}`, { method: "DELETE" });
    if (res.ok) setTracks((list) => list.filter((x) => x.id !== t.id));
  }

  return (
    <main className={`${m.page} ${a.wide}`} dir="rtl" lang="ar">
      <header className={a.pageHead}>
        <h1>المزيكا</h1>
      </header>

      <form className={m.panel} onSubmit={upload}>
        <h2>رفع مزيكا</h2>
        <p className={m.hint}>العميل في الباقة المميزة بيختار منها. MP3 أو M4A، لحد 12 ميجا. اتأكد إن معاك حق استخدامها.</p>
        <label className={m.field}>
          <span>الملف</span>
          <input
            type="file"
            accept="audio/mpeg,audio/mp4,.mp3,.m4a"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              if (f && !name) setName(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
            }}
            disabled={progress !== null}
          />
        </label>
        <label className={m.field}>
          <span>الاسم اللي العميل هيشوفه</span>
          <input className={m.input} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        </label>
        {error && <p className={m.error}>{error}</p>}
        <button className={m.primary} type="submit" disabled={!file || !name.trim() || progress !== null}>
          {progress !== null ? `بيترفع ${progress}%` : "رفع"}
        </button>
      </form>

      <section className={m.panel}>
        <h2>المكتبة ({tracks.length})</h2>
        {tracks.length === 0 ? (
          <p className={m.empty}>لسه مفيش مزيكا.</p>
        ) : (
          <ul className={m.simpleList}>
            {tracks.map((t) => (
              <li key={t.id} style={{ flexWrap: "wrap" }}>
                <strong>{t.name}</strong>
                <audio controls preload="none" src={t.url} style={{ height: 36, maxWidth: "100%" }} />
                <button type="button" className={m.linkBtn} onClick={() => remove(t)}>
                  مسح
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
