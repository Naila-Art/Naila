"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "./manage.module.css";
import store from "../store/store.module.css";
import OrderOptions from "../store/OrderOptions";
import DateTimePicker from "../DateTimePicker";
import { DETAIL_ERRORS } from "../store/Builder";
import { formatEgp, getPackage, type Pricing } from "@/lib/pricing";
import { UPLOAD_ERRORS, UploadError, contentTypeOf, postJson, putFile } from "@/lib/upload-client";
import type { ChangeRequest, Lang, MusicTrack, Order, PackageId, Template } from "@/lib/types";

export interface ClientPaymentMethod {
  id: string;
  name: string;
  kind: "transfer" | "card";
  account: string;
  instructions?: string;
}

export interface EventDetails {
  partnerA: string;
  partnerB: string;
  /** Cairo wall-clock time, "YYYY-MM-DDTHH:mm" (DateTimePicker) */
  date: string;
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
  lang: Lang;
  templateId: string;
  musicTrackId: string;
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
  /** Payment methods the client can use right now (switched on, and usable). */
  methods: ClientPaymentMethod[];
  whatsappUrl: string;
  isNew: boolean;
  returnedFromPayment: boolean;
}

const ERRORS: Record<string, string> = {
  ...DETAIL_ERRORS,
  ...UPLOAD_ERRORS,
  already_paid: "الطلب ده اتدفع خلاص.",
  paymob_unavailable: "الدفع بالفيزا مش متاح دلوقتي، اختار طريقة تانية.",
  paymob_failed: "مقدرناش نفتح صفحة الدفع. جرب تاني أو اختار طريقة تانية.",
  invalid_method: "طريقة الدفع دي مش متاحة دلوقتي، اختار غيرها.",
  invalid_message: "اكتب التعديل اللي عايزه.",
  not_included: "ده مش في باقتك.",
  reference_wrong_type: "الملف لازم يكون صورة (JPG/PNG) أو فيديو (MP4/MOV).",
  reference_too_large: "الملف أكبر من 50 ميجا.",
  too_many_files: "وصلت لأقصى عدد ملفات (30).",
};
const errorText = (err: unknown) => ERRORS[err instanceof UploadError ? err.code : "failed"] ?? ERRORS.failed;

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
      {order.payment === "unpaid" && order.kind === "self" && <OrderEditor api={api} order={order} pricing={props.pricing} />}
      <DetailsEditor {...props} api={api} />
      {order.packageId >= 3 && <ReferencesPanel api={api} order={order} />}
      <ChangeRequests api={api} initial={props.changeRequests} whatsappUrl={props.whatsappUrl} />
    </>
  );
}

