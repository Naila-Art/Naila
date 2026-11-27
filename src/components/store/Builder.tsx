"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Icon from "../Icon";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileImage,
  FileMusic,
  FileVideo,
  Languages,
  Plus,
  X,
} from "lucide-react";
import styles from "./store.module.css";
import OrderOptions from "./OrderOptions";
import TemplateGallery, { TemplateThumb } from "./TemplateGallery";
import { EditorialDatePicker, EditorialSelect, type EditorialSelectOption } from "./EditorialControls";
import { CEREMONY_TIMES, DETAIL_ERRORS_BY_LANG, STORE_COPY, formatStorePrice, packageDisplayName } from "./storeCopy";
import { useSiteLang } from "@/lib/site-lang";
import { normalizePhone } from "@/lib/guests";
import { getPackage, isSelfServe, priceOf, type Pricing } from "@/lib/pricing";
import { musicParts } from "@/lib/music-catalog";
import { TEMPLATE_EDITORIAL_META, templateDisplayName } from "@/lib/templates";
import { UploadError, contentTypeOf, postJson, putFile } from "@/lib/upload-client";
import { normalizeSlug, slugProblem, suggestSlug } from "@/lib/slug";
import type { Category, Lang, MusicTrack, PackageId, Template } from "@/lib/types";
import { localeHref } from "@/lib/locale";

interface Props {
  pricing: Pricing;
  templates: Template[];
  music: MusicTrack[];
  templateMusicMap: Record<string, string>;
  initialTemplateId?: string;
  initialPackageId?: PackageId;
  initialMusicTrackId?: string;
  /** Our business WhatsApp (digits only), for the "fully custom" card. */
  whatsappNumber?: string;
}

/** Arabic messages, kept for the client order page (OrderPanels) and the request form. */
export const DETAIL_ERRORS: Record<string, string> = DETAIL_ERRORS_BY_LANG.ar;

/** Ready-made opening lines per occasion, in the invitation's language. */
const TEXT_SUGGESTIONS: Record<Category, Record<Lang, string[]>> = {
  wedding: {
    ar: ["يشرفنا حضوركم حفل زفافنا", "بكل الحب ندعوكم لمشاركتنا فرحتنا", "تتشرف العائلتان بدعوتكم لحضور حفل زفاف"],
    en: ["Together with their families, invite you to celebrate their wedding", "Request the pleasure of your company"],
  },
  engagement: {
    ar: ["يسعدنا مشاركتكم فرحة خطوبتنا", "بكل الحب ندعوكم لحفل خطوبتنا"],
    en: ["Invite you to celebrate their engagement"],
  },
  katb_kitab: {
    ar: ["يشرفنا حضوركم عقد قراننا", "ندعوكم لمشاركتنا كتب كتابنا"],
    en: ["Invite you to witness their marriage contract"],
  },
};

type QuestionId = "names" | "design" | "date" | "venue" | "maps" | "text" | "package" | "materials" | "rsvp" | "contact" | "link";

interface Question {
  id: QuestionId;
  /** Which of the three studio phases it belongs to (the preview rail). */
  phase: 1 | 2 | 3;
  optional?: boolean;
  title: Record<Lang, string>;
  hint?: Record<Lang, string>;
}

const QUESTIONS: Question[] = [
  {
    id: "names",
    phase: 1,
    title: { en: "Who's getting married?", ar: "مين العريس والعروسة؟" },
    hint: {
      en: "We'll write your names on every design, so you choose seeing exactly how it looks.",
      ar: "هنكتب أساميكم على كل التصميمات عشان تختاري وانتي شايفة شكلها.",
    },
  },
  {
    id: "design",
    phase: 2,
    title: { en: "Choose your design", ar: "اختاري التصميم" },
    hint: {
      en: "Every design shows your names. You can change it any time before paying.",
      ar: "كل تصميم ظاهر بأساميكم. تقدري تغيريه بعدين قبل الدفع.",
    },
  },
  {
    id: "date",
    phase: 1,
    title: { en: "When is the big night?", ar: "إمتى الفرح؟" },
    hint: { en: "Cairo time. The countdown on your invitation runs to it.", ar: "بتوقيت مصر. العد التنازلي في الدعوة بيتحسب منه." },
  },
  { id: "venue", phase: 1, title: { en: "Where is it?", ar: "فين الفرح؟" } },
  {
    id: "maps",
    phase: 1,
    optional: true,
    title: { en: "The venue on the map", ar: "لينك المكان على الخريطة" },
    hint: {
      en: "Guests tap once and they're on their way. Open the place in Google or Apple Maps → Share → Copy link.",
      ar: "الضيوف يدوسوا عليه مرة ويوصلوا. افتحي المكان على جوجل ماب أو آبل ماب ← مشاركة ← نسخ اللينك.",
    },
  },
  {
    id: "text",
    phase: 1,
    optional: true,
    title: { en: "The opening line", ar: "أول جملة في الدعوة" },
    hint: { en: "Pick one of these or write your own.", ar: "اختاري واحدة من دول أو اكتبي بتاعتك." },
  },
  {
    id: "package",
    phase: 2,
    title: { en: "Choose your suite", ar: "اختاري الباقة" },
    hint: { en: "You'll see the whole invitation before you pay.", ar: "هتشوفي الدعوة كاملة قبل ما تدفعي." },
  },
  {
    id: "materials",
    phase: 2,
    optional: true,
    title: { en: "Send us your photos, videos and songs", ar: "ابعتيلنا صورك وفيديوهاتك والأغاني" },
    hint: {
      en: "Plus any references or notes on the style you want, or a Drive link with your files. Our team works from them, and you can add or remove files from your order page until you pay.",
      ar: "وأي ريفرنسات أو كلام عن الستايل اللي عايزاه، أو لينك درايف فيه ملفاتك. فريقنا هيشتغل عليهم، وتقدري تزودي أو تشيلي من صفحة طلبك لحد ما تدفعي.",
    },
  },
  {
    id: "rsvp",
    phase: 2,
    title: { en: "Should guests confirm they're coming?", ar: "عايزة الضيوف يأكدوا حضورهم؟" },
    hint: {
      en: "Each guest answers coming, maybe or not, and how many; you see the totals on your page.",
      ar: "كل ضيف يقول جاي ولا يمكن ولا لأ، وجايين كام فرد، وانتي تشوفي العدد كله في صفحتك.",
    },
  },
  {
    id: "contact",
    phase: 3,
    title: { en: "Your details", ar: "بياناتك" },
    hint: {
      en: "We'll send your order page link, and the invitation link once it's paid.",
      ar: "هنبعتلك لينك صفحة طلبك، ولينك الدعوة بعد الدفع.",
    },
  },
  {
    id: "link",
    phase: 3,
    optional: true,
    title: { en: "Choose your invitation link", ar: "اختاري لينك دعوتك" },
    hint: {
      en: "English letters, numbers and dashes. Skip it and we'll make one for you.",
      ar: "حروف إنجليزي وأرقام وشرطة. لو اتخطيتي هنعملك لينك تلقائي.",
    },
  },
];

