import type { Category, Lang, PackageId } from "@/lib/types";
import type { PackageInfo } from "@/lib/pricing";

export const TIER_NAMES_EN: Record<PackageId, string> = {
  1: "Essential",
  2: "Signature",
  3: "Tailored",
  4: "Bespoke",
};

export const TIER_POINTS_EN: Record<PackageId, string[]> = {
  1: [
    "Animated wax-seal opening",
    "Couple names & event details",
    "Instant RSVP & live countdown",
  ],
  2: [
    "Everything in Essential",
    "Curated soundtrack from our library",
    "Guest wishes & keepsake book",
  ],
  3: [
    "Your own photos & videos woven in",
    "Share moodboards & we craft to match",
    "Named invitation link per guest",
    "Optional personal note for each guest",
  ],
  4: [
    "One-on-one bespoke design with our studio",
    "Unlimited refinements until it feels right",
    "Named guest links & personal messages",
    "50% off for the first couple you refer",
  ],
};

export const INCLUDED_IN_ALL_COPY: Record<Lang, string[]> = {
  en: [
    "Arabic & English",
    "Google Maps venue pin",
    "Ready-to-share WhatsApp link",
  ],
  ar: [
    "عربي وإنجليزي مجاناً",
    "لوكيشن القاعة على جوجل ماب",
    "لينك جاهز للإرسال على واتساب",
  ],
};

export function packageDisplayName(pkg: PackageInfo, lang: Lang): string {
  if (lang === "ar") return pkg.name;
  return TIER_NAMES_EN[pkg.id] ?? pkg.name;
}

export function packageDisplayPoints(pkg: PackageInfo, lang: Lang): string[] {
  if (lang === "ar") return pkg.points;
  // Use English editorial points when package points are Arabic defaults
  const hasArabic = pkg.points.some((pt) => /[\u0600-\u06FF]/.test(pt));
  return hasArabic ? TIER_POINTS_EN[pkg.id] ?? pkg.points : pkg.points;
}

export function formatStorePrice(egp: number, lang: Lang, priceNote?: string): string {
  const num = egp.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");
  if (lang === "ar") {
    return `${priceNote ? `${priceNote} ` : ""}${num} ج.م`;
  }
  const enNote = priceNote ? "Starting at " : "";
  return `${enNote}${num} EGP`;
}

export const CATEGORY_COPY: Record<Lang, Record<Category | "all", string>> = {
  en: {
    all: "All",
    wedding: "Wedding",
    engagement: "Engagement",
    katb_kitab: "Katb Kitab",
  },
  ar: {
    all: "الكل",
    wedding: "زفاف",
    engagement: "خطوبة",
    katb_kitab: "كتب كتاب",
  },
};

export const DETAIL_ERRORS_BY_LANG: Record<Lang, Record<string, string>> = {
  en: {
    names_required: "Please enter both partner names.",
    date_invalid: "Please select the celebration date and time.",
    venue_required: "Please enter the venue name.",
    address_invalid: "The address is too long.",
    maps_invalid:
      "That maps link doesn't look valid—paste a Google Maps share link or leave the field blank (it's optional).",
    client_name_required: "Please enter your name.",
    client_phone_invalid: "Please enter a valid WhatsApp number.",
    invalid_template: "Please choose a design template.",
    invalid_package: "Please select a package.",
    invalid_music: "That track is unavailable—please pick another.",
    failed: "Something went wrong. Please try again.",
  },
  ar: {
    names_required: "من فضلك اكتب اسمَي العروسين أولاً.",
    date_invalid: "اختار تاريخ وميعاد الليلة.",
    venue_required: "اكتب اسم القاعة أو مكان الحفل.",
    address_invalid: "العنوان أطول من اللازم — اختصره شوية.",
    maps_invalid:
      "لينك الخريطة مش مظبوط — انسخ لينك المشاركة من جوجل ماب، أو سيبه فاضي لأنه اختياري.",
    client_name_required: "اكتب اسمك علشان نعرف نتواصل معاك.",
    client_phone_invalid: "اكتب رقم واتساب صحيح (مثلاً 01xxxxxxxxx).",
    invalid_template: "اختار تصميم لدعوتك أولاً.",
    invalid_package: "اختار الباقة المناسبة.",
    invalid_music: "المقطوعة دي مش متاحة حالياً — اختار غيرها.",
    failed: "حصلت مشكلة بسيطة — جرّب تاني من فضلك.",
  },
};

