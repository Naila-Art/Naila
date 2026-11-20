"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "./manage.module.css";
import store from "../store/store.module.css";
import OrderOptions from "../store/OrderOptions";
import { DETAIL_ERRORS } from "../store/Builder";
import { ADDON_LABELS, anyAddonEnabled, formatEgp, getPackage, type Pricing } from "@/lib/pricing";
import { UPLOAD_ERRORS, UploadError, contentTypeOf, postJson, putFile } from "@/lib/upload-client";
import type { Addons, ChangeRequest, Lang, MusicTrack, Order, PackageId, Template } from "@/lib/types";

export interface EventDetails {
  partnerA: string;
  partnerB: string;
  /** Cairo wall-clock time for <input type="datetime-local"> */
  date: string;
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
  lang: Lang;
  templateId: string;
  musicTrackId: string;
  musicUrl: string;
}

interface Props {
  pricing: Pricing;
  manageToken: string;
  slug: string;
  order: Order;
  details: EventDetails;
  features: { music: boolean; maps: boolean };
  templates: Pick<Template, "id" | "name">[];
  music: MusicTrack[];
  changeRequests: ChangeRequest[];
  paymobEnabled: boolean;
  instapay: string;
  whatsappUrl: string;
  isNew: boolean;
  returnedFromPayment: boolean;
}

const ERRORS: Record<string, string> = {
  ...DETAIL_ERRORS,
  ...UPLOAD_ERRORS,
  already_paid: "الطلب ده اتدفع خلاص.",
  paymob_unavailable: "الدفع بالفيزا مش متاح دلوقتي، استخدم إنستاباي.",
  paymob_failed: "مقدرناش نفتح صفحة الدفع. جرب تاني أو استخدم إنستاباي.",
  invalid_message: "اكتب التعديل اللي عايزه.",
  not_included: "الإضافة دي مش في طلبك.",
};
const errorText = (err: unknown) => ERRORS[err instanceof UploadError ? err.code : "failed"] ?? ERRORS.failed;

function addonSummary(order: Order, pricing: Pricing): string[] {
  const out: string[] = [];
  if (order.addons.arabic) out.push(ADDON_LABELS.arabic);
  if (order.addons.maps) out.push(ADDON_LABELS.maps);
  if (order.addons.customMusic) out.push(ADDON_LABELS.customMusic);
  if (order.packageId === 4) out.push(`${ADDON_LABELS.names} (مشمولة)`);
  else if (order.addons.names) out.push(`${ADDON_LABELS.names}: ${pricing.namesTiers[order.addons.names].label}`);
  return out;
}

/** Order status, payment, details, music and change requests on the client's page. */
export default function OrderPanels(props: Props) {
  const { order } = props;
  const api = `/api/manage/${encodeURIComponent(props.manageToken)}`;
  return (
    <>
      {props.isNew && order.payment === "unpaid" && (
        <section className={`${styles.panel} ${styles.notice}`}>
          <h2>دعوتك جاهزة للمعاينة 🤍</h2>
          <p>
            دي صفحتك الخاصة. <strong>احفظ اللينك ده عندك</strong> (من غير باسورد، فمتبعتوش لحد). شوف الدعوة، عدّل اللي
            عايزه، وادفع لما تبقى مبسوط بيها.
          </p>
        </section>
      )}
      <PaymentPanel {...props} api={api} />
      {order.payment === "unpaid" && <OrderEditor api={api} order={order} lang={props.details.lang} pricing={props.pricing} />}
      <DetailsEditor {...props} api={api} />
      {order.addons.customMusic && props.features.music && <CustomMusic api={api} current={props.details.musicUrl} />}
      <ChangeRequests api={api} initial={props.changeRequests} whatsappUrl={props.whatsappUrl} />
    </>
  );
}