const UI = {
  en: {
    questionOf: (n: number, t: number) => `Question ${n} of ${t}`,
    review: "Review",
    reviewTitle: "Review your answers",
    reviewHint: "Everything in one place. Fix anything here — nothing is created and nothing is paid until you say so.",
    reviewAfter: "Next you'll see the whole invitation, and pay only once you love it.",
    skipped: "Skipped",
    notYet: "Not yet",
    edit: "Edit",
    next: "Next",
    save: "Save",
    toReview: "Review",
    skip: "Skip",
    submit: "Create my invitation",
    submitting: "One moment…",
    uploading: (i: number, n: number) => `Uploading your files ${i} of ${n}…`,
    total: "Total",
    yes: "Yes",
    recommended: "Recommended",
    no: "No",
    mapsAdded: "Added",
    autoLink: "Automatic link",
    checking: "Checking…",
    available: (url: string) => `Available: ${url}`,
    files: (n: number) => `${n} files`,
    link: "link",
    notes: "notes",
    briefLabel: "Tell us what you'd like (style, colours, the song…)",
    dropzone: "Choose photos, videos or songs (up to 50 MB each)",
    driveLabel: "Or a Drive link with your files (optional)",
    filesNote: "Files upload when you press “Create my invitation” at the end. If you close the page first, you'll need to choose them again.",
    mb: "MB",
    remove: (name: string) => `Remove ${name}`,
    contactNote: "Your order page is where you preview, edit and pay. The invitation link reaches you on WhatsApp after payment.",
    package3Note: "With this suite you add your guests by name, each with a personal message, from your page.",
    mapsField: "Google or Apple Maps link",
    venueName: "Venue name",
    address: "Address (optional)",
    linkAria: "Invitation link",
    noDesigns: "Designs are on their way.",
    editAnswer: "Edit",
  },
  ar: {
    questionOf: (n: number, t: number) => `سؤال ${n} من ${t}`,
    review: "المراجعة",
    reviewTitle: "راجعي إجاباتك",
    reviewHint: "كل إجاباتك في مكان واحد. لو في حاجة غلط عدليها من هنا. مش هنعمل حاجة ولا هتدفعي غير لما تقولي.",
    reviewAfter: "بعد الخطوة دي هتشوفي الدعوة كاملة، وتدفعي لما تبقي مبسوطة بيها.",
    skipped: "اتخطى",
    notYet: "لسه",
    edit: "تعديل",
    next: "التالي",
    save: "حفظ",
    toReview: "راجعي",
    skip: "تخطي",
    submit: "اعملي الدعوة وشوفيها",
    submitting: "ثانية...",
    uploading: (i: number, n: number) => `بيرفع ملفاتك ${i} من ${n}...`,
    total: "الإجمالي",
    yes: "أيوه",
    recommended: "ننصح بيه",
    no: "لأ",
    mapsAdded: "اتضاف",
    autoLink: "لينك تلقائي",
    checking: "بنشوف...",
    available: (url: string) => `متاح: ${url}`,
    files: (n: number) => `${n} ملف`,
    link: "لينك",
    notes: "كلام",
    briefLabel: "احكيلنا عايزة إيه (الستايل، الألوان، الأغنية...)",
    dropzone: "اختاري صور أو فيديوهات أو أغاني (لحد ٥٠ ميجا للملف)",
    driveLabel: "أو لينك درايف فيه ملفاتك (اختياري)",
    filesNote: "الملفات بتترفع لما تضغطي «اعملي الدعوة» في الآخر. لو قفلتي الصفحة قبلها هتحتاجي تختاريها تاني.",
    mb: "ميجا",
    remove: (name: string) => `شيلي ${name}`,
    contactNote: "صفحة طلبك منها تشوفي المعاينة وتعدلي وتدفعي. ولينك الدعوة هيوصلك على واتساب بعد الدفع.",
    package3Note: "في الباقة دي هتضيفي ضيوفك بالاسم ورسالة خاصة لأي حد من صفحتك.",
    mapsField: "لينك جوجل ماب أو آبل ماب",
    venueName: "اسم المكان",
    address: "العنوان (اختياري)",
    linkAria: "لينك الدعوة",
    noDesigns: "التصميمات بتترفع قريب.",
    editAnswer: "تعديل",
  },
} as const;

const DRAFT_KEY = "builder-draft-v3";
const OLD_DRAFT_KEYS = ["builder-draft-v2", "builder-draft-v1"];

/** Package 3+ files: same limits as the server (see UPLOAD_RULES.reference). */
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "audio/mpeg", "audio/mp4", "audio/x-m4a"];
const ACCEPT_ATTR = `${ACCEPTED.join(",")},.mp3,.m4a,.mov`;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_FILES = 30;

const MAPS_URL = /^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps|share\.google\/|maps\.apple\.com|maps\.apple\/)\b/i;

interface Draft {
  /** The question on screen; "review" = the summary page. */
  at: QuestionId | "review";
  /** Came from the review page: saving goes back there. */
  fromReview: boolean;
  templateId: string;
  lang: Lang;
  partnerA: string;
  partnerB: string;
  /** "YYYY-MM-DD" and "HH:mm", combined on submit. */
  day: string;
  time: string;
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
  generalText: string;
  packageId: PackageId;
  musicTrackId: string;
  customMusicAddon: boolean;
  brief: string;
  /** Package 3+: a link to the client's files (e.g. Google Drive). */
  briefLink: string;
  rsvp: boolean | null;
  clientName: string;
  clientPhone: string;
  slug: string;
  /** Optional questions the client skipped. */
  skipped: QuestionId[];
}

