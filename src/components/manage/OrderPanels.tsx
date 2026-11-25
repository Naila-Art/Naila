"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowUpRight,
  BookUser,
  Bookmark,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Clock,
  Clock3,
  CreditCard,
  ExternalLink,
  Eye,
  FileImage,
  Gem,
  Globe,
  Images,
  LayoutTemplate,
  Link2,
  Lock,
  MapPin,
  MessageCircle,
  MessageSquareText,
  Music,
  PenLine,
  Send,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import styles from "./manage.module.css";
import s from "./studio.module.css";
import store from "../store/store.module.css";
import OrderOptions from "../store/OrderOptions";
import { MusicPicker, TrackPreviewStrip } from "../store/MusicPicker";
import { EditorialDatePicker, EditorialSelect, type EditorialSelectOption } from "../store/EditorialControls";
import { CEREMONY_TIMES } from "../store/storeCopy";
import Icon from "../Icon";
import { CopyField, StatusSeal, StepRail } from "./Studio";
import { DETAIL_ERRORS } from "../store/Builder";
import { formatEgp, getPackage, type Pricing } from "@/lib/pricing";
import { musicParts } from "@/lib/music-catalog";
import { SiteLangProvider } from "@/lib/site-lang";
import { UPLOAD_ERRORS, UploadError, contentTypeOf, postJson, putFile } from "@/lib/upload-client";
import type { ChangeRequest, Lang, MusicTrack, Order, PackageId } from "@/lib/types";

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
  /** Cairo wall-clock time, "YYYY-MM-DDTHH:mm" */
  date: string;
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
  lang: Lang;
  templateId: string;
  musicTrackId: string;
  /** The invitation's opening line. */
  generalText: string;
  /** Guests confirm attendance (package 2+). */
  rsvp: boolean;
}

/** What the preview card needs to draw the chosen design. */
export interface PreviewDesign {
  name: string;
  posterUrl?: string;
  videoUrl?: string;
  background?: string;
}

interface Props {
  pricing: Pricing;
  manageToken: string;
  slug: string;
  order: Order;
  details: EventDetails;
  /** The event date, already formatted for people (Arabic, Cairo time). */
  dateLabel: string;
  design: PreviewDesign;
  features: { music: boolean; customMusic: boolean; maps: boolean; rsvp: boolean };
  /** Designs to switch to, names already in Arabic. */
  templates: { id: string; name: string }[];
  music: MusicTrack[];
  templateMusicMap: Record<string, string>;
  changeRequests: ChangeRequest[];
  /** Payment methods the client can use right now (switched on, and usable). */
  methods: ClientPaymentMethod[];
  whatsappUrl: string;
  isNew: boolean;
  returnedFromPayment: boolean;
  /** Absolute base for the links we show after payment, e.g. https://example.com */
  origin: string;
}

const ERRORS: Record<string, string> = {
  ...DETAIL_ERRORS,
  ...UPLOAD_ERRORS,
  already_paid: "الطلب ده اتدفع خلاص.",
  paymob_unavailable: "الدفع بالفيزا مش متاح دلوقتي، اختار طريقة تانية.",
  paymob_failed: "مقدرناش نفتح صفحة الدفع. جرب تاني أو اختار طريقة تانية.",
  invalid_method: "طريقة الدفع دي مش متاحة دلوقتي، اختار غيرها.",
  locked: "الطلب اتدفع، والتعديل دلوقتي من عندنا بس. كلمنا على واتساب.",
  link_invalid: "اللينك لازم يبدأ بـ https://",
  invalid_message: "اكتب التعديل اللي عايزه.",
  not_included: "ده مش في باقتك.",
  reference_wrong_type: "الملف لازم يكون صورة (JPG/PNG) أو فيديو (MP4/MOV) أو أغنية (MP3/M4A).",
  reference_too_large: "الملف أكبر من 50 ميجا.",
  too_many_files: "وصلت لأقصى عدد ملفات (30).",
};
const errorText = (err: unknown) => ERRORS[err instanceof UploadError ? err.code : "failed"] ?? ERRORS.failed;

/**
 * The order page (/order/{token}): checkout and payment, separate from the client's page.
 * Before payment the client can still edit everything; after payment it's read-only (our team edits).
 */
