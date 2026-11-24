import type { Lang } from "@/lib/types";
import { formatArabicNumber } from "@/lib/text";

export type Currency = "EGP" | "USD";

export const USD_EXCHANGE_RATE = 50;

export function formatLandingPrice(egp: number, currency: Currency, lang: Lang): string {
  if (currency === "USD") {
    const usd = Math.max(1, Math.round(egp / USD_EXCHANGE_RATE));
    return `$${usd} USD`;
  }
  const num = lang === "ar" ? formatArabicNumber(egp) : egp.toLocaleString("en-US");
  return lang === "ar" ? `${num} ج.م` : `${num} EGP`;
}

export interface ReviewItem {
  quote: string;
  couple: string;
  location: string;
  stars?: number;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface LandingCopy {
  brandSub: string;
  nav: {
    features: string;
    reviews: string;
    faq: string;
    exploreTemplates: string;
    startPrefix: string;
    trialSub: string;
  };
  hero: {
    starsLabel: string;
    chosenBy: string;
    eyebrow: string;
    headline: string;
    lead: string;
    exploreTemplates: string;
    haveSampleLead: string;
    samplesLink: string;
    bullets: [string, string, string];
    swapAria: string;
    desktopDomain: string;
    phoneTag: string;
    phoneRsvp: string;
    phoneTitle: string;
    phoneSub: string;
    phoneCaption: string;
  };
  switchSection: {
    srHeading: string;
    srSub: string;
    label: string;
    offHeadline: string;
    offSub: string;
    onHeadlineStart: string;
    onHeadlineAccent: string;
    onSub: string;
  };
  templates: {
    title: string;
    subtitle: string;
    carousel: string;
    grid: string;
    liveDemo: string;
    prevAria: string;
    nextAria: string;
  };
  samples: {
    title: string;
    subtitle: string;
    eyebrow: string;
    liveDemo: string;
  };
  manifesto: {
    srLabel: string;
    segments: Array<{ text: string; italic?: boolean; imageSlot?: 1 | 2 | 3 }>;
  };
  features: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cards: {
      global: { title: string; body: string };
      guests: { title: string; body: string; rows: [string, string, string] };
      events: {
        title: string;
        body: string;
        steps: Array<{ label: string; title: string }>;
      };
      notes: {
        title: string;
        body: string;
        eyebrow: string;
        caption: string;
      };
      domain: { title: string; body: string; url: string };
      manage: { title: string; body: string; initials: [string, string, string] };
    };
  };
  pricing: {
    eyebrow: string;
    badge: string;
    title: string;
    lead: string;
    customCta: string;
    allIncludedLabel: string;
  };
  reviews: {
    eyebrow: string;
    title: string;
    rating: string;
    ratingLabel: string;
    row1: ReviewItem[];
    row2: ReviewItem[];
  };
  faq: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: FaqItem[];
  };
  footer: {
    tagline: string;
    links: Array<{ label: string; href: string }>;
    copyright: string;
  };
}