function PaymentPanel(props: Props & { api: string }) {
  const { order, methods } = props;
  const router = useRouter();
  const pkg = getPackage(props.pricing, order.packageId)!;
  const [approved, setApproved] = useState(false);
  const [methodId, setMethodId] = useState(methods[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const method = methods.find((m) => m.id === methodId);
  const previewUrl = `/c/${encodeURIComponent(props.manageToken)}/preview`;

  async function payWithCard() {
    setError("");
    setBusy(true);
    try {
      const { redirectUrl } = await postJson<{ redirectUrl: string }>(`${props.api}/payment`, { method: methodId });
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
      await postJson(`${props.api}/payment`, { method: methodId, objectKey: slot.objectKey });
      router.refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function copyAccount() {
    if (!method) return;
    try {
      await navigator.clipboard.writeText(method.account);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  return (
    <section className={styles.panel} id="payment">
      <div className={styles.panelHead}>
        <h2>الطلب والدفع</h2>
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

      {order.payment === "paid" && <p className={styles.ok}>تم الدفع. اللينكات اتفتحت، ابعتها للضيوف من تحت.</p>}

      {order.payment === "pending_review" && (
        <p className={styles.hint}>
          استلمنا صورة التحويل ({order.paymentMethodName}) وبنراجعها. أول ما نأكدها الدعوة هتشتغل واللينكات هتتفتح.
        </p>
      )}

      {order.payment !== "paid" && (
        <a className={styles.secondary} href={previewUrl} target="_blank" rel="noopener noreferrer">
          شوف المعاينة ↗
        </a>
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
            اللي فوق معاينة عليها علامة &quot;معاينة&quot;. لينك الدعوة ولينكات الضيوف بيتفتحوا بعد الدفع على طول.
          </p>

          <label className={styles.checkRow}>
            <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} />
            <span>شفت المعاينة والبيانات مظبوطة، وموافق عليها</span>
          </label>

          {methods.length === 0 ? (
            <p className={styles.hint}>
              كلمنا على واتساب عشان تدفع.{" "}
              {props.whatsappUrl && (
                <a href={props.whatsappUrl} target="_blank" rel="noopener noreferrer">
                  واتساب
                </a>
              )}
            </p>
          ) : (
            <fieldset className={styles.methods} disabled={!approved || busy}>
              <legend>اختار طريقة الدفع</legend>
              <div className={styles.methodList} role="radiogroup">
                {methods.map((pm) => (
                  <label key={pm.id} className={styles.method} data-checked={pm.id === methodId}>
                    <input type="radio" name="method" checked={pm.id === methodId} onChange={() => setMethodId(pm.id)} />
                    <span>{pm.name}</span>
                  </label>
                ))}
              </div>

              {method?.kind === "card" && (
                <button type="button" className={styles.primary} onClick={payWithCard}>
                  ادفع {formatEgp(order.total)}
                </button>
              )}

              {method?.kind === "transfer" && (
                <form className={styles.instapay} onSubmit={sendProof}>
                  <p>
                    حوّل <strong>{formatEgp(order.total)}</strong> {method.name} على:
                  </p>
                  <div className={styles.copyRow}>
                    <code dir="ltr">{method.account}</code>
                    <button type="button" className={styles.secondary} onClick={copyAccount}>
                      {copied ? "اتنسخ ✓" : "نسخ"}
                    </button>
                  </div>
                  {method.instructions && <p className={styles.hint}>{method.instructions}</p>}
                  <label className={styles.field}>
                    <span>صورة التحويل</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setProof(e.target.files?.[0] ?? null)} />
                  </label>
                  <button type="submit" className={styles.primary} disabled={!proof}>
                    {busy ? "بيترفع..." : "ابعت صورة التحويل"}
                  </button>
                </form>
              )}
            </fieldset>
          )}
          {!approved && methods.length > 0 && <p className={styles.hint}>علّم على الموافقة الأول عشان تقدر تدفع.</p>}
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

function OrderEditor({ api, order, pricing }: { api: string; order: Order; pricing: Pricing }) {
  const router = useRouter();
  const [packageId, setPackageId] = useState<PackageId>(order.packageId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      await postJson(`${api}/order`, { packageId }, "PUT");
      router.refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className={styles.panel}>
      <summary className={styles.summary}>تغيير الباقة</summary>
      <div className={store.page} style={{ minHeight: 0, background: "transparent" }}>
        <OrderOptions pricing={pricing} packageId={packageId} onChange={setPackageId} />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <button type="button" className={styles.primary} disabled={packageId === order.packageId || busy} onClick={save}>
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
        <div className={styles.field}>
          <span>التاريخ والساعة (بتوقيت مصر)</span>
          <DateTimePicker value={d.date} onChange={(date) => set({ date })} />
        </div>
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
        {props.features.music && props.music.length > 0 && (
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

/** Package 3+: what the client wants, plus their photos / videos / references for our team. */
function ReferencesPanel({ api, order }: { api: string; order: Order }) {
  const router = useRouter();
  const [notes, setNotes] = useState(order.brief?.notes ?? "");
  const [savedNotes, setSavedNotes] = useState(order.brief?.notes ?? "");
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function saveNotes() {
    setError("");
    try {
      await postJson(`${api}/references`, { notes }, "PUT");
      setSavedNotes(notes);
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const list = Array.from(files);
    try {
      for (const [i, file] of list.entries()) {
        setProgress(`بيترفع ${i + 1} من ${list.length}...`);
        const contentType = contentTypeOf(file);
        const slot = await postJson<{ objectKey: string; uploadUrl: string }>(`${api}/uploads`, {
          kind: "reference",
          contentType,
          size: file.size,
        });
        await putFile(slot.uploadUrl, file, contentType);
        await postJson(`${api}/references`, { objectKey: slot.objectKey, name: file.name });
      }
      router.refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setProgress(null);
    }
  }

  async function remove(url: string) {
    if (!confirm("تمسح الملف ده؟")) return;
    await fetch(`${api}/references?url=${encodeURIComponent(url)}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <section className={styles.panel}>
      <h2>صورك وفيديوهاتك وطلباتك</h2>
      <p className={styles.hint}>
        اكتب الستايل اللي عايزه وارفع صورك وفيديوهاتك وأي ريفرنسات (من بنترست أو إنستجرام). فريقنا هيشتغل عليها ويكلمك.
      </p>
      <textarea
        className={styles.input}
        rows={4}
        maxLength={2000}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="الألوان، الستايل، لينكات ريفرنسات..."
      />
      <div className={styles.inlineActions}>
        <button type="button" className={styles.secondary} disabled={notes === savedNotes} onClick={saveNotes}>
          {notes === savedNotes && savedNotes ? "اتحفظ" : "حفظ الكلام"}
        </button>
      </div>
      <label className={styles.dropzone}>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
          disabled={progress !== null}
          onChange={(e) => upload(e.target.files)}
        />
        <span>{progress ?? "ارفع صور أو فيديوهات (لحد 50 ميجا للملف)"}</span>
      </label>
      {error && <p className={styles.error}>{error}</p>}
      {order.references && order.references.length > 0 && (
        <ul className={styles.refGrid}>
          {order.references.map((r) => (
            <li key={r.url}>
              {r.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element -- storage URLs
                <img src={r.url} alt={r.name} loading="lazy" />
              ) : (
                <video src={r.url} muted playsInline preload="metadata" controls />
              )}
              <button type="button" className={styles.iconBtn} onClick={() => remove(r.url)} aria-label={`مسح ${r.name}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