export default function OrderCheckout(props: Props) {
  const { order } = props;
  const api = `/api/manage/${encodeURIComponent(props.manageToken)}`;
  const unpaid = order.payment === "unpaid";
  const pkg = getPackage(props.pricing, order.packageId);
  return (
    // The package picker reads the site language; this page is Arabic.
    <SiteLangProvider initialLang="ar">
      <div className={s.orderGrid}>
        <div className={s.checkoutCol}>
          <PaymentPanel {...props} api={api} />
        </div>
        <div className={s.previewCol}>
          <PreviewCard {...props} />
        </div>
        <div className={s.editsCol}>
          {unpaid && (
            <section className={s.card} aria-labelledby="edits-title">
              <div>
                <p className={s.eyebrow}>
                  قبل ما تدفع
                </p>
                <h2 id="edits-title" className={s.cardTitle}>
                  عدّل اللي عايزه
                </h2>
                <p className={s.lead}>كل حاجة تتعدّل لحد ما تدفع، والمعاينة بتتحدّث على طول.</p>
              </div>
              <div className={s.drawers}>
                {order.kind === "self" && (
                  <Drawer icon={Gem} title="تغيير الباقة" sub={pkg ? `دلوقتي: ${pkg.name} · ${formatEgp(order.total)}` : ""}>
                    <OrderEditor
                      api={api}
                      order={order}
                      pricing={props.pricing}
                      music={props.music}
                      defaultTrackId={props.templateMusicMap[props.details.templateId] ?? ""}
                    />
                  </Drawer>
                )}
                <Drawer icon={PenLine} title="بيانات الدعوة" sub="الأسماء، الموعد، المكان، التصميم والموسيقى">
                  <DetailsEditor {...props} api={api} />
                </Drawer>
                {order.packageId >= 3 && (
                  <Drawer icon={Images} title="صورك وفيديوهاتك وطلباتك" sub="ارفع ملفاتك واكتب الستايل اللي عايزه">
                    <ReferencesPanel api={api} order={order} />
                  </Drawer>
                )}
                <Drawer
                  icon={MessageSquareText}
                  title="محتاج تعديل مش عارف تعمله؟"
                  sub="ابعتهولنا وفريقنا هيعمله"
                  defaultOpen={props.changeRequests.some((r) => !r.resolvedAt)}
                >
                  <ChangeRequests api={api} initial={props.changeRequests} whatsappUrl={props.whatsappUrl} />
                </Drawer>
              </div>
            </section>
          )}
          {!unpaid && order.packageId >= 3 && (
            <section className={s.card}>
              <ReferencesPanel api={api} order={order} locked />
            </section>
          )}
        </div>
      </div>
    </SiteLangProvider>
  );
}

function Drawer({
  icon: DrawerIcon,
  title,
  sub,
  defaultOpen,
  children,
}: {
  icon: LucideIcon;
  title: string;
  sub: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details className={s.drawer} open={defaultOpen}>
      <summary className={s.drawerHead}>
        <span className={s.drawerIcon} aria-hidden="true">
          <DrawerIcon size={18} strokeWidth={1.6} />
        </span>
        <span className={s.drawerText}>
          <span className={s.drawerTitle}>{title}</span>
          {sub && <span className={s.drawerSub}>{sub}</span>}
        </span>
        <ChevronDown size={18} strokeWidth={1.6} className={s.drawerChevron} aria-hidden="true" />
      </summary>
      <div className={s.drawerBody}>{children}</div>
    </details>
  );
}