type SlugState = { slug: string; status: "idle" | "checking" | "ok" | "bad"; reason?: string };

/**
 * The storefront studio. Left: one question at a time, like a chat — each answer is kept in this
 * browser as soon as it's given, optional ones can be skipped, and a review page lists every answer
 * with an edit button. Right: the chosen design with the couple's details, live. Creates a draft
 * order the client previews (and pays for) on /order/{token}.
 */
export default function Builder({
  pricing,
  templates,
  music,
  templateMusicMap,
  initialTemplateId,
  initialPackageId,
  initialMusicTrackId,
  whatsappNumber = "",
}: Props) {
  const { lang: uiLang, toggleLang } = useSiteLang();
  const isUiAr = uiLang === "ar";
  const copy = STORE_COPY[uiLang];
  const b = copy.builder;
  const ui = UI[uiLang];
  const errors = DETAIL_ERRORS_BY_LANG[uiLang];

  const onSale = pricing.packages.filter((p) => p.active && isSelfServe(p.id)).map((p) => p.id);
  const firstTemplate = templates.some((t) => t.id === initialTemplateId) ? initialTemplateId! : (templates[0]?.id ?? "");
  const firstPackage = initialPackageId && onSale.includes(initialPackageId) ? initialPackageId : (onSale[0] ?? 1);
  const validInitialTrack =
    initialMusicTrackId &&
    (initialMusicTrackId === "none" || music.some((m) => m.id === initialMusicTrackId)) &&
    initialMusicTrackId !== templateMusicMap[firstTemplate]
      ? initialMusicTrackId
      : "";

  const [d, setD] = useState<Draft>({
    at: "names",
    fromReview: false,
    templateId: firstTemplate,
    lang: uiLang,
    partnerA: "",
    partnerB: "",
    day: "",
    time: "19:00",
    venueName: "",
    venueAddress: "",
    mapsUrl: "",
    generalText: "",
    packageId: firstPackage,
    musicTrackId: validInitialTrack,
    customMusicAddon: Boolean(validInitialTrack && firstPackage === 1),
    brief: "",
    briefLink: "",
    rsvp: null,
    clientName: "",
    clientPhone: "",
    slug: "",
    skipped: [],
  });
  const [errorCode, setErrorCode] = useState("");
  const [busy, setBusy] = useState(false);
  /** Package 3+ files, kept in memory until the order exists (a browser can't save them for later). */
  const [files, setFiles] = useState<File[]>([]);
  const [uploadMsg, setUploadMsg] = useState("");
  const [slugState, setSlugState] = useState<SlugState>({ slug: "", status: "idle" });
  // Read after mount so the server and browser render the same thing first.
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.host), []);
  const restored = useRef(false);
  const topRef = useRef<HTMLFormElement>(null);
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));

  // Restore a draft from this browser (unless the link chose a specific design or package).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY) ?? OLD_DRAFT_KEYS.map((k) => localStorage.getItem(k)).find(Boolean) ?? "null";
      const saved = JSON.parse(raw) as (Partial<Draft> & { date?: string }) | null;
      if (saved && typeof saved === "object") {
        setD((x) => {
          // Older drafts kept the date as one "YYYY-MM-DDTHH:mm" string.
          const [oldDay, oldTime] = typeof saved.date === "string" && saved.date.includes("T") ? saved.date.split("T") : [];
          const merged: Draft = {
            ...x,
            ...saved,
            day: saved.day ?? oldDay ?? x.day,
            time: saved.time ?? oldTime ?? x.time,
            templateId:
              initialTemplateId && templates.some((t) => t.id === initialTemplateId)
                ? initialTemplateId
                : saved.templateId && templates.some((t) => t.id === saved.templateId)
                  ? saved.templateId
                  : x.templateId,
            packageId:
              initialPackageId && onSale.includes(initialPackageId)
                ? initialPackageId
                : saved.packageId && onSale.includes(saved.packageId)
                  ? saved.packageId
                  : x.packageId,
            musicTrackId: validInitialTrack
              ? validInitialTrack
              : typeof saved.musicTrackId === "string"
                ? saved.musicTrackId
                : x.musicTrackId,
            customMusicAddon: validInitialTrack
              ? firstPackage === 1
              : Boolean(saved.customMusicAddon),
            skipped: Array.isArray(saved.skipped) ? saved.skipped : [],
            rsvp: typeof saved.rsvp === "boolean" ? saved.rsvp : null,
            slug: typeof saved.slug === "string" ? saved.slug : "",
            briefLink: typeof saved.briefLink === "string" ? saved.briefLink : "",
            fromReview: false,
          };
          if (!QUESTIONS.some((q) => q.id === merged.at) && merged.at !== "review") merged.at = "names";
          return merged;
        });
      }
    } catch {}
    restored.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
      for (const k of OLD_DRAFT_KEYS) localStorage.removeItem(k);
    } catch {}
  }, [d]);

  // Focus the first field of each new question, so it feels like answering a chat.
  useEffect(() => {
    topRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
  }, [d.at]);

  // Live check of the link the client is typing (debounced).
  useEffect(() => {
    const slug = normalizeSlug(d.slug);
    if (!slug) return setSlugState({ slug: "", status: "idle" });
    const problem = slugProblem(slug);
    if (problem) return setSlugState({ slug, status: "bad", reason: problem });
    setSlugState({ slug, status: "checking" });
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/slug?s=${encodeURIComponent(slug)}`, { signal: ctrl.signal, cache: "no-store" });
        const r = (await res.json()) as { available: boolean; reason?: string };
        setSlugState({ slug, status: r.available ? "ok" : "bad", reason: r.reason });
      } catch {
        if (!ctrl.signal.aborted) setSlugState({ slug, status: "idle" });
      }
    }, 400);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [d.slug]);

  const ceremonyTimeOptions = useMemo<EditorialSelectOption[]>(
    () =>
      CEREMONY_TIMES.map((item) => ({
        value: item.value,
        label: isUiAr ? item.labelAr : item.labelEn,
        sublabel: isUiAr ? item.subAr : item.subEn,
      })),
    [isUiAr],
  );

  const template = templates.find((t) => t.id === d.templateId) ?? templates[0];
  const category: Category = template?.category ?? "wedding";
  const suggestions = TEXT_SUGGESTIONS[category][d.lang];
  const total = priceOf(pricing, d.packageId, { customMusic: d.customMusicAddon });
  const pkg = getPackage(pricing, d.packageId);
  const date = d.day ? `${d.day}T${d.time || "19:00"}` : "";
  // Attendance replies come with package 2+; the files question is for packages made by our team (3+).
  const questions = QUESTIONS.filter((q) => (q.id !== "rsvp" || d.packageId >= 2) && (q.id !== "materials" || d.packageId >= 3));
  const index = questions.findIndex((q) => q.id === d.at);
  const current = index >= 0 ? questions[index] : null;
  const phase: 1 | 2 | 3 = current?.phase ?? 3;
  const names = d.partnerA.trim() && d.partnerB.trim() ? { a: d.partnerA.trim(), b: d.partnerB.trim() } : undefined;
  const errorText = errorCode ? (errors[errorCode] ?? errors.failed) : "";
  const slugNow = normalizeSlug(d.slug);

  /** Checks one question; returns an error code or "". */
  function check(id: QuestionId): string {
    switch (id) {
      case "names":
        return !d.partnerA.trim() || !d.partnerB.trim() ? "names_required" : "";
      case "design":
        return template ? "" : "invalid_template";
      case "date": {
        if (!d.day) return "date_invalid";
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        return d.day < today ? "date_past" : "";
      }
      case "venue":
        return d.venueName.trim() ? "" : "venue_required";
      case "maps":
        return d.mapsUrl.trim() && !MAPS_URL.test(d.mapsUrl.trim()) ? "maps_invalid" : "";
      case "text":
        return d.generalText.trim().length > 200 ? "text_invalid" : "";
      case "package":
        return onSale.includes(d.packageId) ? "" : "invalid_package";
      case "materials":
        if (d.briefLink.trim() && !/^https?:\/\/\S{3,}$/i.test(d.briefLink.trim())) return "link_invalid";
        if (files.length > MAX_FILES) return "too_many_files";
        if (files.some((f) => !ACCEPTED.includes(contentTypeOf(f)))) return "file_type";
        return files.some((f) => f.size > MAX_FILE_BYTES) ? "file_large" : "";
      case "rsvp":
        return d.rsvp === null ? "rsvp_required" : "";
      case "contact":
        if (!d.clientName.trim()) return "client_name_required";
        return normalizePhone(d.clientPhone) ? "" : "client_phone_invalid";
      case "link": {
        if (!slugNow) return "";
        if (slugState.slug !== slugNow || slugState.status === "checking") return "slug_checking";
        return slugState.status === "bad" ? (slugState.reason ?? "slug_taken") : "";
      }
    }
  }

  function show(at: Draft["at"], patch: Partial<Draft> = {}) {
    setErrorCode("");
    set({ at, ...patch });
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** Next question, or back to the review page when editing from there. */
  function advance(skippedNow = false) {
    if (!current) return;
    const skipped = skippedNow ? [...new Set([...d.skipped, current.id])] : d.skipped.filter((id) => id !== current.id);
    const nextQ = questions[index + 1];
    // Offer a ready-made link from the names when the client reaches that question with nothing typed.
    const slugPatch = nextQ?.id === "link" && !d.slug ? { slug: suggestSlug(d.partnerA, d.partnerB) } : {};
    if (d.fromReview || !nextQ) show("review", { skipped, fromReview: false, ...slugPatch });
    else show(nextQ.id, { skipped, ...slugPatch });
  }

  function next(e?: FormEvent) {
    e?.preventDefault();
    if (!current) return;
    const problem = check(current.id);
    if (problem) return setErrorCode(problem);
    advance();
  }

  function skip() {
    if (!current) return;
    // Skipping clears what was half-typed, so the review shows exactly what the invitation will use.
    if (current.id === "maps") set({ mapsUrl: "" });
    if (current.id === "text") set({ generalText: "" });
    if (current.id === "link") set({ slug: "" });
    if (current.id === "materials") {
      set({ brief: "", briefLink: "" });
      setFiles([]);
    }
    advance(true);
  }

  function back() {
    if (!current) return show(questions[questions.length - 1].id);
    if (d.fromReview) return show("review", { fromReview: false });
    if (index > 0) show(questions[index - 1].id);
  }

  async function submit() {
    for (const q of questions) {
      const problem = check(q.id);
      if (problem) {
        show(q.id, { fromReview: true });
        return setErrorCode(problem);
      }
    }
    setErrorCode("");
    setBusy(true);
    try {
      const { manageToken } = await postJson<{ manageToken: string }>("/api/orders", {
        templateId: d.templateId,
        lang: d.lang,
        partnerA: d.partnerA,
        partnerB: d.partnerB,
        date,
        venueName: d.venueName,
        venueAddress: d.venueAddress,
        mapsUrl: d.mapsUrl.trim(),
        generalText: d.generalText || suggestions[0],
        packageId: d.packageId,
        customMusicAddon: d.packageId === 1 ? d.customMusicAddon : false,
        musicTrackId: d.packageId >= 2 || d.customMusicAddon ? d.musicTrackId : "",
        brief: d.packageId >= 3 ? d.brief : "",
        briefLink: d.packageId >= 3 ? d.briefLink.trim() : "",
        rsvp: d.packageId >= 2 && d.rsvp === true,
        clientName: d.clientName,
        clientPhone: d.clientPhone,
        slug: slugNow || undefined,
      });
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      // Package 3+: send the chosen files now that the order exists. One that fails can be re-added from the order page.
      const toSend = d.packageId >= 3 ? files : [];
      const api = `/api/manage/${encodeURIComponent(manageToken)}`;
      for (const [i, file] of toSend.entries()) {
        setUploadMsg(ui.uploading(i + 1, toSend.length));
        try {
          const contentType = contentTypeOf(file);
          const up = await postJson<{ objectKey: string; uploadUrl: string }>(`${api}/uploads`, { kind: "reference", contentType, size: file.size });
          await putFile(up.uploadUrl, file, contentType);
          await postJson(`${api}/references`, { objectKey: up.objectKey, name: file.name });
        } catch {}
      }
      window.location.href = `/order/${manageToken}?new=1`;
    } catch (err) {
      const code = err instanceof UploadError ? err.code : "failed";
      if (code.startsWith("slug_")) {
        show("link", { fromReview: true });
        setSlugState({ slug: slugNow, status: "bad", reason: code });
      }
      setErrorCode(code);
      setBusy(false);
    }
  }

  /** Package 4 is arranged with us directly: shown as a small card under the packages. */
  const bespoke = pricing.packages.find((p) => p.id === 4 && p.active);
  function bespokeWhatsapp(): string {
    const lines = isUiAr
      ? [
          "أهلاً، عايزة أعمل دعوة بالباقة الخاصة.",
          names ? `الأسامي: ${d.partnerA.trim()} و ${d.partnerB.trim()}` : "",
          date ? `التاريخ: ${formatPicked(date, uiLang)}` : "",
          template ? `التصميم اللي عجبني: ${templateDisplayName(template, uiLang)}` : "",
        ]
      : [
          "Hello, I'd like a fully custom invitation (bespoke package).",
          names ? `Names: ${d.partnerA.trim()} & ${d.partnerB.trim()}` : "",
          date ? `Date: ${formatPicked(date, uiLang)}` : "",
          template ? `Design I liked: ${templateDisplayName(template, uiLang)}` : "",
        ];
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.filter(Boolean).join("\n"))}`;
  }

  /** One-line answer for the chat history and the review page. */
  function answer(id: QuestionId): string {
    if (d.skipped.includes(id)) return ui.skipped;
    switch (id) {
      case "names":
        return names ? `${names.a} ${d.lang === "ar" ? "و" : "&"} ${names.b}` : "";
      case "design":
        return template ? templateDisplayName(template, uiLang) : "";
      case "date":
        return date ? formatPicked(date, uiLang) : "";
      case "venue":
        return [d.venueName, d.venueAddress].filter((x) => x.trim()).join(" · ");
      case "maps":
        return d.mapsUrl ? ui.mapsAdded : "";
      case "text":
        return d.generalText || suggestions[0];
      case "package": {
        if (!pkg) return "";
        const base = `${packageDisplayName(pkg, uiLang)} · ${formatStorePrice(total, uiLang)}`;
        const addonActive = d.packageId === 1 && d.customMusicAddon;
        const canPick = d.packageId >= 2 || addonActive;
        if (!canPick || !d.musicTrackId) {
          return addonActive
            ? `${base} · ${uiLang === "ar" ? "مكتبة الألحان" : "Soundtrack Library"}`
            : base;
        }
        if (d.musicTrackId === "none") {
          return `${base} · ${copy.options.noMusicLabel}`;
        }
        const chosenTrack = music.find((m) => m.id === d.musicTrackId);
        return chosenTrack ? `${base} · ${musicParts(chosenTrack, uiLang).title}` : base;
      }
      case "materials":
        return [files.length ? ui.files(files.length) : "", d.briefLink.trim() ? ui.link : "", d.brief.trim() ? ui.notes : ""]
          .filter(Boolean)
          .join(" · ");
      case "rsvp":
        return d.rsvp === null ? "" : d.rsvp ? ui.yes : ui.no;
      case "contact":
        return d.clientName ? `${d.clientName} · ${d.clientPhone}` : "";
      case "link":
        return slugNow ? `${origin}/i/${slugNow}` : ui.autoLink;
    }
  }

  // The two answers right before this question, shown as chat bubbles above it (tap to edit).
  const history = index > 0 ? questions.slice(Math.max(0, index - 2), index).filter((q) => answer(q.id)) : [];

  // Live preview (right card)
  const activeIndex = Math.max(0, templates.findIndex((t) => t.id === d.templateId));
  const activeMeta = template ? TEMPLATE_EDITORIAL_META[template.id] : undefined;
  const activeTemplateTitle = template ? templateDisplayName(template, uiLang) : b.fallbackDesignName;
  const activeTemplateDesc = activeMeta ? (isUiAr ? activeMeta.taglineAr : activeMeta.taglineEn) : b.fallbackDesignDesc;
  const cycleTemplate = (delta: -1 | 1) => {
    if (templates.length === 0) return;
    set({ templateId: templates[(activeIndex + delta + templates.length) % templates.length].id });
  };
  const previewDateLabel = (() => {
    if (!date) return d.lang === "ar" ? "١٤ فبراير ٢٠٢٧ · ٧:٠٠ م" : "February 14, 2027 · 7:00 PM";
    const when = new Date(date);
    if (Number.isNaN(when.getTime())) return date;
    return new Intl.DateTimeFormat(d.lang === "ar" ? "ar-EG" : "en-US", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(when);
  })();
  const displayPartnerA = d.partnerA.trim() || (d.lang === "ar" ? "أحمد" : "Ahmed");
  const displayPartnerB = d.partnerB.trim() || (d.lang === "ar" ? "سارة" : "Sara");
  const customTrackForPreview =
    (d.packageId >= 2 || (d.packageId === 1 && d.customMusicAddon)) &&
    d.musicTrackId &&
    d.musicTrackId !== templateMusicMap[template?.id ?? ""];
  const previewTemplateHref = template
    ? localeHref(
        uiLang,
        customTrackForPreview
          ? `/t/${template.id}?m=${encodeURIComponent(d.musicTrackId)}`
          : `/t/${template.id}`,
      )
    : "";
  const displayVenue = d.venueName.trim() || (d.lang === "ar" ? "قاعة الماسة · القاهرة الجديدة" : "The Grand Conservatory · New Cairo");

  const fileIcon = (f: File) =>
    f.type.startsWith("video") ? (
      <FileVideo size={18} strokeWidth={1.5} aria-hidden />
    ) : f.type.startsWith("audio") || /\.(mp3|m4a)$/i.test(f.name) ? (
      <FileMusic size={18} strokeWidth={1.5} aria-hidden />
    ) : (
      <FileImage size={18} strokeWidth={1.5} aria-hidden />
    );

  return (
    <div className={styles.studioGrid} dir={isUiAr ? "rtl" : "ltr"} lang={uiLang}>
      {/* LEFT CARD: one question at a time */}
      <form className={`${styles.studioCard} ${styles.wizard}`} onSubmit={next} ref={topRef} noValidate>
        <div className={styles.studioCardTop}>
          <div className={styles.qProgress}>
            <span>{current ? ui.questionOf(index + 1, questions.length) : ui.review}</span>
          </div>
          <div className={styles.studioTopControls}>
            <button type="button" onClick={toggleLang} aria-label={copy.switchLangAria} className={styles.studioLangBtn}>
              <Languages size={14} strokeWidth={1.7} aria-hidden="true" />
              <span>{copy.switchLangTitle}</span>
            </button>
            <Link href={localeHref(uiLang, "/")} aria-label={copy.backHomeAria} className={styles.studioCloseBtn}>
              <X size={16} strokeWidth={1.8} />
            </Link>
          </div>
        </div>

        <div className={styles.stepProgress} aria-hidden="true" style={{ gridTemplateColumns: `repeat(${questions.length}, 1fr)`, gap: "0.3rem" }}>
          {questions.map((q, i) => (
            <div key={q.id} className={styles.stepBar}>
              <div className={styles.stepBarFill} style={{ width: !current || i <= index ? "100%" : "0%" }} />
            </div>
          ))}
        </div>

        {current && !d.fromReview && history.length > 0 && (
          <ol className={styles.chatHistory}>
            {history.map((q) => (
              <li key={q.id}>
                <span className={styles.chatQ}>{q.title[uiLang]}</span>
                <button type="button" className={styles.chatA} onClick={() => show(q.id)} title={ui.editAnswer} dir="auto">
                  {answer(q.id)}
                </button>
              </li>
            ))}
          </ol>
        )}

        <div className={styles.studioBody} key={d.at}>
          {current ? (
            <>
              <h1 className={styles.studioTitle}>{current.title[uiLang]}</h1>
              {current.hint && <p className={styles.studioSubtitle}>{current.hint[uiLang]}</p>}
            </>
          ) : (
            <>
              <h1 className={styles.studioTitle}>{ui.reviewTitle}</h1>
              <p className={styles.studioSubtitle}>{ui.reviewHint}</p>
            </>
          )}

          {current?.id === "names" && (
            <>
              <div className={styles.field}>
                <span>{b.inviteLangLabel}</span>
                <div className={styles.editorialLangBar} role="radiogroup" aria-label={b.inviteLangLabel} data-selected={d.lang} dir="ltr">
                  <span aria-hidden="true" className={styles.editorialLangIndicator} />
                  {(["ar", "en"] as Lang[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      role="radio"
                      aria-checked={d.lang === l}
                      className={`${styles.editorialLangBtn} ${d.lang === l ? styles.editorialLangBtnActive : ""}`}
                      onClick={() => set({ lang: l, generalText: "" })}
                    >
                      <span className={styles.editorialLangCode}>{l.toUpperCase()}</span>
                      <span className={l === "ar" ? styles.editorialLangNameAr : styles.editorialLangNameEn}>{l === "ar" ? "العربية" : "English"}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.row}>
                <label className={styles.field}>
                  <span>{b.partnerOneLabel}</span>
                  <input
                    data-autofocus
                    dir="auto"
                    value={d.partnerA}
                    onChange={(e) => set({ partnerA: e.target.value })}
                    placeholder={d.lang === "ar" ? "أحمد" : "Ahmed"}
                    maxLength={40}
                  />
                </label>
                <label className={styles.field}>
                  <span>{b.partnerTwoLabel}</span>
                  <input
                    dir="auto"
                    value={d.partnerB}
                    onChange={(e) => set({ partnerB: e.target.value })}
                    placeholder={d.lang === "ar" ? "سارة" : "Sara"}
                    maxLength={40}
                  />
                </label>
              </div>
            </>
          )}

          {current?.id === "design" &&
            (templates.length === 0 ? (
              <p className={styles.hint}>{ui.noDesigns}</p>
            ) : (
              <TemplateGallery templates={templates} selectedId={d.templateId} onSelect={(id) => set({ templateId: id })} names={names} lang={d.lang} />
            ))}

          {current?.id === "date" && (
            <div className={styles.row}>
              <div className={styles.field}>
                <span>{b.dateLabel}</span>
                <EditorialDatePicker
                  value={d.day}
                  onChange={(day) => {
                    set({ day });
                    setErrorCode("");
                  }}
                  placeholder={b.datePlaceholder}
                  ariaLabel={b.dateLabel}
                  locale={uiLang}
                  inline
                />
              </div>
              <div className={styles.field}>
                <span>{b.timeLabel}</span>
                <EditorialSelect
                  value={d.time}
                  onChange={(time) => set({ time })}
                  options={ceremonyTimeOptions}
                  placeholder={b.timePlaceholder}
                  ariaLabel={b.timeLabel}
                  dir={isUiAr ? "rtl" : "ltr"}
                  icon={<Clock size={15} strokeWidth={1.5} aria-hidden="true" />}
                />
              </div>
            </div>
          )}

          {current?.id === "venue" && (
            <div className={styles.row}>
              <label className={styles.field}>
                <span>{ui.venueName}</span>
                <input
                  data-autofocus
                  dir="auto"
                  value={d.venueName}
                  onChange={(e) => set({ venueName: e.target.value })}
                  maxLength={80}
                  placeholder={d.lang === "ar" ? "قاعة الماسة" : "The Garden Hall"}
                />
              </label>
              <label className={styles.field}>
                <span>{ui.address}</span>
                <input
                  dir="auto"
                  value={d.venueAddress}
                  onChange={(e) => set({ venueAddress: e.target.value })}
                  maxLength={120}
                  placeholder={d.lang === "ar" ? "القاهرة الجديدة" : "New Cairo"}
                />
              </label>
            </div>
          )}

          {current?.id === "maps" && (
            <label className={styles.field}>
              <span>{ui.mapsField}</span>
              <input
                data-autofocus
                type="url"
                dir="ltr"
                inputMode="url"
                autoComplete="off"
                placeholder="https://maps.app.goo.gl/..."
                value={d.mapsUrl}
                onChange={(e) => {
                  set({ mapsUrl: e.target.value });
                  if (errorCode === "maps_invalid") setErrorCode("");
                }}
              />
            </label>
          )}

          {current?.id === "text" && (
            <div className={styles.field}>
              <input
                data-autofocus
                dir="auto"
                value={d.generalText}
                maxLength={200}
                placeholder={suggestions[0]}
                onChange={(e) => set({ generalText: e.target.value })}
              />
              <div className={styles.suggestions}>
                {suggestions.map((t) => (
                  <button key={t} type="button" className={styles.suggestion} aria-pressed={d.generalText === t} onClick={() => set({ generalText: t })} dir="auto">
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {current?.id === "package" && (
            <>
              <OrderOptions
                pricing={pricing}
                packageId={d.packageId}
                onPackageChange={(packageId) => set({ packageId })}
                music={music}
                defaultTrackId={templateMusicMap[d.templateId] ?? ""}
                musicTrackId={d.musicTrackId}
                onMusicChange={(musicTrackId) => set({ musicTrackId })}
                customMusicAddon={d.customMusicAddon}
                onCustomMusicAddonChange={(customMusicAddon) => set({ customMusicAddon })}
              />
              {d.packageId >= 3 && <p className={styles.hint}>{ui.package3Note}</p>}
              {bespoke && (
                <div className={styles.bespokeCard}>
                  <div className={styles.bespokeText}>
                    <strong>{b.bespokePrompt}</strong>
                    <span>
                      {packageDisplayName(bespoke, uiLang)} · {formatStorePrice(bespoke.price, uiLang, bespoke.priceNote)}
                      {" · "}
                      {b.bespokeSub}
                    </span>
                  </div>
                  <div className={styles.bespokeActions}>
                    {whatsappNumber && (
                      <a className={styles.bespokeWa} href={bespokeWhatsapp()} target="_blank" rel="noopener noreferrer">
                        <Icon name="whatsapp" size={17} strokeWidth={1.9} />
                        {b.bespokeWa}
                      </a>
                    )}
                    <Link href={localeHref(uiLang, "/request")} className={styles.inlineLink}>
                      {b.bespokeLink}
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}

          {current?.id === "materials" && (
            <>
              <label className={styles.field}>
                <span>{ui.briefLabel}</span>
                <textarea data-autofocus dir="auto" value={d.brief} maxLength={2000} onChange={(e) => set({ brief: e.target.value })} />
              </label>
              <label className={styles.dropzone}>
                <input
                  type="file"
                  multiple
                  accept={ACCEPT_ATTR}
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    setFiles((x) => [...x, ...picked]);
                    setErrorCode("");
                    e.target.value = "";
                  }}
                />
                <Plus size={22} strokeWidth={1.5} aria-hidden />
                <span>{ui.dropzone}</span>
              </label>
              {files.length > 0 && (
                <ul className={styles.fileList}>
                  {files.map((f, i) => (
                    <li key={`${f.name}-${i}`}>
                      {fileIcon(f)}
                      <span dir="auto">{f.name}</span>
                      <small>
                        {(f.size / 1024 / 1024).toFixed(1)} {ui.mb}
                      </small>
                      <button type="button" onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} aria-label={ui.remove(f.name)}>
                        <X size={16} strokeWidth={1.6} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <label className={styles.field}>
                <span>{ui.driveLabel}</span>
                <input
                  type="url"
                  dir="ltr"
                  inputMode="url"
                  value={d.briefLink}
                  onChange={(e) => set({ briefLink: e.target.value })}
                  placeholder="https://drive.google.com/..."
                />
              </label>
              <p className={styles.hint}>{ui.filesNote}</p>
            </>
          )}

          {current?.id === "rsvp" && (
            <div className={styles.choiceRow} role="radiogroup" aria-label={current.title[uiLang]}>
              {[
                { v: true, label: ui.yes, note: ui.recommended },
                { v: false, label: ui.no, note: "" },
              ].map((o) => (
                <button
                  key={String(o.v)}
                  type="button"
                  role="radio"
                  aria-checked={d.rsvp === o.v}
                  className={styles.choice}
                  data-autofocus={o.v ? "" : undefined}
                  onClick={() => {
                    set({ rsvp: o.v });
                    setErrorCode("");
                  }}
                >
                  <strong>{o.label}</strong>
                  {o.note && <small>{o.note}</small>}
                </button>
              ))}
            </div>
          )}

          {current?.id === "contact" && (
            <>
              <div className={styles.row}>
                <label className={styles.field}>
                  <span>{b.yourNameLabel}</span>
                  <input
                    data-autofocus
                    dir="auto"
                    value={d.clientName}
                    onChange={(e) => set({ clientName: e.target.value })}
                    placeholder={b.yourNamePlaceholder}
                    maxLength={60}
                    autoComplete="name"
                  />
                </label>
                <label className={styles.field}>
                  <span>{b.whatsappLabel}</span>
                  <input
                    type="tel"
                    dir="ltr"
                    inputMode="tel"
                    value={d.clientPhone}
                    onChange={(e) => set({ clientPhone: e.target.value })}
                    autoComplete="tel"
                    placeholder="01xxxxxxxxx"
                  />
                </label>
              </div>
              <p className={styles.hint}>{ui.contactNote}</p>
            </>
          )}

          {current?.id === "link" && (
            <div className={styles.field}>
              <div className={styles.slugInput} dir="ltr">
                <span>{origin}/i/</span>
                <input
                  data-autofocus
                  value={d.slug}
                  onChange={(e) => set({ slug: e.target.value.toLowerCase() })}
                  maxLength={50}
                  placeholder="ahmed-and-sara"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label={ui.linkAria}
                />
              </div>
              {slugNow && (
                <p className={styles.slugStatus} data-state={slugState.slug === slugNow ? slugState.status : "checking"} role="status">
                  {slugState.slug !== slugNow || slugState.status === "checking"
                    ? ui.checking
                    : slugState.status === "ok"
                      ? ui.available(`${origin}/i/${slugNow}`)
                      : slugState.status === "bad"
                        ? (errors[slugState.reason ?? "slug_taken"] ?? errors.slug_taken)
                        : ""}
                </p>
              )}
            </div>
          )}

          {!current && (
            <div className={styles.review}>
              {template && (
                <div className={styles.reviewThumb}>
                  <TemplateThumb template={template} showBadge={false} names={names} lang={d.lang} uiLang={uiLang} />
                </div>
              )}
              <ul className={styles.reviewRows}>
                {questions.map((q) => (
                  <li key={q.id}>
                    <div>
                      <small>{q.title[uiLang]}</small>
                      <span dir="auto">{answer(q.id) || ui.notYet}</span>
                    </div>
                    <button type="button" className={styles.editBtn} onClick={() => show(q.id, { fromReview: true })}>
                      {ui.edit}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!current && (
            <>
              <div className={styles.total}>
                <span>
                  {activeTemplateTitle} · {b.totalNote}
                </span>
                <strong>{formatStorePrice(total, uiLang)}</strong>
              </div>
              <p className={styles.hint}>{ui.reviewAfter}</p>
            </>
          )}

          {errorText && (
            <div className={styles.error} role="alert">
              <span>{errorText}</span>
            </div>
          )}
          {/* Enter in any field moves on. */}
          <button type="submit" hidden aria-hidden tabIndex={-1} />
        </div>

        <div className={styles.studioFooterRow}>
          {index > 0 || !current || d.fromReview ? (
            <button type="button" className={styles.ctaGhost} onClick={back} disabled={busy}>
              {b.back}
            </button>
          ) : (
            <Link href={localeHref(uiLang, "/")} className={styles.ctaGhost}>
              {b.back}
            </Link>
          )}
          <div className={styles.navButtons}>
            {current?.optional && (
              <button type="button" className={styles.ctaGhost} onClick={skip}>
                {ui.skip}
              </button>
            )}
            {current ? (
              <button type="button" className={styles.cta} onClick={() => next()}>
                {d.fromReview ? ui.save : index === questions.length - 1 ? ui.toReview : ui.next}
              </button>
            ) : (
              <button type="button" className={styles.cta} onClick={submit} disabled={busy}>
                {busy ? uploadMsg || ui.submitting : ui.submit}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* RIGHT CARD: live preview of the chosen design */}
      <aside className={styles.studioCard} aria-label={isUiAr ? "معاينة الدعوة" : "Live invitation preview"}>
        <h2 className={styles.studioTitle}>{b.previewTitle}</h2>

        <ol className={styles.previewEditorialRail} aria-label={isUiAr ? "خطوات التصميم" : "Studio steps"}>
          <span aria-hidden="true" className={styles.previewRailProgress} style={{ width: `${(phase / 3) * 100}%` }} />
          {b.steps.map((st, idx) => {
            const stepNum = idx + 1;
            return (
              <li
                key={st.num}
                className={`${styles.previewRailItem} ${phase === stepNum ? styles.previewRailItemActive : ""} ${phase > stepNum ? styles.previewRailItemDone : ""}`}
              >
                <span className={styles.previewRailRoman} aria-hidden="true">
                  {st.num}
                </span>
                <span className={styles.previewRailLabel}>{st.label}</span>
              </li>
            );
          })}
        </ol>

        <div className={styles.previewMetaBar}>
          <div>
            <p className={styles.previewDesignName}>{activeTemplateTitle}</p>
            <p className={styles.previewDesignDesc}>{activeTemplateDesc}</p>
          </div>
          <div className={styles.previewCtrlPill}>
            <button type="button" aria-label={b.prevThemeAria} onClick={() => cycleTemplate(-1)} className={styles.previewCtrlBtn}>
              {isUiAr ? <ChevronRight size={16} strokeWidth={1.8} /> : <ChevronLeft size={16} strokeWidth={1.8} />}
            </button>
            {template && (
              <Link
                href={previewTemplateHref}
                target="_blank"
                aria-label={b.openDemoAria}
                title={b.openDemoAria}
                className={styles.previewCtrlBtn}
              >
                <ArrowUpRight size={16} strokeWidth={1.8} />
              </Link>
            )}
            <button type="button" aria-label={b.nextThemeAria} onClick={() => cycleTemplate(1)} className={styles.previewCtrlBtn}>
              {isUiAr ? <ChevronLeft size={16} strokeWidth={1.8} /> : <ChevronRight size={16} strokeWidth={1.8} />}
            </button>
          </div>
        </div>

        <div className={styles.builderStage}>
          <div className={styles.builderStageBg} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {template?.posterUrl && <img src={template.posterUrl} alt="" />}
          </div>
          <div className={styles.builderInvite} style={{ backgroundColor: template?.theme.background ?? "#29231f" }}>
            {template?.videoUrl ? (
              <video
                key={template.id}
                className={styles.builderInviteMedia}
                src={template.videoUrl}
                poster={template.posterUrl}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              template?.posterUrl && <img src={template.posterUrl} alt="" className={styles.builderInviteMedia} />
            )}
            <div className={styles.builderInviteScrim} aria-hidden="true" />
            <div className={`${styles.previewInviteCard} ${styles.builderInviteCard}`} dir={d.lang === "ar" ? "rtl" : "ltr"}>
              <p className={`${styles.previewInviteEyebrow} ${d.lang === "ar" ? styles.previewInviteEyebrowAr : ""}`}>
                {d.generalText || suggestions[0]}
              </p>
              <p className={`${styles.previewInviteCouple} ${d.lang === "ar" ? styles.previewInviteCoupleAr : ""}`}>
                {displayPartnerA} {d.lang === "ar" ? "و" : "&"} {displayPartnerB}
              </p>
              <span aria-hidden="true" className={styles.previewInviteDivider} />
              <p className={styles.previewInviteMeta}>
                {previewDateLabel}
                <br />
                {displayVenue}
                {d.venueAddress.trim() ? ` · ${d.venueAddress.trim()}` : ""}
              </p>
              {template && (
                <Link href={previewTemplateHref} target="_blank" className={styles.previewOpenBtn}>
                  <span className={d.lang === "ar" ? styles.previewOpenLabelAr : styles.previewOpenLabelEn}>
                    {d.lang === "ar" ? "افتح الدعوة" : "Open invitation"}
                  </span>
                  <ArrowUpRight size={13} strokeWidth={1.7} aria-hidden="true" className={styles.previewOpenArrow} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

const MONTHS: Record<Lang, string[]> = {
  ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

/** "2027-02-14T19:30" → "14 February 2027 · 7:30 PM" / "14 فبراير 2027 · 7:30 مساءً" */
function formatPicked(value: string, lang: Lang): string {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return "";
  const h = Number(m[4]);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = lang === "ar" ? (h >= 12 ? "مساءً" : "صباحاً") : h >= 12 ? "PM" : "AM";
  return `${Number(m[3])} ${MONTHS[lang][Number(m[2]) - 1]} ${m[1]} · ${h12}:${m[5]} ${ampm}`;
}