export const LANDING_COPY: Record<Lang, LandingCopy> = {
  en: {
    brandSub: "Bridal Stationery House",
    nav: {
      features: "Features",
      reviews: "Bride Stories",
      faq: "FAQ",
      exploreTemplates: "Browse Designs",
      startPrefix: "Design yours —",
      trialSub: "Preview free before you pay.",
    },
    hero: {
      starsLabel: "4.9 stars",
      chosenBy: "Loved by 100+ brides",
      eyebrow: "Editorial Digital Invitations",
      headline: "The wedding invite you've been dreaming of.",
      lead: "You've curated every bloom, ribbon, and candle—your wedding shouldn't begin with a plain WhatsApp image. Naila turns your announcement into a cinematic wax-seal reveal with soft music, addressed personally to everyone you love.",
      exploreTemplates: "Browse Designs",
      haveSampleLead: "Want to feel the reveal yourself?",
      samplesLink: "Try live samples",
      bullets: [
        "Wax-Seal Opening",
        "Named Guest Links",
        "Instant RSVP & Wishes",
      ],
      swapAria: "Swap device preview",
      desktopDomain: "ahmedandsara.naila.inv",
      phoneTag: "A&S",
      phoneRsvp: "Submit RSVP",
      phoneTitle: "our celebration",
      phoneSub: "chapter one: the invitation",
      phoneCaption: "Tap the seal to unfold the evening",
    },
    switchSection: {
      srHeading:
        "Planning a wedding means holding a hundred details at once. Naila gives your guest list, invitations, and RSVPs one serene space to come together.",
      srSub:
        "From the first wax seal opened on WhatsApp to the wishes you'll treasure the morning after.",
      label: "All in harmony",
      offHeadline: "Planning your wedding means holding a hundred details at once.",
      offSub: "Guest lists, spelling every name right, chasing RSVPs across WhatsApp chats—it shouldn't steal your calm.",
      onHeadlineStart: "There may not be a magic switch—but there is ",
      onHeadlineAccent: "one serene place for every guest and detail.",
      onSub: "From the first wax seal opened on WhatsApp to the heartfelt wishes you'll read the morning after.",
    },
    templates: {
      title: "Designs that reflect your taste from the first tap.",
      subtitle:
        "Editorial wedding openings crafted for brides who care about every detail—graceful motion, couture typography, and a first impression guests talk about.",
      carousel: "Carousel",
      grid: "Grid",
      liveDemo: "Live demo",
      prevAria: "Previous design",
      nextAria: "Next design",
    },
    samples: {
      title: "Feel the moment your guests will open.",
      subtitle:
        "Tap the wax seal on your own phone, hear the music swell, and experience every suite exactly as your family and friends will.",
      eyebrow: "Live suite",
      liveDemo: "Live demo",
    },
    manifesto: {
      srLabel:
        "Every detail of your wedding was chosen with love. Naila lets your guests feel it from the first tap.",
      segments: [
        { text: "Every" },
        { text: "detail" },
        { text: "of" },
        { text: "your" },
        { text: "wedding", imageSlot: 1 },
        { text: "was" },
        { text: "chosen", italic: true },
        { text: "with", italic: true },
        { text: "love.", italic: true },
        { text: "Naila" },
        { text: "lets", imageSlot: 2 },
        { text: "your" },
        { text: "guests" },
        { text: "feel" },
        { text: "it", imageSlot: 3 },
        { text: "from", italic: true },
        { text: "the", italic: true },
        { text: "first", italic: true },
        { text: "tap.", italic: true },
      ],
    },
    features: {
      eyebrow: "Designed for your peace of mind",
      title: "Everything your guest list needs, beautifully calm.",
      subtitle:
        "No pixelated WhatsApp flyers, no awkward RSVP follow-up texts—every step from the opening reveal to your guest count flows effortlessly.",
      cards: {
        global: {
          title: "For family & friends everywhere",
          body: "Whether your loved ones are in Cairo or flying in from abroad, your invitation reads effortlessly in both Arabic and English.",
        },
        guests: {
          title: "Guest list & RSVPs, without the chaos",
          body: "Upload your Excel guest list in seconds, send named WhatsApp links, and see who opened and confirmed—no spreadsheets or awkward texts.",
          rows: ["Aunt Nadia & family", "Salma + guest", "Dr. Mona El-Sayed"],
        },
        events: {
          title: "An opening moment they'll replay",
          body: "A graceful animated reveal, soft curated music, a live countdown to your night, and an instant Google Maps pin for your venue.",
          steps: [
            { label: "Step 1", title: "Tap the wax seal" },
            { label: "Step 2", title: "Cinematic reveal & music" },
            { label: "Step 3", title: "One-tap RSVP & map" },
          ],
        },
        notes: {
          title: "A warm note for every loved one",
          body: "Greet elders, aunts, and best friends by name and title—and tuck a personal note inside their invitation alone.",
          eyebrow: "Personal note",
          caption: "Made with love for you",
        },
        domain: {
          title: "A WhatsApp link worth forwarding",
          body: "No blurry images or heavy PDFs—one crisp, graceful link that opens instantly in full beauty on iPhone and Android.",
          url: "naila.inv/ahmed-and-sara",
        },
        manage: {
          title: "Effortless control, zero passwords",
          body: "One private studio link you can open anytime—or share with your sister or fiancé—to update details, check RSVPs, and read every wish.",
          initials: ["S", "A", "N"],
        },
      },
    },
    pricing: {
      eyebrow: "Naila Bridal Studio",
      badge: "One-time payment",
      title: "Couture invitations, with zero subscription stress.",
      lead: "Design and preview your complete invitation on your phone—and share it with your sister or fiancé—before paying a single pound. When every detail feels right, one payment via Paymob or Instapay keeps it live through your night.",
      customCta: "Commission a bespoke design",
      allIncludedLabel: "Included in every suite",
    },
    reviews: {
      eyebrow: "Notes from our brides",
      title: "The invitation your friends won't stop asking about.",
      rating: "4.9",
      ratingLabel: "Bride rating",
      row1: [
        {
          quote:
            "I sent our invitation to my family group and my phone didn't stop ringing for hours! Every single cousin asked who designed it—it set the exact tone for my wedding before the night even started.",
          couple: "Sara M.",
          location: "New Cairo",
        },
        {
          quote:
            "My family is in Cairo and my bridesmaids flew in from London, so having Arabic and English look equally couture—never cluttered—gave me so much relief.",
          couple: "Laila H.",
          location: "Zamalek, Cairo",
        },
        {
          quote:
            "My mom was in tears seeing every aunt and uncle greeted by their exact title inside the envelope. It felt so respectful, intimate, and truly ours.",
          couple: "Nour E.",
          location: "Sheikh Zayed",
        },
        {
          quote:
            "I uploaded my 240-guest Excel sheet in thirty seconds and sent every WhatsApp link in one evening. Knowing who opened and confirmed saved me from wedding-week stress.",
          couple: "Mariam K.",
          location: "Heliopolis",
        },
      ],
      row2: [
        {
          quote:
            "I refused to send a blurry WhatsApp flyer after spending months on my wedding palette. Seeing the wax seal open with soft music on everyone's phone felt like pure magic.",
          couple: "Salma A.",
          location: "Alexandria",
        },
        {
          quote:
            "The wishes book became my favorite keepsake from the entire wedding. I curled up the morning after our reception and read every single blessing with happy tears.",
          couple: "Farah T.",
          location: "Maadi, Cairo",
        },
        {
          quote:
            "Being able to build the whole invitation, see our real names inside it, and send the preview to my sister before paying via Instapay made choosing Naila a no-brainer.",
          couple: "Hana S.",
          location: "El Gouna",
        },
        {
          quote:
            "We used Naila for both my katb kitab and wedding—three of my best friends immediately saved the link for their own engagements. Quiet luxury at its finest.",
          couple: "Dina R.",
          location: "Dubai & Cairo",
        },
      ],
    },
    faq: {
      eyebrow: "Good to know",
      title: "Everything on your mind, answered.",
      subtitle:
        "Clear, calm answers before you start—free previewing, payment, and what your guests will experience.",
      items: [
        {
          question: "Can I see my finished invitation before I pay?",
          answer:
            "Yes. Choose your favorite design, enter your names, venue, date, and music, and preview the full live invitation on your phone—you can even show your fiancé or sister first. You only pay once you love every detail.",
        },
        {
          question: "Is there any monthly subscription or hidden fee?",
          answer:
            "Never. Every suite is a single, transparent one-time payment. Your invitation, named guest links, live RSVP tracker, and wishes keepsake stay active through your celebration and beyond.",
        },
        {
          question: "What do my guests experience when they tap the link?",
          answer:
            "You share a clean link on WhatsApp. They tap the wax seal, watch the animated opening with soft music, read their personal greeting, confirm attendance in one tap, leave you a heartfelt wish, and open Google Maps—no app or login needed.",
        },
        {
          question: "Can each guest receive a link with their own name and personal note?",
          answer:
            "Yes! On our Tailored and Bespoke suites, every guest opens a private link greeting them by title and name—plus an optional warm message written exclusively for them.",
        },
        {
          question: "Can I upload my guest list from Excel?",
          answer:
            "Easily. Upload your Excel or CSV file with names, titles, phone numbers, and personal notes. Naila formats Egyptian numbers automatically and prepares ready-to-send WhatsApp links in seconds.",
        },
        {
          question: "Are both Arabic and English included?",
          answer:
            "Yes—full Arabic (RTL) and English (LTR) support with luxury editorial calligraphy is included in every suite at no extra cost.",
        },
        {
          question: "How do I pay—card or Instapay?",
          answer:
            "You can activate instantly online with Visa/Mastercard via Paymob, or transfer through Instapay and upload your confirmation screenshot right inside your private studio page.",
        },
        {
          question: "What if our venue timing or a small wording detail changes later?",
          answer:
            "No stress at all. Your private management link stays with you so you can update the date, time, venue, greeting text, music, or guest list anytime without needing a password.",
        },
        {
          question: "Can your studio match my exact wedding colors and moodboard?",
          answer:
            "We'd love to. Choose our Tailored or Bespoke tier to share your Pinterest board, floral palette, or venue architecture—our design team will craft an original animated invitation made exclusively for your night.",
        },
      ],
    },
    footer: {
      tagline:
        "Editorial digital invitations—crafted so the first glimpse of your wedding feels as graceful as the night itself.",
      links: [
        { label: "Designs", href: "/#templates" },
        { label: "Live Samples", href: "/samples" },
        { label: "Features", href: "/#features" },
        { label: "Suites & Pricing", href: "/#reviews" },
        { label: "FAQ", href: "/#faq" },
        { label: "Design Yours", href: "/create" },
        { label: "Bespoke Suite", href: "/request?p=3" },
        { label: "Bride Stories", href: "/#reviews" },
      ],
      copyright: "© 2026 NAILA",
    },
  },
  ar: {
    brandSub: "دار نايلة للدعوات الرقمية",
    nav: {
      features: "المزايا",
      reviews: "حكايات العرايس",
      faq: "الأسئلة الشائعة",
      exploreTemplates: "التصميمات",
      startPrefix: "صمّمي دعوتك —",
      trialSub: "جرّبيها كاملة مجاناً قبل ما تدفعي.",
    },
    hero: {
      starsLabel: "٤.٩ نجوم",
      chosenBy: "اختيار أكثر من ١٠٠ عروسة",
      eyebrow: "دار نايلة للدعوات الرقمية",
      headline: "دعوة فرح عمرك ما شفتي زيّها.",
      lead: "تعبتي في اختيار كل تفصيلة في فرحك — من الفستان للورد ولون القاعة — فما ينفعش تبدأي ليلتك بصورة عادية على واتساب. نايلة بتحوّل دعوتك للحظة راقية بختم شمع وموسيقى هادية، توصل لكل ضيف باسمه وبذوقك.",
      exploreTemplates: "شوفي التصميمات",
      haveSampleLead: "حابّة تعيشي التجربة بنفسك؟",
      samplesLink: "جرّبي الأمثلة الحيّة",
      bullets: [
        "فتح سينمائي بختم الشمع",
        "لينك شخصي باسم كل ضيف",
        "تأكيد حضور ودفتر تهاني",
      ],
      swapAria: "تبديل عرض الدعوة",
      desktopDomain: "ahmedandsara.naila.inv",
      phoneTag: "أ & س",
      phoneRsvp: "تأكيد الحضور",
      phoneTitle: "ليلة العمر",
      phoneSub: "أول لحظة في حكايتنا",
      phoneCaption: "اضغط على الختم لفتح الدعوة",
    },
    switchSection: {
      srHeading:
        "تجهيزات فرحك تفاصيلها ما بتخلصش، بس دعوتك ومعازيمك بقوا متجمعين في مكان واحد.",
      srSub:
        "من أول لحظة بتبعتي فيها الدعوة على واتساب، لحد آخر تهنئة هتقريها تاني يوم الصبح.",
      label: "كل حاجة في إيدك",
      offHeadline: "تجهيزات فرحك تفاصيلها ما بتخلصش.",
      offSub: "كشف المعازيم، ترتيب الأسامي، السؤال مين جاي ومين لأ، والتفاصيل اللي بتتوه في شاتات واتساب.",
      onHeadlineStart: "يمكن الفرح ما بيجهزش بضغطة زرار… بس ",
      onHeadlineAccent: "دعوتك ومعازيمك بقوا في مكان واحد.",
      onSub: "من أول لحظة بتبعتي فيها الدعوة على واتساب، لحد آخر تهنئة هتقريها تاني يوم الصبح.",
    },
    templates: {
      title: "تصميمات راقية تليق بفرحك.",
      subtitle:
        "كل تصميم معمول بتفاصيل هادية وشياكة حقيقية — فتحة ظرف ناعمة، خطوط عربية وإنجليزية فخمة، وإحساس مختلف من أول ما الضيف يفتحه.",
      carousel: "عرض سينمائي",
      grid: "كل التصميمات",
      liveDemo: "معاينة حيّة",
      prevAria: "التصميم السابق",
      nextAria: "التصميم التالي",
    },
    samples: {
      title: "جرّبي الدعوة بنفسك قبل ما تختاري.",
      subtitle:
        "افتحي أي باقة على موبايلك، اضغطي على الختم، واسمعي الموسيقى — نفس التجربة اللي هيعيشها أهلك وأصحابك أول ما توصلهم دعوتك.",
      eyebrow: "نموذج حي",
      liveDemo: "معاينة حيّة",
    },
    manifesto: {
      srLabel:
        "كل تفصيلة في فرحك اخترتيها بحب. ونايلة بتوصل إحساسها لضيوفك من أول لحظة.",
      segments: [
        { text: "كل" },
        { text: "تفصيلة" },
        { text: "في" },
        { text: "فرحك", imageSlot: 1 },
        { text: "اخترتيها", italic: true },
        { text: "بحب.", italic: true },
        { text: "ونايلة" },
        { text: "بتوصل", imageSlot: 2 },
        { text: "إحساسها" },
        { text: "لضيوفك", imageSlot: 3 },
        { text: "من", italic: true },
        { text: "أول", italic: true },
        { text: "لحظة.", italic: true },
      ],
    },
    features: {
      eyebrow: "معمولة لراحة بالك",
      title: "كل تفاصيل دعوتك ومعازيمك… في مكان واحد.",
      subtitle:
        "من غير كركبة ولا مكالمات متابعة محرجة — كل خطوة معمول حسابها بهدوء عشان تركّزي في فرحتك وبس.",
      cards: {
        global: {
          title: "أهلك وأصحابك… مهما كانوا بعيد",
          body: "سواء عيلتك في القاهرة أو أصحابك مسافرين من بره مصر، دعوتك بتوصلهم بنفس الشياكة بالعربي أو الإنجليزي.",
        },
        guests: {
          title: "كشف معازيمك وتأكيد الحضور قدامك لحظة بلحظة",
          body: "ارفعي كشف الضيوف من إكسل في ثانية، ابعتي لكل حد لينك باسمه على واتساب، واعرفي مين فتح ومين جاي من غير إحراج ولا مكالمات.",
          rows: ["عائلة المهندس طارق منصور", "سلمى وزوجها", "د. منى الشاذلي"],
        },
        events: {
          title: "لحظة فتح تخلي الكل يسألك عنها",
          body: "ظرف بيتفتح بحركة ناعمة، موسيقى تعيشهم الأجواء، عدّاد تنازلي ليومك المنتظر، ولوكيشن القاعة على الخريطة.",
          steps: [
            { label: "أولاً", title: "ضغطة على ختم الشمع" },
            { label: "ثانياً", title: "فتح سينمائي وموسيقى هادية" },
            { label: "ثالثاً", title: "تأكيد الحضور وحفظ الموعد" },
          ],
        },
        notes: {
          title: "كلمة دافية من قلبك لكل ضيف",
          body: "كل حد غالي عليكي يشوف اسمه ولقبه جوه الدعوة، وتقدري تسيبيله كلمة منك لوحده تحسّسه قد إيه وجوده فارق معاكي.",
          eyebrow: "إهداء خاص",
          caption: "وجودك ينوّر ليلتنا",
        },
        domain: {
          title: "لينك شيك يليق على واتساب",
          body: "مفيش صور بتبكسل ولا ملفات PDF تقيلة — لينك أنيق يفتح فوراً على أي موبايل بأعلى جودة.",
          url: "naila.inv/ahmed-and-sara",
        },
        manage: {
          title: "كل حاجة في إيدك… من غير باسورد ولا تعقيد",
          body: "صفحة خاصة بيكي — وتقدري تشاركيها مع أختك أو خطيبك — تعدّلي منها التفاصيل، تتابعي الحضور، وتقري كل كلام حبايبك في أي وقت.",
          initials: ["س", "أ", "ن"],
        },
      },
    },
    pricing: {
      eyebrow: "باقات نايلة",
      badge: "دفعة واحدة بدون اشتراك",
      title: "كل اللي تحتاجيه لدعوتك… بدفعة واحدة واضحة.",
      lead: "صمّمي دعوتك بأساميكم الحقيقية وشوفيها على موبايلك — وورّيها لأختك أو خطيبك — مجاناً قبل ما تدفعي جنيه واحد. ولما ترتاحي لكل تفصيلة، دفعة واحدة بفيزا أو إنستاباي تفعّلها لحد بعد الفرح.",
      customCta: "اطلبي تصميمك الخاص",
      allIncludedLabel: "مشمول مجاناً في كل الباقات",
    },
    reviews: {
      eyebrow: "من كلام عرايس نايلة",
      title: "الدعوة اللي كل صحابك وقرايبك هيسألوكي عليها.",
      rating: "٤.٩",
      ratingLabel: "تقييم العرايس",
      row1: [
        {
          quote:
            "أول ما بعت الدعوة على جروب العيلة، التليفون ما سكتش! كل قرايبي وصحابي سألوني عملتها فين — بجد خلّت الفرحة تبدأ قبل ميعاد الفرح بأسبوع.",
          couple: "سارة م.",
          location: "التجمع الخامس",
        },
        {
          quote:
            "أهلي في القاهرة وأصحابي جايين من لندن، وإن الدعوة تطلع بالعربي والإنجليزي بنفس الشياكة ريّحني جداً وحسّيت إنها معمولة ليا مخصوص.",
          couple: "ليلى ح.",
          location: "الزمالك",
        },
        {
          quote:
            "ماما فرحت أوي لما شافت خالاتي وأعمامي كل واحد بيفتح اللينك يلاقي اسمه ولقبه جوه الظرف — تفصيلة صغيرة بس فرقت مع الكبار قبل الصغيرين.",
          couple: "نور ع.",
          location: "الشيخ زايد",
        },
        {
          quote:
            "رفعت كشف فيه ٢٤٠ ضيف من الإكسل في ثواني وبعت اللينكات في قعدة واحدة. إني عارفة مين فتح ومين جاي شال عني توتر أسبوع الفرح كله.",
          couple: "مريم ك.",
          location: "مصر الجديدة",
        },
      ],
      row2: [
        {
          quote:
            "بعد شهور من التجهيز واختيار ألوان الفرح، ما كنتش متخيلة أبعت صورة عادية بتبكسل على واتساب. فتحة الختم بالموسيقى على الموبايل طلعت تحفة بجد.",
          couple: "سلمى أ.",
          location: "الإسكندرية",
        },
        {
          quote:
            "دفتر التهاني كان أحلى ذكرى فضلتلي من الفرح كله — قعدت تاني يوم الصبح أقرا دعوات حبايبي وأنا مبسوطة أوي بكل كلمة اتكتبتلي.",
          couple: "فرح ط.",
          location: "المعادي",
        },
        {
          quote:
            "أكتر حاجة طمّنتني إني شفت دعوتنا كاملة بأسامينا على موبايلي وورّيتها لأختي قبل ما أحوّل جنيه واحد على إنستاباي. تجربة سلسة ومريحة جداً.",
          couple: "هنا س.",
          location: "الجونة",
        },
        {
          quote:
            "عملت بيها كتب الكتاب والفرح، وصحابي حفظوا اللينك فوراً عشان يعملوا بيها خطوبتهم. ذوق هادي وفخم من غير أي زحمة.",
          couple: "دينا ر.",
          location: "دبي والقاهرة",
        },
      ],
    },
    faq: {
      eyebrow: "كل اللي يطمنك",
      title: "كل اللي في بالك، جاوبناه.",
      subtitle:
        "إجابات واضحة قبل ما تبدأي — المعاينة المجانية، الدفع، وتجربة ضيوفك.",
      items: [
        {
          question: "أقدر أشوف دعوتنا كاملة قبل ما أدفع؟",
          answer:
            "طبعاً! بتختاري التصميم، تكتبي الأسامي والتاريخ والقاعة والموسيقى، وتشوفي دعوتك كاملة لايف على موبايلك — وتقدري تورّيها لخطيبك أو لأختك — قبل ما تدفعي جنيه واحد. ولما تعجبك، بتفعّليها بدفعة واحدة.",
        },
        {
          question: "هل في أي اشتراك شهري أو مصاريف مخفية؟",
          answer:
            "أبداً. كل باقة بتدفعيها مرة واحدة بس من غير أي تجديد، وبتفضل الدعوة ولينكات الضيوف ودفتر التهاني شغالين معاكي لحد بعد الفرح.",
        },
        {
          question: "ضيوفي بيشوفوا الدعوة وبيأكدوا حضورهم إزاي؟",
          answer:
            "بتبعتيلهم اللينك على واتساب، يفتحوه ويضغطوا على ختم الشمع، يشوفوا فتحة الظرف بالموسيقى وتفاصيل الفرح واللوكيشن على جوجل ماب، ويأكدوا حضورهم ويسيبولك كلمة حلوة في ثانية من غير أي تسجيل.",
        },
        {
          question: "ينفع كل معزوم يوصله لينك باسمه ورسالة مخصوصة ليه؟",
          answer:
            "أكيد! في باقتي «على ذوقك» و«الخاصة»، كل ضيف بيوصله لينك شخصي بيلقّبه باسمه (مثلاً: أستاذ / دكتورة / عائلة…) ومعاه كلمة دافية منك لو حابّة.",
        },
        {
          question: "لو عندي كشف معازيم كبير على إكسل، أقدر أرفعه مرة واحدة؟",
          answer:
            "بسهولة جداً! ارفعي ملف إكسل أو CSV فيه الأسامي والأرقام، ونايلة بتظبط أرقام الموبايل المصرية تلقائياً وتجهزلك لينك واتساب جاهز لكل ضيف بضغطة واحدة.",
        },
        {
          question: "هل الدعوة تنفع عربي وإنجليزي؟",
          answer:
            "طبعاً، العربي والإنجليزي مشمولين مجاناً في كل الباقات، وبخطوط عربية وإنجليزية فخمة مختارة بعناية عشان الاتنين يطلعوا بنفس الرقي.",
        },
        {
          question: "إيه طرق الدفع المتاحة عندكم؟",
          answer:
            "تقدري تفعّلي فوراً أونلاين بفيزا أو ماستركارد عن طريق Paymob، أو تحوّلي على إنستاباي وترفعي صورة التحويل من صفحتك الخاصة.",
        },
        {
          question: "لو ميعاد القاعة اتغيّر أو حبّيت أعدّل كلمة بعد ما أعمل الدعوة؟",
          answer:
            "ولا يهمك خالص — صفحتك الخاصة بتفضل معاكي على طول، تقدري تعدّلي التاريخ أو العنوان أو نص الدعوة أو تزوّدي معازيم في أي وقت من غير باسورد.",
        },
        {
          question: "ممكن تصمموا دعوة مخصوصة بألوان وثيم فرحي من الصفر؟",
          answer:
            "أكيد طبعاً! اختاري باقة «على ذوقك» أو «الخاصة» وابعتيلنا صور الإلهام أو ألوان القاعة والورد، وفريق التصميم عندنا هينفّذلك دعوة حصرية معمولة ليلتك لوحدها.",
        },
      ],
    },
    footer: {
      tagline:
        "دار مصرية للدعوات الرقمية — نصمّم أول لحظة في فرحك بذوق شبهك.",
      links: [
        { label: "التصميمات", href: "/ar#templates" },
        { label: "أمثلة حيّة", href: "/ar/samples" },
        { label: "المزايا", href: "/ar#features" },
        { label: "الباقات", href: "/ar#reviews" },
        { label: "الأسئلة الشائعة", href: "/ar#faq" },
        { label: "صمّمي دعوتك", href: "/ar/create" },
        { label: "تصميم حصري", href: "/ar/request?p=3" },
        { label: "حكايات العرايس", href: "/ar#reviews" },
      ],
      copyright: "© ٢٠٢٦ نايلة",
    },
  },
};