/** The chosen design as a floating 9:16 invitation, watermarked until paid. */
function PreviewCard(props: Props) {
  const { design, details, order } = props;
  const paid = order.payment === "paid";
  const href = paid ? `/i/${props.slug}` : `/order/${encodeURIComponent(props.manageToken)}/preview`;
  const ar = details.lang === "ar";
  return (
    <aside className={`${s.card} ${s.previewCard}`} aria-label="معاينة الدعوة">
      <div className={s.cardTop}>
        <div>
          <p className={s.eyebrow}>
            {paid ? "دعوتك" : "معاينتك الخاصة"}
          </p>
          <h2 className={s.cardTitle}>{design.name}</h2>
        </div>
        <a className={s.iconBtn} href={href} target="_blank" rel="noopener noreferrer" aria-label={paid ? "افتح الدعوة" : "افتح المعاينة"}>
          <ArrowUpRight size={17} strokeWidth={1.7} aria-hidden="true" />
        </a>
      </div>

      <div className={s.stage}>
        {/* eslint-disable-next-line @next/next/no-img-element -- template art */}
        {design.posterUrl && <img className={s.stageBg} src={design.posterUrl} alt="" aria-hidden="true" />}
        <div className={s.invite} style={{ backgroundColor: design.background ?? "#29231f" }}>
          {design.videoUrl ? (
            <video className={s.inviteMedia} src={design.videoUrl} poster={design.posterUrl} autoPlay muted loop playsInline preload="metadata" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- template art
            design.posterUrl && <img className={s.inviteMedia} src={design.posterUrl} alt="" />
          )}
          <div className={s.inviteScrim} aria-hidden="true" />
          <div className={s.inviteCard} dir={ar ? "rtl" : "ltr"}>
            <p className={s.inviteEyebrow}>{details.generalText}</p>
            <p className={s.inviteCouple}>
              {details.partnerA} {ar ? "و" : "&"} {details.partnerB}
            </p>
            <span className={s.inviteDivider} aria-hidden="true" />
            <p className={s.inviteMeta}>
              {props.dateLabel}
              <br />
              {details.venueName}
              {details.venueAddress ? ` · ${details.venueAddress}` : ""}
            </p>
          </div>
          {!paid && (
            <span className={s.watermark}>
              <Lock size={12} strokeWidth={2} aria-hidden="true" /> معاينة
            </span>
          )}
        </div>
      </div>

      <a className={`${s.ghost} ${s.ctaWide}`} href={href} target="_blank" rel="noopener noreferrer">
        {paid ? <ExternalLink size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
        {paid ? "افتح الدعوة" : "شوف المعاينة كاملة"}
      </a>
      {!paid && (
        <p className={s.hint}>
          <Lock size={14} aria-hidden="true" />
          المعاينة عليها علامة &quot;معاينة&quot;. لينك الدعوة ولينكات الضيوف بيتفتحوا بعد الدفع على طول.
        </p>
      )}
    </aside>
  );
}

const methodIcon = (m: ClientPaymentMethod): LucideIcon =>
  m.kind === "card" ? CreditCard : /vodafone|wallet|cash|كاش/i.test(`${m.id} ${m.name}`) ? Smartphone : Wallet;

function PaymentPanel(props: Props & { api: string }) {
  const { order, methods, details } = props;
  const router = useRouter();
  const pkg = getPackage(props.pricing, order.packageId);
  const [approved, setApproved] = useState(false);
  const [methodId, setMethodId] = useState(methods[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const method = methods.find((m) => m.id === methodId);
  const previewUrl = `/order/${encodeURIComponent(props.manageToken)}/preview`;
  const couple = `${details.partnerA} ${details.lang === "ar" ? "و" : "&"} ${details.partnerB}`;
  const railStep = order.payment === "paid" ? 4 : order.payment === "pending_review" || approved ? 2 : 1;

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

  return (
    <section className={s.card} id="payment" aria-labelledby="order-title">
      <div className={s.cardTop}>
        <div>
          <p className={s.eyebrow}>
            طلبك
          </p>
          <h1 id="order-title" className={s.title}>
            <span dir="auto">{couple}</span>
          </h1>
          <p className={s.subtitle}>
            <span>
              <CalendarDays size={14} aria-hidden="true" /> {props.dateLabel}
            </span>
            <span>
              <MapPin size={14} aria-hidden="true" /> <bdi>{details.venueName}</bdi>
            </span>
          </p>
        </div>
        <StatusSeal payment={order.payment} />
      </div>

      <StepRail steps={["المعاينة", "الدفع", "دعوتك شغالة"]} current={railStep} />

      {props.isNew && order.payment === "unpaid" && (
        <div className={s.welcome}>
          <Bookmark size={20} strokeWidth={1.5} aria-hidden="true" />
          <div>
            <strong>دعوتك جاهزة للمعاينة</strong>
            دي صفحة طلبك، <b>احفظ اللينك ده عندك</b>. شوف المعاينة، عدّل اللي عايزه، وادفع لما تبقى مبسوط بيها.
          </div>
        </div>
      )}

      {(() => {
        const defaultTrackId = props.templateMusicMap[details.templateId] ?? "";
        const resolvedMusicId = props.features.customMusic ? (details.musicTrackId || defaultTrackId) : defaultTrackId;
        const resolvedTrack =
          resolvedMusicId && resolvedMusicId !== "none" ? props.music.find((m) => m.id === resolvedMusicId) : undefined;
        const musicLabel =
          resolvedMusicId === "none"
            ? "دخول هادئ بدون موسيقى"
            : resolvedTrack
              ? musicParts(resolvedTrack, "ar").title
              : "مختارة مع التصميم";

        return (
          <div className={s.receipt}>
            <div className={s.receiptRow}>
              <span>الباقة</span>
              <strong>
                {pkg?.name ?? "—"}
                {order.addons?.customMusic ? " · مع مكتبة الألحان" : ""}
              </strong>
            </div>
            <div className={s.receiptRow}>
              <span>التصميم</span>
              <strong>{props.design.name}</strong>
            </div>
            <div className={s.receiptRow}>
              <span>الموسيقى</span>
              <strong>{musicLabel}</strong>
            </div>
            <div className={s.receiptRow}>
              <span>لغة الدعوة</span>
              <strong>{details.lang === "ar" ? "عربي" : "English"}</strong>
            </div>
            {order.payment !== "unpaid" && order.paymentMethodName && (
              <div className={s.receiptRow}>
                <span>طريقة الدفع</span>
                <strong>{order.paymentMethodName}</strong>
              </div>
            )}
            <div className={s.receiptTear} aria-hidden="true" />
            <div className={s.receiptTotal}>
              <span>{order.payment === "paid" ? "المدفوع" : "الإجمالي"}</span>
              <strong>{formatEgp(order.total)}</strong>
            </div>
          </div>
        );
      })()}

      {order.payment === "paid" && <PaidLinks {...props} />}

      {order.payment === "pending_review" && (
        <div className={s.liveCard}>
          <h3>
            <Clock3 size={18} aria-hidden="true" /> بنراجع التحويل
          </h3>
          <p className={s.lead}>
            استلمنا صورة التحويل{order.paymentMethodName ? ` (${order.paymentMethodName})` : ""} وبنراجعها. أول ما نأكدها هتلاقي لينكاتك
            هنا، وهتوصلك على واتساب كمان.
          </p>
          {order.proofUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- storage URL
            <img className={s.proofThumb} src={order.proofUrl} alt="صورة التحويل" />
          )}
        </div>
      )}

      {order.payment === "unpaid" && (
        <>
          {props.returnedFromPayment && (
            <p className={s.note} role="status">
              <Clock size={16} aria-hidden="true" /> لو دفعت بالفيزا، التأكيد بيوصل خلال دقيقة. حدّث الصفحة.
            </p>
          )}
          {order.rejectReason && (
            <p className={s.error} role="alert">
              <CircleAlert size={16} aria-hidden="true" /> التحويل اللي بعته ماتأكدش: {order.rejectReason}
            </p>
          )}

          <div className={s.steps}>
            <div className={s.step} data-state={approved ? "done" : "current"}>
              <span className={s.stepNum} aria-hidden="true">
                {approved ? <Check size={16} strokeWidth={2.2} /> : "١"}
              </span>
              <div className={s.stepBody}>
                <h2 className={s.stepTitle}>راجع المعاينة</h2>
                <div className={s.actions}>
                  <a className={`${s.ghost} ${s.small}`} href={previewUrl} target="_blank" rel="noopener noreferrer">
                    <Eye size={15} aria-hidden="true" /> شوف المعاينة
                  </a>
                </div>
                <label className={s.approve}>
                  <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} />
                  <span className={s.checkbox} aria-hidden="true">
                    <Check size={14} strokeWidth={2.6} />
                  </span>
                  <span>شفت المعاينة والبيانات مظبوطة، وموافق عليها</span>
                </label>
              </div>
            </div>

            <div className={s.step} data-state={approved ? "current" : "locked"}>
              <span className={s.stepNum} aria-hidden="true">
                ٢
              </span>
              <div className={s.stepBody}>
                {methods.length === 0 ? (
                  <>
                    <h2 className={s.stepTitle}>الدفع</h2>
                    <p className={s.lead}>كلمنا على واتساب عشان تدفع.</p>
                    {props.whatsappUrl && (
                      <a className={`${s.ghost} ${s.small}`} href={props.whatsappUrl} target="_blank" rel="noopener noreferrer">
                        <MessageCircle size={15} aria-hidden="true" /> كلمنا واتساب
                      </a>
                    )}
                  </>
                ) : (
                  <fieldset className={s.methods} disabled={!approved || busy}>
                    <legend className={s.stepTitle}>اختار طريقة الدفع</legend>
                    <div className={s.methodGrid} role="radiogroup" aria-label="طريقة الدفع">
                      {methods.map((pm) => {
                        const MIcon = methodIcon(pm);
                        return (
                          <label key={pm.id} className={s.method} data-checked={pm.id === methodId}>
                            <input type="radio" name="method" checked={pm.id === methodId} onChange={() => setMethodId(pm.id)} />
                            <span className={s.methodIcon} aria-hidden="true">
                              <MIcon size={19} strokeWidth={1.6} />
                            </span>
                            <span className={s.methodText}>
                              <strong>{pm.name}</strong>
                              <small>{pm.kind === "card" ? "ادفع أونلاين وتتفتح على طول" : "حوّل وارفع صورة التحويل"}</small>
                            </span>
                            <span className={s.radio} aria-hidden="true" />
                          </label>
                        );
                      })}
                    </div>

                    {method?.kind === "card" && (
                      <>
                        <button type="button" className={`${s.cta} ${s.ctaWide}`} onClick={payWithCard}>
                          <Lock size={16} aria-hidden="true" />
                          {busy ? "بنفتح صفحة الدفع..." : "ادفع"} <span className={s.ctaPrice}>{formatEgp(order.total)}</span>
                        </button>
                        <p className={s.trust}>
                          <ShieldCheck size={14} aria-hidden="true" /> دفع آمن عن طريق Paymob، وبيانات الكارت مش بتعدي علينا
                        </p>
                      </>
                    )}

                    {method?.kind === "transfer" && (
                      <form className={s.transfer} onSubmit={sendProof}>
                        <p>
                          حوّل <strong>{formatEgp(order.total)}</strong> {method.name} على:
                        </p>
                        <CopyField value={method.account} icon={methodIcon(method)} />
                        {method.instructions && (
                          <p className={s.hint}>
                            <CircleAlert size={14} aria-hidden="true" /> {method.instructions}
                          </p>
                        )}
                        <label className={`${s.dropzone} ${s.dropzoneCompact}`}>
                          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setProof(e.target.files?.[0] ?? null)} />
                          <span className={s.dropIcon} aria-hidden="true">
                            {proof ? <FileImage size={17} /> : <Upload size={17} />}
                          </span>
                          <span>
                            <strong>{proof ? proof.name : "ارفع صورة التحويل"}</strong>
                            <small>{proof ? "دوس عشان تغيّرها" : "سكرين شوت من الأبلكيشن (JPG أو PNG)"}</small>
                          </span>
                        </label>
                        <button type="submit" className={`${s.cta} ${s.ctaWide}`} disabled={!proof}>
                          <Send size={16} aria-hidden="true" /> {busy ? "بيترفع..." : "ابعت صورة التحويل"}
                        </button>
                      </form>
                    )}
                  </fieldset>
                )}
                {!approved && methods.length > 0 && (
                  <p className={s.hint}>
                    <Lock size={14} aria-hidden="true" /> علّم على الموافقة الأول عشان تقدر تدفع.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {error && (
        <p className={s.error} role="alert">
          <CircleAlert size={16} aria-hidden="true" /> {error}
        </p>
      )}
    </section>
  );
}

function OrderEditor({
  api,
  order,
  pricing,
  music,
  defaultTrackId,
}: {
  api: string;
  order: Order;
  pricing: Pricing;
  music: MusicTrack[];
  defaultTrackId: string;
}) {
  const router = useRouter();
  const [packageId, setPackageId] = useState<PackageId>(order.packageId);
  const [customMusicAddon, setCustomMusicAddon] = useState(Boolean(order.addons?.customMusic));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const changed =
    packageId !== order.packageId ||
    (packageId === 1 && customMusicAddon !== Boolean(order.addons?.customMusic));

  async function save() {
    setBusy(true);
    setError("");
    try {
      await postJson(
        `${api}/order`,
        { packageId, customMusicAddon: packageId === 1 ? customMusicAddon : false },
        "PUT",
      );
      router.refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <OrderOptions
        pricing={pricing}
        packageId={packageId}
        onChange={setPackageId}
        music={music}
        defaultTrackId={defaultTrackId}
        customMusicAddon={customMusicAddon}
        onCustomMusicAddonChange={setCustomMusicAddon}
      />
      {error && (
        <p className={s.error}>
          <CircleAlert size={16} aria-hidden="true" /> {error}
        </p>
      )}
      <div className={s.actions}>
        <button type="button" className={s.cta} disabled={!changed || busy} onClick={save}>
          <Check size={16} aria-hidden="true" /> حفظ الباقة
        </button>
      </div>
    </>
  );
}

function DetailsEditor(props: Props & { api: string }) {
  const router = useRouter();
  const [d, setD] = useState(props.details);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (patch: Partial<EventDetails>) => setD((x) => ({ ...x, ...patch }));
  const [day, time] = d.date.split("T");

  const timeOptions = useMemo<EditorialSelectOption[]>(() => {
    const list = CEREMONY_TIMES.map((t) => ({ value: t.value, label: t.labelAr, sublabel: t.subAr }));
    const current = props.details.date.split("T")[1];
    if (current && !list.some((o) => o.value === current)) list.unshift({ value: current, label: current, sublabel: "الميعاد الحالي" });
    return list;
  }, [props.details.date]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await postJson(`${props.api}/details`, { ...d, musicTrackId: props.features.customMusic ? d.musicTrackId : undefined }, "PUT");
      setMsg({ ok: true, text: "اتحفظ، والمعاينة اتحدّثت" });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: errorText(err) });
    } finally {
      setBusy(false);
    }
  }

  const defaultTrackId = props.templateMusicMap[d.templateId] ?? "";
  const defaultTrack =
    defaultTrackId && defaultTrackId !== "none" ? props.music.find((m) => m.id === defaultTrackId) : undefined;

  return (
    <form className={s.form} onSubmit={save}>
      <label className={store.field}>
        <span>الجملة اللي في أول الدعوة</span>
        <input dir="auto" value={d.generalText} maxLength={200} onChange={(e) => set({ generalText: e.target.value })} />
      </label>
      <div className={store.row}>
        <label className={store.field}>
          <span>الاسم الأول</span>
          <input dir="auto" value={d.partnerA} onChange={(e) => set({ partnerA: e.target.value })} maxLength={40} />
        </label>
        <label className={store.field}>
          <span>الاسم التاني</span>
          <input dir="auto" value={d.partnerB} onChange={(e) => set({ partnerB: e.target.value })} maxLength={40} />
        </label>
      </div>
      <div className={store.row}>
        <div className={store.field}>
          <span>اليوم</span>
          <EditorialDatePicker value={day ?? ""} onChange={(v) => v && set({ date: `${v}T${time || "19:00"}` })} ariaLabel="يوم الفرح" locale="ar" inline />
        </div>
        <div className={store.field}>
          <span>الساعة (بتوقيت مصر)</span>
          <EditorialSelect
            value={time ?? ""}
            onChange={(t) => set({ date: `${day}T${t}` })}
            options={timeOptions}
            placeholder="اختار الساعة"
            ariaLabel="الساعة"
            dir="rtl"
            icon={<Clock size={15} strokeWidth={1.5} aria-hidden="true" />}
          />
        </div>
      </div>
      <div className={store.row}>
        <label className={store.field}>
          <span>المكان</span>
          <input dir="auto" value={d.venueName} onChange={(e) => set({ venueName: e.target.value })} maxLength={80} />
        </label>
        <label className={store.field}>
          <span>العنوان</span>
          <input dir="auto" value={d.venueAddress} onChange={(e) => set({ venueAddress: e.target.value })} maxLength={120} />
        </label>
      </div>
      {props.features.maps && (
        <label className={store.field}>
          <span>لينك جوجل ماب أو آبل ماب</span>
          <input type="url" dir="ltr" value={d.mapsUrl} placeholder="https://maps.app.goo.gl/..." onChange={(e) => set({ mapsUrl: e.target.value })} />
        </label>
      )}
      <div className={store.row}>
        <div className={store.field}>
          <span>التصميم</span>
          <EditorialSelect
            value={d.templateId}
            onChange={(templateId) => set({ templateId })}
            options={props.templates.map((t) => ({ value: t.id, label: t.name }))}
            ariaLabel="التصميم"
            dir="rtl"
            icon={<LayoutTemplate size={15} strokeWidth={1.5} aria-hidden="true" />}
          />
        </div>
        <div className={store.field}>
          <span>لغة الدعوة</span>
          <EditorialSelect
            value={d.lang}
            onChange={(lang) => set({ lang: lang as Lang })}
            options={[
              { value: "ar", label: "عربي" },
              { value: "en", label: "English" },
            ]}
            ariaLabel="لغة الدعوة"
            dir="rtl"
            icon={<Globe size={15} strokeWidth={1.5} aria-hidden="true" />}
          />
        </div>
      </div>
      {props.features.customMusic && props.music.length > 0 ? (
        <div className={store.field}>
          <span>الموسيقى المصاحبة للدعوة</span>
          <MusicPicker
            tracks={props.music}
            value={d.musicTrackId}
            onChange={(musicTrackId) => set({ musicTrackId })}
            defaultTrackId={defaultTrackId}
            lang="ar"
            variant="light"
            defaultValueMode="empty"
          />
        </div>
      ) : (
        defaultTrack && (
          <div className={store.field}>
            <span>الموسيقى المصاحبة للدعوة</span>
            <TrackPreviewStrip
              track={defaultTrack}
              lang="ar"
              label="موسيقى هذا التصميم"
              sublabel="لتغيير المقطوعة، فعّل مكتبة الألحان أو اختار الباقة المميزة من قسم الباقة"
            />
          </div>
        )
      )}
      {props.features.rsvp && (
        <label className={s.switchRow}>
          <span>الضيوف يأكدوا حضورهم ويقولوا جايين كام فرد</span>
          <input type="checkbox" checked={d.rsvp} onChange={(e) => set({ rsvp: e.target.checked })} />
          <span className={s.switch} aria-hidden="true" />
        </label>
      )}
      {msg && (
        <p className={msg.ok ? s.success : s.error} role="status">
          {msg.ok ? <CircleCheck size={16} aria-hidden="true" /> : <CircleAlert size={16} aria-hidden="true" />} {msg.text}
        </p>
      )}
      <div className={s.actions}>
        <button type="submit" className={s.cta} disabled={busy}>
          <Check size={16} aria-hidden="true" /> {busy ? "بيتحفظ..." : "حفظ التعديلات"}
        </button>
      </div>
    </form>
  );
}

export function ChangeRequests({ api, initial, whatsappUrl }: { api: string; initial: ChangeRequest[]; whatsappUrl: string }) {
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
    <>
      <form className={s.form} onSubmit={send}>
        <textarea
          className={s.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          rows={3}
          aria-label="التعديل اللي عايزه"
          placeholder="مثلاً: عايز لون الختم دهبي، أو التصميم يبقى من غير..."
        />
        {error && (
          <p className={s.error}>
            <CircleAlert size={16} aria-hidden="true" /> {error}
          </p>
        )}
        <div className={s.actions}>
          <button type="submit" className={s.cta} disabled={busy || !text.trim()}>
            <Send size={16} aria-hidden="true" /> ابعت طلب التعديل
          </button>
          {whatsappUrl && (
            <a className={s.quiet} href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={16} aria-hidden="true" /> أو كلمنا واتساب
            </a>
          )}
        </div>
      </form>
      {list.length > 0 && (
        <ul className={s.requestList}>
          {list.map((r) => (
            <li key={r.id}>
              <span>{r.body}</span>
              <span className={`${s.badge} ${r.resolvedAt ? s.toneOk : s.toneInfo}`}>
                {r.resolvedAt ? <Check size={12} aria-hidden="true" /> : <Clock3 size={12} aria-hidden="true" />}
                {r.resolvedAt ? "اتعمل" : "وصلنا"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/**
 * Package 3+: what the client wants, plus their photos / videos / songs for our team.
 * Editable before payment only; after that it's what the client sent, read-only.
 */
export function ReferencesPanel({ api, order, locked = false }: { api: string; order: Order; locked?: boolean }) {
  const router = useRouter();
  const [notes, setNotes] = useState(order.brief?.notes ?? "");
  const [link, setLink] = useState(order.brief?.link ?? "");
  const [saved, setSaved] = useState({ notes: order.brief?.notes ?? "", link: order.brief?.link ?? "" });
  const dirty = notes !== saved.notes || link !== saved.link;
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function saveNotes() {
    setError("");
    try {
      await postJson(`${api}/references`, { notes, link }, "PUT");
      setSaved({ notes, link });
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

  const files = order.references ?? [];

  if (locked) {
    return (
      <>
        <div>
          <p className={s.eyebrow}>
            ملفاتك
          </p>
          <h2 className={s.cardTitle}>اللي بعتهولنا</h2>
          <p className={s.lead}>فريقنا شغال عليه. لو محتاج تضيف حاجة كلمنا على واتساب.</p>
        </div>
        {order.brief?.notes && <p className={s.briefText}>{order.brief.notes}</p>}
        {order.brief?.link && (
          <a href={order.brief.link} target="_blank" rel="noopener noreferrer" dir="ltr" className={s.briefLink}>
            {order.brief.link}
          </a>
        )}
        {files.length > 0 ? (
          <ReferenceList files={files} />
        ) : (
          !order.brief?.notes && !order.brief?.link && <p className={s.hint}>مابعتش ملفات.</p>
        )}
      </>
    );
  }

  return (
    <>
      <p className={s.lead}>اكتب الستايل اللي عايزه وارفع صورك وفيديوهاتك والأغاني وأي ريفرنسات، أو حط لينك درايف.</p>
      <label className={store.field}>
        <span>الستايل اللي في دماغك</span>
        <textarea rows={4} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="الألوان، الستايل، لينكات ريفرنسات..." />
      </label>
      <div className={s.inputWrap}>
        <Link2 size={16} aria-hidden="true" />
        <input
          className={s.input}
          type="url"
          dir="ltr"
          inputMode="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          aria-label="لينك درايف"
          placeholder="لينك درايف أو أي لينك فيه ملفاتك (اختياري)"
        />
      </div>
      <div className={s.actions}>
        <button type="button" className={`${s.ghost} ${s.small}`} disabled={!dirty} onClick={saveNotes}>
          <Check size={15} aria-hidden="true" /> {!dirty && (saved.notes || saved.link) ? "اتحفظ" : "حفظ"}
        </button>
      </div>
      <label className={s.dropzone}>
        <input type="file" multiple accept={REFERENCE_ACCEPT} disabled={progress !== null} onChange={(e) => upload(e.target.files)} />
        <span className={s.dropIcon} aria-hidden="true">
          <Upload size={18} />
        </span>
        <strong>{progress ?? "ارفع صور أو فيديوهات أو أغاني"}</strong>
        <small>لحد 50 ميجا للملف · لحد 30 ملف</small>
      </label>
      {error && (
        <p className={s.error}>
          <CircleAlert size={16} aria-hidden="true" /> {error}
        </p>
      )}
      {files.length > 0 && <ReferenceList files={files} onRemove={remove} />}
    </>
  );
}

/** Photos and videos as thumbnails, songs as players. */
function ReferenceList({ files, onRemove }: { files: NonNullable<Order["references"]>; onRemove?: (url: string) => void }) {
  return (
    <ul className={s.refGrid}>
      {files.map((r) => (
        <li key={r.url} data-type={r.type}>
          {r.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element -- storage URLs
            <img src={r.url} alt={r.name} loading="lazy" />
          ) : r.type === "audio" ? (
            <div className={s.refAudio}>
              <Music size={17} aria-hidden="true" />
              <span>{r.name}</span>
              <audio src={r.url} controls preload="none" />
            </div>
          ) : (
            <video src={r.url} muted playsInline preload="metadata" controls />
          )}
          {onRemove && (
            <button type="button" className={`${s.iconBtn} ${s.iconBtnDanger} ${s.refRemove}`} onClick={() => onRemove(r.url)} aria-label={`مسح ${r.name}`}>
              <Trash2 size={14} aria-hidden="true" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

/** What the reference picker accepts (same list as the server). */
export const REFERENCE_ACCEPT = "image/jpeg,image/png,image/webp,video/mp4,video/quicktime,audio/mpeg,audio/mp4,audio/x-m4a,.mp3,.m4a,.mov";

/** Payment state, large and unmistakable (status colour + icon + words). */
export function PayStatus({ payment, cancelled }: { payment: Order["payment"]; cancelled?: boolean }) {
  if (cancelled)
    return (
      <span className={`${styles.payStatus} ${styles.payCancelled}`}>
        <Icon name="xCircle" size={16} /> ملغي
      </span>
    );
  if (payment === "paid")
    return (
      <span className={`${styles.payStatus} ${styles.payPaid}`}>
        <Icon name="checkCircle" size={16} /> مدفوع
      </span>
    );
  if (payment === "pending_review")
    return (
      <span className={`${styles.payStatus} ${styles.payPending}`}>
        <Icon name="clock" size={16} /> مستني تأكيد
      </span>
    );
  return (
    <span className={`${styles.payStatus} ${styles.payUnpaid}`}>
      <Icon name="alert" size={16} /> مش مدفوع
    </span>
  );
}

/** After payment: the invitation link (everyone) and the client's page (packages 2+). */
function PaidLinks(props: Props) {
  const { order } = props;
  const invitation = `${props.origin}/i/${props.slug}`;
  const page = `${props.origin}/c/${props.manageToken}`;
  return (
    <>
      <div className={s.liveCard}>
        <h3>
          <Link2 size={18} aria-hidden="true" /> لينك الدعوة
        </h3>
        <p className={s.hint}>ابعته لأي حد، في أي مكان.</p>
        <CopyField value={invitation} />
      </div>
      {order.packageId >= 2 && (
        <div className={s.liveCard}>
          <h3>
            <BookUser size={18} aria-hidden="true" /> صفحتك
          </h3>
          <p className={s.hint}>
            {order.packageId >= 3
              ? "منها تضيف ضيوفك بالاسم ورسالة خاصة لكل واحد، وتشوف مين فتح الدعوة والتهاني."
              : "منها تشوف مين فتح الدعوة والتهاني اللي اتكتبت."}
          </p>
          <a className={`${s.cta} ${s.ctaWide}`} href={page}>
            <ArrowUpRight size={16} aria-hidden="true" /> افتح صفحتك
          </a>
        </div>
      )}
    </>
  );
}
