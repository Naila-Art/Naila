import type { Category, Lang, PackageId } from "@/lib/types";
import type { PackageInfo } from "@/lib/pricing";
import { formatArabicNumber } from "@/lib/text";

export const TIER_NAMES_EN: Record<PackageId, string> = {
  1: "Essential",
  2: "Signature",
  3: "Tailored",
  4: "Bespoke",
};

export const TIER_POINTS_EN: Record<PackageId, string[]> = {
  1: [
    "Animated wax-seal opening",
    "Curated signature soundtrack",
    "Your names & evening details",
    "Instant RSVP & live countdown",
  ],
  2: [
    "Everything in Essential",
    "Choose any soundtrack from our library",
    "Heartfelt guest wishes keepsake",
  ],
  3: [
    "Your own photos & videos woven in",
    "Matched to your floral & venue moodboard",
    "Personal named link for every guest",
    "Optional private note inside each invite",
  ],
  4: [
    "One-on-one bespoke design with our studio",
    "Unlimited refinements until it feels just right",
    "Personal named links & heartfelt guest notes",
    "50% off for the first bride you refer",
  ],
};

export const INCLUDED_IN_ALL_COPY: Record<Lang, string[]> = {
  en: [
    "Arabic & English included",
    "Google Maps venue pin",
    "Crisp WhatsApp invitation link",
  ],
  ar: [
    "عربي وإنجليزي مجاناً",
    "لوكيشن القاعة على جوجل ماب",
    "لينك أنيق جاهز للواتساب",
  ],
};

export function packageDisplayName(pkg: PackageInfo, lang: Lang): string {
  if (lang === "ar") return pkg.name;
  return TIER_NAMES_EN[pkg.id] ?? pkg.name;
}

export function packageDisplayPoints(pkg: PackageInfo, lang: Lang): string[] {
  if (lang === "ar") return pkg.points;
  if (pkg.pointsEn?.length) return pkg.pointsEn;
  const hasArabic = pkg.points.some((pt) => /[\u0600-\u06FF]/.test(pt));
  return hasArabic ? TIER_POINTS_EN[pkg.id] ?? pkg.points : pkg.points;
}