function PaymentPanel(props: Props & { api: string }) {
  const { order } = props;
  const router = useRouter();
  const pkg = getPackage(props.pricing, order.packageId)!;
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [proof, setProof] = useState<File | null>(null);

  async function payWithCard() {
    setError("");
    setBusy(true);
    try {
      const { redirectUrl } = await postJson<{ redirectUrl: string }>(`${props.api}/payment`, { method: "paymob" });
      window.location.href = redirectUrl;
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  async function sendProof(e: FormEvent) {
    e.preventDefault();
    if (!proof) return;
    setError("");
    setBusy(true);
    try {
      const contentType = contentTypeOf(proof);
      const slot = await postJson<{ objectKey: string; uploadUrl: string }>(`${props.api}/uploads`, {
        kind: "proof",
        contentType,
        size: proof.size,
      });
      await putFile(slot.uploadUrl, proof, contentType);
      await postJson(`${props.api}/payment`, { method: "instapay", objectKey: slot.objectKey });
      router.refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <h2>الطلب</h2>
        <span
          className={`${styles.badge} ${
            order.payment === "paid" ? styles.badgeOk : order.payment === "pending_review" ? styles.badgeInfo : styles.badgeMuted
          }`}
        >
          {order.payment === "paid" ? "مدفوع · الدعوة شغالة" : order.payment === "pending_review" ? "بنراجع التحويل" : "معاينة · مش مدفوع"}
        </span>
      </div>

      <p>
        باقة <strong>{pkg.name}</strong> · {formatEgp(order.total)}
      </p>
      {addonSummary(order, props.pricing).length > 0 && (
        <p className={styles.hint}>{addonSummary(order, props.pricing).join(" · ")}</p>
      )}

      {order.payment === "paid" && <p className={styles.ok}>تم الدفع. ابعت اللينكات للمعازيم من تحت.</p>}

      {order.payment === "pending_review" && (
        <p className={styles.hint}>استلمنا صورة التحويل وبنراجعها. أول ما نأكدها الدعوة هتشتغل والصفحة دي هتتحدث.</p>
      )}

      {order.payment === "unpaid" && (
        <>
          {props.returnedFromPayment && (
            <p className={styles.hint} role="status">
              لو دفعت بالفيزا، التأكيد بيوصل خلال دقيقة. حدّث الصفحة.
            </p>
          )}
          {order.rejectReason && (
            <p className={styles.error} role="alert">
              التحويل اللي بعته ماتأكدش: {order.rejectReason}
            </p>
          )}
          <p className={styles.hint}>
            الدعوة دلوقتي معاينة: عليها شريط &quot;معاينة&quot; والمعازيم مش هيقدروا يردوا. بعد الدفع بتشتغل على طول.
          </p>
          <a className={styles.secondary} href={`/i/${props.slug}`} target="_blank" rel="noopener noreferrer">
            شوف الدعوة ↗
          </a>

          <label className={styles.checkRow}>
            <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} />
            <span>شفت الدعوة والبيانات مظبوطة، وموافق عليها</span>
          </label>

          {props.paymobEnabled && (
            <button type="button" className={styles.primary} disabled={!approved || busy} onClick={payWithCard}>
              ادفع {formatEgp(order.total)} بالفيزا / أبل باي / المحفظة
            </button>
          )}

          {props.instapay && (
            <form className={styles.instapay} onSubmit={sendProof}>
              <h3>أو حوّل على إنستاباي</h3>
              <p>
                حوّل <strong>{formatEgp(order.total)}</strong> على{" "}
                <bdi dir="ltr" className={styles.mono}>
                  {props.instapay}
                </bdi>{" "}
                وارفع صورة التحويل.
              </p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setProof(e.target.files?.[0] ?? null)}
                disabled={!approved || busy}
              />
              <button type="submit" className={styles.secondary} disabled={!approved || !proof || busy}>
                {busy ? "بيترفع..." : "ابعت صورة التحويل"}
              </button>
            </form>
          )}

          {!props.paymobEnabled && !props.instapay && (
            <p className={styles.hint}>
              كلمنا على واتساب عشان تدفع.{" "}
              {props.whatsappUrl && (
                <a href={props.whatsappUrl} target="_blank" rel="noopener noreferrer">
                  واتساب
                </a>
              )}
            </p>
          )}
        </>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function OrderEditor({ api, order, lang, pricing }: { api: string; order: Order; lang: Lang; pricing: Pricing }) {
  const router = useRouter();
  const [packageId, setPackageId] = useState<PackageId>(order.packageId);
  const [addons, setAddons] = useState<Addons>(order.addons);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const changed = packageId !== order.packageId || JSON.stringify({ ...addons, arabic: lang === "ar" }) !== JSON.stringify(order.addons);

  async function save() {
    setBusy(true);
    setError("");
    try {
      await postJson(`${api}/order`, { packageId, addons }, "PUT");
      router.refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className={styles.panel}>
      <summary className={styles.summary}>{anyAddonEnabled(pricing) ? "تغيير الباقة أو الإضافات" : "تغيير الباقة"}</summary>
      <div className={store.page} style={{ minHeight: 0, background: "transparent" }}>
        <OrderOptions
          pricing={pricing}
          packageId={packageId}
          addons={addons}
          lang={lang}
          onChange={(n) => {
            setPackageId(n.packageId);
            setAddons(n.addons);
          }}
        />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <button type="button" className={styles.primary} disabled={!changed || busy} onClick={save}>
        حفظ التغيير
      </button>
    </details>
  );
}

function DetailsEditor(props: Props & { api: string }) {
  const router = useRouter();
  const [d, setD] = useState(props.details);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (patch: Partial<EventDetails>) => setD((x) => ({ ...x, ...patch }));
  const langLocked = props.order.payment !== "unpaid";

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await postJson(`${props.api}/details`, { ...d, musicTrackId: props.features.music ? d.musicTrackId : undefined }, "PUT");
      setMsg({ ok: true, text: "اتحفظ" });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: errorText(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className={styles.panel}>
      <summary className={styles.summary}>تعديل بيانات الدعوة</summary>
      <form className={styles.detailsForm} onSubmit={save}>
        <div className={styles.twoCols}>
          <label className={styles.field}>
            <span>الاسم الأول</span>
            <input className={styles.input} value={d.partnerA} onChange={(e) => set({ partnerA: e.target.value })} maxLength={40} />
          </label>
          <label className={styles.field}>
            <span>الاسم التاني</span>
            <input className={styles.input} value={d.partnerB} onChange={(e) => set({ partnerB: e.target.value })} maxLength={40} />
          </label>
        </div>
        <label className={styles.field}>
          <span>التاريخ والساعة (بتوقيت مصر)</span>
          <input className={styles.input} type="datetime-local" value={d.date} onChange={(e) => set({ date: e.target.value })} />
        </label>
        <div className={styles.twoCols}>
          <label className={styles.field}>
            <span>المكان</span>
            <input className={styles.input} value={d.venueName} onChange={(e) => set({ venueName: e.target.value })} maxLength={80} />
          </label>
          <label className={styles.field}>
            <span>العنوان</span>
            <input className={styles.input} value={d.venueAddress} onChange={(e) => set({ venueAddress: e.target.value })} maxLength={120} />
          </label>
        </div>
        {props.features.maps && (
          <label className={styles.field}>
            <span>لينك جوجل ماب</span>
            <input className={styles.input} type="url" dir="ltr" value={d.mapsUrl} onChange={(e) => set({ mapsUrl: e.target.value })} />
          </label>
        )}
        <div className={styles.twoCols}>
          <label className={styles.field}>
            <span>التصميم</span>
            <select className={styles.input} value={d.templateId} onChange={(e) => set({ templateId: e.target.value })}>
              {props.templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>اللغة{langLocked ? " (ثابتة بعد الدفع)" : ""}</span>
            <select className={styles.input} value={d.lang} disabled={langLocked} onChange={(e) => set({ lang: e.target.value as Lang })}>
              <option value="ar">عربي</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
        {props.features.music && props.music.length > 0 && !d.musicUrl && (
          <label className={styles.field}>
            <span>المزيكا</span>
            <select className={styles.input} value={d.musicTrackId} onChange={(e) => set({ musicTrackId: e.target.value })}>
              <option value="">من غير مزيكا</option>
              {props.music.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {msg && <p className={msg.ok ? styles.ok : styles.error}>{msg.text}</p>}
        <button type="submit" className={styles.primary} disabled={busy}>
          حفظ
        </button>
      </form>
    </details>
  );
}

function CustomMusic({ api, current }: { api: string; current: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const contentType = contentTypeOf(file);
      const slot = await postJson<{ objectKey: string; uploadUrl: string }>(`${api}/uploads`, { kind: "music", contentType, size: file.size });
      await putFile(slot.uploadUrl, file, contentType);
      await postJson(`${api}/music`, { objectKey: slot.objectKey }, "PUT");
      router.refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.panel}>
      <h2>أغنيتك</h2>
      {current ? <audio controls src={current} preload="none" style={{ width: "100%" }} /> : <p className={styles.hint}>لسه مارفعتش أغنية.</p>}
      <label className={styles.field}>
        <span>{current ? "غيّر الأغنية" : "ارفع الأغنية"} (MP3 أو M4A، لحد 12 ميجا)</span>
        <input type="file" accept="audio/mpeg,audio/mp4,.mp3,.m4a" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} />
      </label>
      {busy && <p className={styles.hint}>بترفع...</p>}
      {error && <p className={styles.error}>{error}</p>}
    </section>
  );
}

function ChangeRequests({ api, initial, whatsappUrl }: { api: string; initial: ChangeRequest[]; whatsappUrl: string }) {
  const [list, setList] = useState(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { request } = await postJson<{ request: ChangeRequest }>(`${api}/changes`, { body: text });
      setList((l) => [request, ...l]);
      setText("");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className={styles.panel} open={list.some((r) => !r.resolvedAt)}>
      <summary className={styles.summary}>محتاج تعديل مش عارف تعمله؟</summary>
      <form className={styles.detailsForm} onSubmit={send}>
        <textarea
          className={styles.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="مثلاً: عايز لون الختم دهبي، أو التصميم يبقى من غير..."
        />
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.inlineActions}>
          <button type="submit" className={styles.primary} disabled={busy || !text.trim()}>
            ابعت طلب التعديل
          </button>
          {whatsappUrl && (
            <a className={styles.secondary} href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              أو كلمنا واتساب
            </a>
          )}
        </div>
      </form>
      {list.length > 0 && (
        <ul className={styles.simpleList}>
          {list.map((r) => (
            <li key={r.id}>
              <span>{r.body}</span>
              <span className={`${styles.badge} ${r.resolvedAt ? styles.badgeOk : styles.badgeInfo}`}>
                {r.resolvedAt ? "اتعمل" : "وصلنا"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