export interface TimeOptionItem {
  value: string;
  labelEn: string;
  subEn: string;
  labelAr: string;
  subAr: string;
}

export const CEREMONY_TIMES: TimeOptionItem[] = [
  { value: "10:00", labelEn: "10:00 AM", subEn: "Morning", labelAr: "١٠:٠٠ صباحاً", subAr: "صباحي" },
  { value: "11:00", labelEn: "11:00 AM", subEn: "Morning", labelAr: "١١:٠٠ صباحاً", subAr: "صباحي" },
  { value: "12:00", labelEn: "12:00 PM", subEn: "Noon", labelAr: "١٢:٠٠ ظهراً", subAr: "منتصف اليوم" },
  { value: "13:00", labelEn: "1:00 PM", subEn: "Afternoon", labelAr: "١:٠٠ ظهراً", subAr: "نهاري" },
  { value: "14:00", labelEn: "2:00 PM", subEn: "Afternoon", labelAr: "٢:٠٠ عصراً", subAr: "نهاري" },
  { value: "15:00", labelEn: "3:00 PM", subEn: "Afternoon", labelAr: "٣:٠٠ عصراً", subAr: "بعد الظهر" },
  { value: "16:00", labelEn: "4:00 PM", subEn: "Golden hour", labelAr: "٤:٠٠ عصراً", subAr: "الساعة الذهبية" },
  { value: "16:30", labelEn: "4:30 PM", subEn: "Golden hour", labelAr: "٤:٣٠ عصراً", subAr: "الساعة الذهبية" },
  { value: "17:00", labelEn: "5:00 PM", subEn: "Sunset", labelAr: "٥:٠٠ مساءً", subAr: "وقت الغروب" },
  { value: "17:30", labelEn: "5:30 PM", subEn: "Sunset", labelAr: "٥:٣٠ مساءً", subAr: "وقت الغروب" },
  { value: "18:00", labelEn: "6:00 PM", subEn: "Early evening", labelAr: "٦:٠٠ مساءً", subAr: "أول المساء" },
  { value: "18:30", labelEn: "6:30 PM", subEn: "Evening", labelAr: "٦:٣٠ مساءً", subAr: "مسائي" },
  { value: "19:00", labelEn: "7:00 PM", subEn: "Evening", labelAr: "٧:٠٠ مساءً", subAr: "مسائي" },
  { value: "19:30", labelEn: "7:30 PM", subEn: "Evening", labelAr: "٧:٣٠ مساءً", subAr: "مسائي" },
  { value: "20:00", labelEn: "8:00 PM", subEn: "Evening", labelAr: "٨:٠٠ مساءً", subAr: "مسائي" },
  { value: "20:30", labelEn: "8:30 PM", subEn: "Night", labelAr: "٨:٣٠ مساءً", subAr: "سهرة" },
  { value: "21:00", labelEn: "9:00 PM", subEn: "Night", labelAr: "٩:٠٠ مساءً", subAr: "سهرة" },
  { value: "21:30", labelEn: "9:30 PM", subEn: "Night", labelAr: "٩:٣٠ مساءً", subAr: "سهرة" },
  { value: "22:00", labelEn: "10:00 PM", subEn: "Late evening", labelAr: "١٠:٠٠ مساءً", subAr: "سهرة متأخرة" },
  { value: "22:30", labelEn: "10:30 PM", subEn: "Late evening", labelAr: "١٠:٣٠ مساءً", subAr: "سهرة متأخرة" },
  { value: "23:00", labelEn: "11:00 PM", subEn: "Late evening", labelAr: "١١:٠٠ مساءً", subAr: "سهرة متأخرة" },
];