export function formatStorePrice(egp: number, lang: Lang, priceNote?: string): string {
  const num = lang === "ar" ? formatArabicNumber(egp) : egp.toLocaleString("en-US");
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
    date_invalid: "Please select your celebration date and time.",
    venue_required: "Please enter your venue name.",
    address_invalid: "The address is a little too long.",
    maps_invalid:
      "That maps link doesn't look valid—paste a Google Maps share link or leave it blank (it's optional).",
    client_name_required: "Please enter your name.",
    client_phone_invalid: "Please enter a valid WhatsApp number.",
    invalid_template: "Please choose a design theme first.",
    invalid_package: "Please select a suite tier.",
    invalid_music: "That track is unavailable—please pick another.",
    rsvp_required: "Choose yes or no.",
    text_invalid: "Keep the opening line under 200 characters.",
    link_invalid: "The link must start with https://",
    file_type: "Files must be photos, videos (MP4/MOV) or songs (MP3/M4A).",
    file_large: "One file is over 50 MB. Put large files on Drive and paste the link.",
    too_many_files: "Up to 30 files. Put the rest on Drive and paste the link.",
    slug_checking: "One second — checking whether that link is free.",
    slug_short: "The link needs at least 3 characters.",
    slug_long: "The link is too long.",
    slug_chars: "Use lowercase English letters, numbers and dashes only.",
    slug_reserved: "That word is reserved — choose another.",
    slug_taken: "That link is already taken — try another.",
    failed: "Something went wrong. Please try again.",
  },
  ar: {
    names_required: "من فضلك اكتبي اسمَي العروسين أولاً.",
    date_invalid: "اختاري تاريخ وميعاد الليلة.",
    venue_required: "اكتبي اسم القاعة أو مكان الحفل.",
    address_invalid: "العنوان أطول من اللازم — اختصريه شوية.",
    maps_invalid:
      "لينك الخريطة مش مظبوط — انسخي لينك المشاركة من جوجل ماب، أو سيبيه فاضي لأنه اختياري.",
    client_name_required: "اكتبي اسمك عشان نعرف نتواصل معاكي.",
    client_phone_invalid: "اكتبي رقم واتساب صحيح (مثلاً 01xxxxxxxxx).",
    invalid_template: "اختاري تصميم لدعوتك أولاً.",
    invalid_package: "اختاري الباقة اللي تناسبك.",
    invalid_music: "المقطوعة دي مش متاحة حالياً — اختاري غيرها.",
    rsvp_required: "اختاري أيوه أو لأ.",
    text_invalid: "الجملة الأولى لازم تكون ٢٠٠ حرف أو أقل.",
    link_invalid: "اللينك لازم يبدأ بـ https://",
    file_type: "الملف لازم يكون صورة أو فيديو (MP4/MOV) أو أغنية (MP3/M4A).",
    file_large: "في ملف أكبر من ٥٠ ميجا. لو كبير ارفعيه على درايف وحطي اللينك.",
    too_many_files: "أقصى عدد ٣٠ ملف. الباقي حطيه على درايف وحطي اللينك.",
    slug_checking: "استني ثانية، بنشوف اللينك متاح ولا لأ.",
    slug_short: "اللينك لازم يكون ٣ حروف على الأقل.",
    slug_long: "اللينك طويل أوي.",
    slug_chars: "استخدمي حروف إنجليزي صغيرة وأرقام وشرطة (-) بس.",
    slug_reserved: "الكلمة دي محجوزة، اختاري غيرها.",
    slug_taken: "اللينك ده محجوز لحد تاني، جربي غيره.",
    failed: "حصلت مشكلة بسيطة — جرّبي تاني من فضلك.",
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
        { num: "I", label: "Your evening" },
        { num: "II", label: "Aesthetic" },
        { num: "III", label: "Private preview" },
      ],
      titles: {
        1: "Tell us about your night.",
        2: "Choose your wedding aesthetic.",
        3: "Ready for your private preview.",
      },
      subtitles: {
        1: "See your finished invitation live on your phone—before paying a single pound. No account or card needed.",
        2: "Pick the opening theme, suite tier, and soft soundtrack that match your vision.",
        3: "Leave your WhatsApp so we can send your private studio link to preview, edit, and share with your sister or fiancé.",
      },
      previewTitle: "Watch your wedding aesthetic come to life.",
      inviteLangLabel: "Invitation language",
      partnerOneLabel: "Partner one",
      partnerTwoLabel: "Partner two",
      dateLabel: "Celebration date",
      datePlaceholder: "Select your date",
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
      totalNote: "One-time payment only after you love the preview",
      bespokePrompt: "Dreaming of a custom suite matched to your exact wedding palette?",
      bespokeLink: "Commission a bespoke suite ↗",
      back: "Back",
      continueBtn: "Continue",
      submit: "See my live preview",
      submitting: "Preparing your preview…",
      prevThemeAria: "Previous theme",
      nextThemeAria: "Next theme",
      openDemoAria: "Open full live demo",
      fallbackDesignName: "Signature Theme",
      fallbackDesignDesc:
        "Animated wax-seal reveal, curated music, and effortless guest RSVP.",
    },
    options: {
      packagesAria: "Suites",
      includedPrefix: "Included in every suite:",
      defaultMusicLabel: "Signature pairing",
      defaultMusicSub: "Plays softly as your invitation opens",
      musicAddonTitle: "Unlock the full soundtrack library",
      musicAddonDesc: "Choose from 50+ classical & orchestral pieces, or opt for a silent entrance.",
      includedMusicSub: "Included with your suite",
      soundtrackLabel: "Ceremony soundtrack",
      soundtrackEmpty:
        "Our studio will pair a soft curated instrumental track for your reveal.",
      noMusicLabel: "Silent entrance",
      noMusicSub: "Natural design sound only, no background music",
      curatedTrackSub: "Curated soundtrack",
      totalLabel: "Total",
    },
    request: {
      title: "Commission your bespoke suite.",
      sentTitle: "We've received your vision.",
      subtitle:
        "Share your wedding palette, moodboard, and date—our creative studio will craft an original animated invitation made exclusively for your night.",
      sentSubtitle: (phone: string) =>
        `Our bridal design concierge will message you on WhatsApp at ${phone} shortly.`,
      loggedFor: (name: string) => `Everything has been lovingly saved for ${name}.`,
      chatWhatsapp: "Chat on WhatsApp now",
      returnHome: "Return home",
      yourName: "Your name",
      yourNamePlaceholder: "Your full name",
      whatsapp: "WhatsApp number",
      celebrationType: "Celebration type",
      targetDate: "Target date (optional)",
      targetDatePlaceholder: "Select your target date",
      aestheticLabel: "Tell us about your aesthetic",
      aestheticPlaceholder:
        "Color palette, florals, dress mood, venue architecture, Pinterest or Instagram links...",
      back: "Back",
      submit: "Send my bespoke brief",
      submitting: "Sending your brief…",
      bespokeTierPrefix: "Bespoke tier",
      asideDesc:
        "Crafted one-on-one with Naila's creative team—complete with named guest links, personal notes, and custom cinematic opening motion.",
      liveSampleEyebrow: "BESPOKE LIVE SAMPLE",
      liveSampleCouple: "Youssef & Mariam",
      liveSampleMeta: "Named invitation with personal guest message",
      openLiveSample: "Open live sample",
      unavailableTitle: "Bespoke suites currently paused",
      unavailableSub:
        "Custom commissions are temporarily full. Message us on WhatsApp or start right away with one of our ready editorial suites.",
      createInvite: "Design your invitation",
    },
    samples: {
      navTemplates: "Designs",
      navFeatures: "Features",
      navStart: "Design yours",
      eyebrow: "LIVE SUITE DEMOS",
      title: "Feel every tier live on your phone.",
      lead: "Open any sample and tap the wax seal—experience the animated reveal, soft soundtrack, personal guest note, and effortless RSVP flow before you pick yours.",
      namedNote: (title: string | undefined, name: string) =>
        `Named link for ${[title, name].filter(Boolean).join(" ")} with personal note`,
      generalLink: "General invitation link",
      openLive: "Open live invitation",
      chooseTier: "Choose this suite",
      includedPrefix: "Included in every suite:",
    },
    previewDock: {
      templates: "Designs",
      musicBtn: "Music",
      musicPickerTitle: "Evening Soundtrack",
      musicPickerHint: "Audition any piece or select to hear it live inside this invitation.",
      closePickerAria: "Close music picker",
      usePrefix: "Design with",
    },
  },
  ar: {
    switchLangTitle: "EN",
    switchLangAria: "Switch site to English",
    backHomeAria: "الرجوع للرئيسية",
    builder: {
      steps: [
        { num: "١", label: "تفاصيل الفرح" },
        { num: "٢", label: "الروح والتصميم" },
        { num: "٣", label: "معاينتك الخاصة" },
      ],
      titles: {
        1: "احكيلنا عن تفاصيل فرحك.",
        2: "اختاري الروح اللي شبهك.",
        3: "خطوة أخيرة وتشوفي دعوتك لايف.",
      },
      subtitles: {
        1: "صمّمي دعوتك وشوفيها كاملة على موبايلك قبل ما تدفعي جنيه واحد — من غير تسجيل ولا كارت بنكي.",
        2: "اختاري التصميم اللي يليق بذوقك، الباقة المناسبة، والمقطوعة الموسيقية.",
        3: "سيبي رقم واتساب عشان نبعتلك صفحتك الخاصة اللي تشوفي منها الدعوة وتشاركيها مع أختك أو خطيبك.",
      },
      previewTitle: "شوفي دعوتك بتتشكّل قدام عينيك.",
      inviteLangLabel: "لغة الدعوة اللي هيشوفها الضيف",
      partnerOneLabel: "الاسم الأول",
      partnerTwoLabel: "الاسم الثاني",
      dateLabel: "تاريخ المناسبة",
      datePlaceholder: "اختاري تاريخ المناسبة",
      timeLabel: "ميعاد الحفل",
      timePlaceholder: "اختاري الميعاد",
      venueLabel: "اسم القاعة أو المكان",
      addressLabel: "المدينة أو العنوان (اختياري)",
      mapsLabel: "لينك لوكيشن جوجل ماب (اختياري)",
      mapsPlaceholder: "اختياري — سيبيه فاضي أو الصقي لينك المشاركة من جوجل ماب",
      clear: "مسح",
      skipOptionalLink: "تخطّي اللينك الاختياري",
      yourNameLabel: "اسمك بالكامل",
      yourNamePlaceholder: "اسمك للتواصل",
      whatsappLabel: "رقم الواتساب",
      totalNote: "دفعة واحدة بعد ما تعجبك المعاينة بس",
      bespokePrompt: "بتحلمي بتصميم حصري من الصفر على ألوان قاعتك ووردك؟",
      bespokeLink: "اطلبي تصميمك الخاص ↖",
      back: "رجوع",
      continueBtn: "التالي",
      submit: "ورّيني المعاينة الحيّة",
      submitting: "بنجهّز معاينتك…",
      prevThemeAria: "التصميم السابق",
      nextThemeAria: "التصميم التالي",
      openDemoAria: "افتحي المعاينة الكاملة",
      fallbackDesignName: "التصميم المختار",
      fallbackDesignDesc:
        "فتحة ختم شمع سينمائية، موسيقى هادية مختارة، وتأكيد حضور فوري للمعازيم.",
    },
    options: {
      packagesAria: "الباقات",
      includedPrefix: "مشمول مجاناً في كل باقة:",
      defaultMusicLabel: "موسيقى هذا التصميم",
      defaultMusicSub: "تُعزف بهدوء تلقائياً عند فتح الدعوة",
      musicAddonTitle: "اختاري لحنك الخاص من مكتبة الألحان",
      musicAddonDesc: "افتحي أكثر من ٥٠ مقطوعة مختارة أو اختاري دخولاً هادئاً بدون موسيقى.",
      includedMusicSub: "مشمولة في باقتك",
      soundtrackLabel: "الموسيقى المصاحبة للدعوة",
      soundtrackEmpty: "فريقنا هيختارلك مقطوعة هادية تليق بأجواء دعوتك.",
      noMusicLabel: "دخول هادئ بدون موسيقى",
      noMusicSub: "صوت التصميم فقط بدون خلفية موسيقية",
      curatedTrackSub: "مقطوعة مختارة",
      totalLabel: "الإجمالي",
    },
    request: {
      title: "اطلبي تصميمك الحصري.",
      sentTitle: "طلبك وصلنا بكل سعادة.",
      subtitle:
        "احكيلنا عن ذوقك، ألوان القاعة والورد، والأجواء اللي في بالك — وفريق التصميم في نايلة هينفّذلك دعوة حصرية معمولة ليوم فرحك لوحده.",
      sentSubtitle: (phone: string) =>
        `فريق التصميم في نايلة هيتواصل معاكي قريباً جداً على واتساب (${phone}).`,
      loggedFor: (name: string) => `سجّلنا كل تفاصيلك باسم ${name}.`,
      chatWhatsapp: "كلمينا على واتساب دلوقتي",
      returnHome: "العودة للرئيسية",
      yourName: "اسمك بالكامل",
      yourNamePlaceholder: "الاسم",
      whatsapp: "رقم الواتساب",
      celebrationType: "نوع المناسبة",
      targetDate: "التاريخ المقترح (اختياري)",
      targetDatePlaceholder: "اختاري التاريخ المقترح",
      aestheticLabel: "احكيلنا عن الأجواء اللي في بالك",
      aestheticPlaceholder:
        "الألوان والورد وطابع القاعة… وأي صور أو لينكات عاجباكي",
      back: "رجوع",
      submit: "ابعتي تفاصيل تصميمك",
      submitting: "بنبعت تفاصيلك…",
      bespokeTierPrefix: "الباقة الحصرية",
      asideDesc:
        "تصميم فردي خطوة بخطوة مع فريق نايلة الإبداعي — شامل لينك باسم كل معزوم، رسائل خاصة دافية، وحركة فتح سينمائية حصرية.",
      liveSampleEyebrow: "نموذج حي للتصميم الخاص",
      liveSampleCouple: "يوسف و مريم",
      liveSampleMeta: "دعوة شخصية باسم المعزوم مع رسالة إهداء خاصة",
      openLiveSample: "افتحي النموذج الحي",
      unavailableTitle: "الباقات الخاصة متوقفة حالياً",
      unavailableSub:
        "التصميم الحصري متوقف مؤقتاً — تقدري تكلمينا على واتساب أو تبدأي فوراً من تصميماتنا الجاهزة.",
      createInvite: "صمّمي دعوتك دلوقتي",
    },
    samples: {
      navTemplates: "التصميمات",
      navFeatures: "المزايا",
      navStart: "صمّمي دعوتك",
      eyebrow: "نماذج حيّة لكل باقة",
      title: "عيشي تجربة كل باقة لايف.",
      lead: "افتحي أي نموذج على موبايلك واضغطي على الختم — جرّبي حركة الفتح والموسيقى والرسالة الشخصية وتأكيد الحضور زي ما أهلك وأصحابك هيشوفوها بالظبط.",
      namedNote: (title: string | undefined, name: string) =>
        `لينك شخصي باسم ${[title, name].filter(Boolean).join(" ")} مع إهداء خاص`,
      generalLink: "لينك دعوة عام",
      openLive: "افتحي الدعوة الحيّة",
      chooseTier: "اختاري الباقة دي",
      includedPrefix: "مشمول مجاناً في كل باقة:",
    },
    previewDock: {
      templates: "التصميمات",
      musicBtn: "الموسيقى",
      musicPickerTitle: "ألحان الأمسية",
      musicPickerHint: "جرّبي أي مقطوعة أو اختاريها لسماعها مباشرةً عند فتح الدعوة.",
      closePickerAria: "إغلاق قائمة الموسيقى",
      usePrefix: "صمّمي بتصميم",
    },
  },
} as const;