export const STORE_COPY = {
  en: {
    switchLangTitle: "العربية",
    switchLangAria: "Switch site to Arabic",
    backHomeAria: "Back to home",
    builder: {
      steps: [
        { num: "I", label: "Couple details" },
        { num: "II", label: "Aesthetic" },
        { num: "III", label: "Private preview" },
      ],
      titles: {
        1: "Who's celebrating?",
        2: "Choose your aesthetic.",
        3: "Almost ready to preview.",
      },
      subtitles: {
        1: "Preview your complete invitation live before paying. No account or credit card required.",
        2: "Select your opening theme, suite tier, and soundtrack.",
        3: "Leave your WhatsApp so we can send your private management link.",
      },
      previewTitle: "Bringing your celebration aesthetic to life.",
      inviteLangLabel: "Invitation language",
      partnerOneLabel: "Partner one",
      partnerTwoLabel: "Partner two",
      dateLabel: "Celebration date",
      datePlaceholder: "Select celebration date",
      timeLabel: "Ceremony time",
      timePlaceholder: "Select time",
      venueLabel: "Venue name",
      addressLabel: "City / address (optional)",
      mapsLabel: "Google Maps link (optional)",
      mapsPlaceholder: "Optional — leave blank or paste Google Maps share link",
      clear: "Clear",
      skipOptionalLink: "Skip optional link",
      yourNameLabel: "Your name",
      yourNamePlaceholder: "Your full name",
      whatsappLabel: "WhatsApp number",
      totalNote: "One-time payment after preview",
      bespokePrompt: "Want a custom theme crafted from scratch by our studio?",
      bespokeLink: "Request a bespoke suite ↗",
      back: "Back",
      continueBtn: "Continue",
      submit: "Create live preview",
      submitting: "Creating preview…",
      prevThemeAria: "Previous theme",
      nextThemeAria: "Next theme",
      openDemoAria: "Open full live demo",
      fallbackDesignName: "Signature Theme",
      fallbackDesignDesc:
        "Animated wax-seal reveal, curated music, and instant guest RSVP.",
    },
    options: {
      packagesAria: "Suites",
      includedPrefix: "Included in every suite:",
      soundtrackLabel: "Soundtrack",
      soundtrackEmpty:
        "Our studio will pair a curated instrumental track for you.",
      noMusicLabel: "No background music",
      noMusicSub: "Silent reveal",
      curatedTrackSub: "Curated soundtrack",
      totalLabel: "Total",
    },
    request: {
      title: "Commission a bespoke suite.",
      sentTitle: "We received your brief.",
      subtitle:
        "Share your vision, moodboard, and celebration date—our studio crafts an original animated invitation made exclusively for you.",
      sentSubtitle: (phone: string) =>
        `Our design concierge will reach out on WhatsApp at ${phone} shortly.`,
      loggedFor: (name: string) => `Everything has been logged for ${name}.`,
      chatWhatsapp: "Chat on WhatsApp now",
      returnHome: "Return home",
      yourName: "Your name",
      yourNamePlaceholder: "Full name",
      whatsapp: "WhatsApp number",
      celebrationType: "Celebration type",
      targetDate: "Target date (optional)",
      targetDatePlaceholder: "Select target date",
      aestheticLabel: "Tell us about your aesthetic",
      aestheticPlaceholder:
        "Palette, florals, venue architecture, Pinterest or Instagram inspiration links...",
      back: "Back",
      submit: "Submit bespoke brief",
      submitting: "Sending brief…",
      bespokeTierPrefix: "Bespoke tier",
      asideDesc:
        "Designed one-on-one by Naila's creative team—complete with named guest links, personal notes, and cinematic opening motion.",
      liveSampleEyebrow: "BESPOKE LIVE SAMPLE",
      liveSampleCouple: "Youssef & Mariam",
      liveSampleMeta: "Named invitation with personal guest message",
      openLiveSample: "Open live sample",
      unavailableTitle: "Bespoke suites unavailable",
      unavailableSub:
        "Custom tiers are currently paused. Reach out on WhatsApp or start with one of our ready editorial suites.",
      createInvite: "Create invitation",
    },
    samples: {
      navTemplates: "Templates",
      navFeatures: "Features",
      navStart: "Start your invite",
      eyebrow: "LIVE SUITE DEMOS",
      title: "Experience every tier live.",
      lead: "Open any sample on your phone and tap the wax seal—experience the animated opening, soundtrack, personal guest message, and RSVP flow exactly as your guests will.",
      namedNote: (title: string | undefined, name: string) =>
        `Named link for ${[title, name].filter(Boolean).join(" ")} with personal note`,
      generalLink: "General invitation link",
      openLive: "Open live invitation",
      chooseTier: "Choose this tier",
      includedPrefix: "Included in every suite:",
    },
    previewDock: {
      templates: "Templates",
      usePrefix: "Use",
    },
  },
  ar: {
    switchLangTitle: "EN",
    switchLangAria: "Switch site to English",
    backHomeAria: "الرجوع للرئيسية",
    builder: {
      steps: [
        { num: "١", label: "تفاصيل الليلة" },
        { num: "٢", label: "الروح والتصميم" },
        { num: "٣", label: "معاينة خاصة" },
      ],
      titles: {
        1: "مين أصحاب الليلة الحلوة؟",
        2: "اختار الروح والتصميم.",
        3: "خطوة أخيرة وتكون جاهزة للمعاينة.",
      },
      subtitles: {
        1: "صمّم دعوتك وشوفها كاملة لايف قبل ما تدفع جنيه واحد — من غير تسجيل ولا كارت بنكي.",
        2: "اختار التصميم اللي يشبه ليلتكم، الباقة المناسبة، والمقطوعة الموسيقية.",
        3: "سيب رقم واتساب علشان نبعتلك صفحتك الخاصة اللي هتدير منها دعوتك ومعازيمك.",
      },
      previewTitle: "شوف دعوتك بتتشكّل قدامك.",
      inviteLangLabel: "لغة الدعوة اللي هيشوفها الضيف",
      partnerOneLabel: "الاسم الأول",
      partnerTwoLabel: "الاسم الثاني",
      dateLabel: "تاريخ المناسبة",
      datePlaceholder: "اختار تاريخ المناسبة",
      timeLabel: "ميعاد الحفل",
      timePlaceholder: "اختار الميعاد",
      venueLabel: "اسم القاعة أو المكان",
      addressLabel: "المدينة أو العنوان (اختياري)",
      mapsLabel: "لينك لوكيشن جوجل ماب (اختياري)",
      mapsPlaceholder: "اختياري — سيبه فاضي أو الصق لينك المشاركة من جوجل ماب",
      clear: "مسح",
      skipOptionalLink: "تخطّي اللينك الاختياري",
      yourNameLabel: "اسمك بالكامل",
      yourNamePlaceholder: "اسمك للتواصل",
      whatsappLabel: "رقم الواتساب",
      totalNote: "دفعة واحدة بعد المعاينة فقط",
      bespokePrompt: "حابب ننفّذلك تصميم حصري من الصفر بألوان فرحكم؟",
      bespokeLink: "اطلب تصميمك الخاص ↖",
      back: "رجوع",
      continueBtn: "التالي",
      submit: "جهّز المعاينة الحيّة",
      submitting: "بنجهّز معاينتك…",
      prevThemeAria: "التصميم السابق",
      nextThemeAria: "التصميم التالي",
      openDemoAria: "افتح المعاينة الكاملة",
      fallbackDesignName: "التصميم المختار",
      fallbackDesignDesc:
        "فتحة ختم شمع سينمائية، موسيقى مختارة، وتأكيد حضور فوري للمعازيم.",
    },
    options: {
      packagesAria: "الباقات",
      includedPrefix: "مشمول مجاناً في كل باقة:",
      soundtrackLabel: "الموسيقى المصاحبة",
      soundtrackEmpty: "فريقنا هيختارلك مقطوعة هادية تليق بأجواء دعوتك.",
      noMusicLabel: "بدون موسيقى",
      noMusicSub: "فتح هادئ صامت",
      curatedTrackSub: "مقطوعة مختارة",
      totalLabel: "الإجمالي",
    },
    request: {
      title: "اطلب تصميمك الحصري.",
      sentTitle: "استلمنا طلبكم بكل سعادة.",
      subtitle:
        "احكيلنا عن ذوقكم، ألوان القاعة، والأجواء اللي بتحلموا بيها — وفريق التصميم في نايلة هينفّذلكم دعوة معمولة مخصوص ليومكم.",
      sentSubtitle: (phone: string) =>
        `فريق التصميم في نايلة هيتواصل معاك قريباً جداً على واتساب (${phone}).`,
      loggedFor: (name: string) => `سجّلنا كل التفاصيل باسم ${name}.`,
      chatWhatsapp: "تواصل معنا على واتساب الآن",
      returnHome: "العودة للرئيسية",
      yourName: "اسمك بالكامل",
      yourNamePlaceholder: "الاسم",
      whatsapp: "رقم الواتساب",
      celebrationType: "نوع المناسبة",
      targetDate: "التاريخ المقترح (اختياري)",
      targetDatePlaceholder: "اختار التاريخ المقترح",
      aestheticLabel: "احكيلنا عن الأجواء اللي في بالك",
      aestheticPlaceholder:
        "الألوان، الورد، طابع القاعة، أو أي لينكات من Pinterest أو Instagram عاجباكم…",
      back: "رجوع",
      submit: "أرسل طلب التصميم",
      submitting: "جاري إرسال الطلب…",
      bespokeTierPrefix: "الباقة الحصرية",
      asideDesc:
        "تصميم فردي خطوة بخطوة مع فريق نايلة الإبداعي — شامل لينك باسم كل معزوم، رسائل خاصة، وحركة فتح سينمائية حصرية.",
      liveSampleEyebrow: "نموذج حي للتصميم الخاص",
      liveSampleCouple: "يوسف و مريم",
      liveSampleMeta: "دعوة شخصية باسم المعزوم مع رسالة إهداء خاصة",
      openLiveSample: "افتح النموذج الحي",
      unavailableTitle: "الباقات الخاصة متوقفة حالياً",
      unavailableSub:
        "التصميم الحصري متوقف مؤقتاً — تقدر تتواصل معنا على واتساب أو تبدأ فوراً من تصميماتنا الجاهزة.",
      createInvite: "صمّم دعوتك الآن",
    },
    samples: {
      navTemplates: "التصميمات",
      navFeatures: "المزايا",
      navStart: "صمّم دعوتك",
      eyebrow: "نماذج حيّة لكل باقة",
      title: "عيش تجربة كل باقة لايف.",
      lead: "افتح أي نموذج على موبايلك والمس الختم — جرّب حركة الفتح والموسيقى والرسالة الشخصية وتأكيد الحضور زي ما ضيوفك هيشوفوها بالظبط.",
      namedNote: (title: string | undefined, name: string) =>
        `لينك شخصي باسم ${[title, name].filter(Boolean).join(" ")} مع إهداء خاص`,
      generalLink: "لينك دعوة عام",
      openLive: "افتح الدعوة الحيّة",
      chooseTier: "اختار الباقة دي",
      includedPrefix: "مشمول مجاناً في كل باقة:",
    },
    previewDock: {
      templates: "التصميمات",
      usePrefix: "صمّم بتصميم",
    },
  },
} as const;
