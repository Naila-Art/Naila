import type { Lang } from "@/lib/types";

export type Currency = "EGP" | "USD";

export const USD_EXCHANGE_RATE = 50;

export function formatLandingPrice(egp: number, currency: Currency, lang: Lang): string {
  if (currency === "USD") {
    const usd = Math.max(1, Math.round(egp / USD_EXCHANGE_RATE));
    return `$${usd} USD`;
  }
  const num = egp.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");
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
    steps: Array<{ num: string; title: string; body: string }>;
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
    brandSub: "Wedding Essentials",
    nav: {
      features: "Features",
      reviews: "Reviews",
      faq: "FAQ",
      exploreTemplates: "Explore Templates",
      startPrefix: "Start your invite —",
      trialSub: "Preview free before paying.",
    },
    hero: {
      starsLabel: "4.9 stars",
      chosenBy: "Chosen by 100+ couples",
      eyebrow: "Editorial Digital Invitations",
      headline: "Unlike any wedding invite you've ever seen.",
      lead: "For couples who want something far beyond the usual, Naila crafts an animated wax-seal invitation that feels bold, elevated, and unmistakably your own from the very first tap.",
      exploreTemplates: "Explore Templates",
      haveSampleLead: "Want to test every tier live?",
      samplesLink: "View live samples",
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
        "Planning a wedding may not be as simple as flipping a switch. Naila gives every guest, detail, and moment one beautiful place to come together.",
      srSub:
        "Naila keeps every guest, invitation, and RSVP thoughtfully connected.",
      label: "Make it yours",
      offHeadline: "If only planning a wedding were as simple as flipping a switch.",
      offSub: "The guest list, the names, the RSVPs—it adds up quickly.",
      onHeadlineStart: "There may not be a single switch—but there is ",
      onHeadlineAccent: "one beautiful place for everything.",
      onSub: "Naila keeps every guest, detail, and moment thoughtfully connected.",
    },
    templates: {
      title: "Wedding invites, made memorable.",
      subtitle:
        "Complete cinematic invitation designs with animated openings, refined typography, and bespoke details.",
      carousel: "Carousel",
      grid: "Grid",
      liveDemo: "Live demo",
      prevAria: "Previous design",
      nextAria: "Next design",
    },
    samples: {
      title: "Live suites, crafted for every tier.",
      subtitle:
        "Open any package sample on your phone and tap the wax seal—experience every detail exactly as your guests will.",
      eyebrow: "Live suite",
      liveDemo: "Live demo",
    },
    manifesto: {
      srLabel:
        "Your wedding lives in the details. Naila turns them into a moment that already feels like yours.",
      segments: [
        { text: "Your" },
        { text: "wedding" },
        { text: "lives", imageSlot: 1 },
        { text: "in", italic: true },
        { text: "the", italic: true },
        { text: "details.", italic: true },
        { text: "Naila" },
        { text: "turns" },
        { text: "them", imageSlot: 2 },
        { text: "into" },
        { text: "a" },
        { text: "place" },
        { text: "that" },
        { text: "already", imageSlot: 3 },
        { text: "feels", italic: true },
        { text: "like", italic: true },
        { text: "yours.", italic: true },
      ],
    },
    features: {
      eyebrow: "Made for the whole celebration",
      title: "Everything your wedding needs, beautifully connected.",
      subtitle:
        "From the first tap on the wax seal to the final RSVP, every part of Naila is designed to feel considered, effortless, and unmistakably yours.",
      cards: {
        global: {
          title: "Made for your global guest list",
          body: "Welcome guests near and far with invitations that flow effortlessly between Arabic and English.",
        },
        guests: {
          title: "Guests and RSVPs, together",
          body: "Import your guest list from Excel, generate named WhatsApp links, and watch opens and RSVPs live.",
          rows: ["The Mansour household", "Karim + guest", "Dr. Mona El-Sayed"],
        },
        events: {
          title: "Every moment, beautifully choreographed",
          body: "From the animated envelope reveal and curated music to the live countdown and Google Maps pin.",
          steps: [
            { label: "Step 1", title: "Tap the wax seal" },
            { label: "Step 2", title: "Cinematic reveal & music" },
            { label: "Step 3", title: "One-tap RSVP & map" },
          ],
        },
        notes: {
          title: "Personal notes for every guest",
          body: "Address each guest by title and name—and slip an intimate personal message into their invitation alone.",
          eyebrow: "Personal invitation",
          caption: "A first impression",
        },
        domain: {
          title: "Share effortlessly on WhatsApp",
          body: "Send one crisp, password-free link per guest—ready to open instantly on iPhone and Android.",
          url: "naila.inv/ahmed-and-sara",
        },
        manage: {
          title: "No accounts or passwords",
          body: "Manage your guests, wishes book, and event details from one private studio link you own.",
          initials: ["A", "S", "N"],
        },
      },
    },
    pricing: {
      eyebrow: "Naila Studio",
      badge: "One-time purchase",
      title: "Everything you need, without another subscription.",
      lead: "Build and preview your complete invitation before paying a single pound. When you are ready, one simple payment via Paymob or Instapay keeps everything live through your celebration.",
      steps: [
        {
          num: "01",
          title: "Choose a starting design",
          body: "Pick from our editorial wedding, engagement, and katb kitab themes—or commission a bespoke suite.",
        },
        {
          num: "02",
          title: "Make every detail yours",
          body: "Add your names, date, Google Maps venue, soundtrack, and personalized wording in minutes.",
        },
        {
          num: "03",
          title: "Publish and share on WhatsApp",
          body: "Activate with one payment, send named WhatsApp links, and track every open, RSVP, and wish live.",
        },
      ],
      customCta: "Request bespoke design",
      allIncludedLabel: "Included in every package",
    },
    reviews: {
      eyebrow: "Notes from our couples",
      title: "The kind of invite guests keep talking about.",
      rating: "4.9",
      ratingLabel: "Average rating",
      row1: [
        {
          quote:
            "We kept replaying the preview because it genuinely felt like us. Our guests noticed every little detail, especially how smoothly the wax seal opened on their phones.",
          couple: "Sara & Ahmed",
          location: "New Cairo",
        },
        {
          quote:
            "Having both Arabic and English invitations without feeling cluttered was huge for our families abroad. It felt bespoke from the very first click.",
          couple: "Laila & Omar",
          location: "Zamalek, Cairo",
        },
        {
          quote:
            "Our friends kept asking which studio designed our invitation. Seeing each guest's name appear inside the envelope made everyone message us back immediately.",
          couple: "Nour & Karim",
          location: "Sheikh Zayed",
        },
        {
          quote:
            "We imported 240 guests from Excel in thirty seconds and sent every single WhatsApp link with a personal note. Tracking who opened and confirmed saved us weeks.",
          couple: "Mariam & Youssef",
          location: "Heliopolis",
        },
      ],
      row2: [
        {
          quote:
            "The mobile opening feels like cinema—nothing feels squeezed in or secondary, which mattered because every single guest opened it on WhatsApp.",
          couple: "Salma & Tarek",
          location: "Alexandria",
        },
        {
          quote:
            "The wishes wall turned into our favorite keepsake from the entire wedding weekend. We read every message together the morning after.",
          couple: "Farah & Ziad",
          location: "Maadi, Cairo",
        },
        {
          quote:
            "No logins, no subscriptions, and we previewed the full animation with our real names before paying on Instapay. Effortless from start to finish.",
          couple: "Hana & Sherif",
          location: "El Gouna",
        },
        {
          quote:
            "Our guests said it felt like opening a luxury couture invitation magazine right on their phone. Truly unlike anything we had seen.",
          couple: "Dina & Mostafa",
          location: "Dubai & Cairo",
        },
      ],
    },
    faq: {
      eyebrow: "Good to know",
      title: "Questions, answered.",
      subtitle:
        "The practical details before you commit—what you can preview, how payment works, and what your guests experience.",
      items: [
        {
          question: "Can I preview my invitation before I pay?",
          answer:
            "Yes. You can pick any design, enter your names, venue, date, and soundtrack, and inspect the complete live invitation on your phone before paying anything. Once you love it, activate with a single payment.",
        },
        {
          question: "Is Naila a subscription?",
          answer:
            "No. Every package is a simple one-time payment with zero recurring charges. Your invitation, guest links, RSVP tracking, and wishes book remain active through your event and beyond.",
        },
        {
          question: "How do guests open and RSVP to the invitation?",
          answer:
            "You share a clean link via WhatsApp. Your guest taps the wax seal, watches the animated opening accompanied by music, sees their personalized greeting, confirms attendance in one tap, sends a wish, and opens Google Maps.",
        },
        {
          question: "Can each guest receive a link with their own name and personal note?",
          answer:
            "Yes. On our Signature and Bespoke packages, every guest gets a private named link greeting them by title and name—plus an optional personal message written exclusively for them.",
        },
        {
          question: "Can I import my guest list from Excel?",
          answer:
            "Absolutely. Upload an Excel or CSV sheet with title, name, phone number, and personal note columns. Naila normalizes Egyptian phone numbers automatically and creates ready-to-send WhatsApp links.",
        },
        {
          question: "Do invitations support both Arabic and English?",
          answer:
            "Yes. Every package includes full Arabic (RTL) and English (LTR) support with refined typography tailored to each script, at no extra charge.",
        },
        {
          question: "How do I pay—card or Instapay?",
          answer:
            "You can activate instantly online via Paymob (Visa/Mastercard) or transfer via Instapay and upload your confirmation screenshot directly from your private management page.",
        },
        {
          question: "Can I edit details or wording after creating my invitation?",
          answer:
            "Yes. Your private management studio lets you update venue details, date, greeting text, guest list, and music anytime without needing a password or account.",
        },
        {
          question: "Can your studio design a completely custom theme for our wedding?",
          answer:
            "Yes. Choose our Tailored or Bespoke tier to share your moodboard, venue colors, or Pinterest references—our design team crafts an original animated invitation made exclusively for your day.",
        },
      ],
    },
    footer: {
      tagline:
        "Digital wedding invitations, thoughtfully choreographed from first tap to final RSVP.",
      links: [
        { label: "Templates", href: "/#templates" },
        { label: "Live Samples", href: "/samples" },
        { label: "Features", href: "/#features" },
        { label: "Pricing", href: "/#reviews" },
        { label: "FAQ", href: "/#faq" },
        { label: "Create Invite", href: "/create" },
        { label: "Bespoke Design", href: "/request?p=3" },
        { label: "Reviews", href: "/#reviews" },
      ],
      copyright: "© 2026 NAILA",
    },
  },
  ar: {
    brandSub: "دار نايلة للدعوات الرقمية",
    nav: {
      features: "المزايا",
      reviews: "حكايات العرسان",
      faq: "الأسئلة الشائعة",
      exploreTemplates: "المجموعة",
      startPrefix: "صمّم دعوتك —",
      trialSub: "جرّبها كاملة مجاناً قبل الدفع.",
    },
    hero: {
      starsLabel: "٤.٩ نجوم",
      chosenBy: "اختيار أكثر من ١٠٠ عريس وعروسة",
      eyebrow: "دار نايلة للدعوات الرقمية",
      headline: "دعوة تليق بليلة العمر.",
      lead: "الفرح الحقيقي بيبدأ من اللحظة اللي ضيفكم يفتح فيها الظرف. نايلة بتحوّل دعوتكم لتجربة سينمائية بختم شمع وموسيقى مختارة، توصل لكل معزوم باسمه وذوقه.",
      exploreTemplates: "تصفّح التصميمات",
      haveSampleLead: "حابب تعيش التجربة بنفسك؟",
      samplesLink: "جرّب الأمثلة الحيّة",
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
      phoneCaption: "المس الختم لفتح الدعوة",
    },
    switchSection: {
      srHeading:
        "تجهيزات الفرح تفاصيلها ما بتخلصش، بس دعوته وتنظيم ضيوفه بقوا في مكان واحد.",
      srSub:
        "من أول دعوة بتتبعت على واتساب، لحد آخر تهنئة بتوصلكم يوم الفرح.",
      label: "بلمسة واحدة",
      offHeadline: "تجهيزات الفرح تفاصيلها ما بتخلصش.",
      offSub: "كشف المعازيم، ترتيب الأسامي، تأكيد الحضور، والرد على كل سؤال.",
      onHeadlineStart: "يمكن الفرح ما بيجهزش بضغطة زرار… بس ",
      onHeadlineAccent: "دعوته وتنظيم ضيوفه بقوا في مكان واحد.",
      onSub: "من أول دعوة بتتبعت على واتساب، لحد آخر تهنئة بتوصلكم يوم الفرح.",
    },
    templates: {
      title: "تصميمات تفضل في الذاكرة.",
      subtitle:
        "كل تصميم حكاية لوحده — حركة فتح سينمائية، خطوط عربية وإنجليزية متقنة، وإحساس فخامة يبان من أول لمسة.",
      carousel: "عرض سينمائي",
      grid: "كل التصميمات",
      liveDemo: "معاينة حيّة",
      prevAria: "التصميم السابق",
      nextAria: "التصميم التالي",
    },
    samples: {
      title: "عيش تجربة ضيوفك قبل ما تبدأ.",
      subtitle:
        "افتح أي باقة على موبايلك، المس الختم، واسمع الموسيقى — نفس اللحظة اللي هيعيشها كل معزوم يوم ما توصله دعوتكم.",
      eyebrow: "نموذج حي",
      liveDemo: "معاينة حيّة",
    },
    manifesto: {
      srLabel:
        "الفرحة بتكمل بالتفاصيل الصغيرة. ونايلة بتجمعها في دعوة تشبهكم من أول لحظة.",
      segments: [
        { text: "الفرحة" },
        { text: "بتكمل", imageSlot: 1 },
        { text: "بالتفاصيل", italic: true },
        { text: "الصغيرة.", italic: true },
        { text: "ونايلة" },
        { text: "بتجمعها", imageSlot: 2 },
        { text: "في" },
        { text: "دعوة" },
        { text: "تشبهكم", imageSlot: 3 },
        { text: "من", italic: true },
        { text: "أول", italic: true },
        { text: "لحظة.", italic: true },
      ],
    },
    features: {
      eyebrow: "تفاصيل مصممة لراحتكم",
      title: "كل ما يخص ضيوفكم… مترابط بسلاسة.",
      subtitle:
        "من أول ما الضيف يضغط على الختم لحد ما يأكد حضوره ويكتبلكم كلمته، كل خطوة معمول حسابها بهدوء وأناقة.",
      cards: {
        global: {
          title: "أهلكم وأصحابكم في أي مكان في العالم",
          body: "سواء ضيوفكم في القاهرة أو مسافرين من بره مصر، الدعوة بتتقرأ بسلاسة تامة بالعربي أو الإنجليزي.",
        },
        guests: {
          title: "المعازيم وتأكيد الحضور في صفحة واحدة",
          body: "ارفع كشف الأسامي من إكسل في ثانية، ابعت لكل ضيف لينك باسمه على واتساب، واعرف مين فتح الدعوة ومين جاي فوراً.",
          rows: ["عائلة المهندس طارق منصور", "أستاذ كريم وزوجته", "د. منى الشاذلي"],
        },
        events: {
          title: "لحظة فتح ما تتنسيش",
          body: "ظرف بيتفتح بحركة ناعمة، موسيقى تعيشهم الأجواء، عدّاد تنازلي لليوم المنتظر، ولوكيشن القاعة على الخريطة.",
          steps: [
            { label: "أولاً", title: "لمسة على ختم الشمع" },
            { label: "ثانياً", title: "فتح سينمائي وموسيقى هادئة" },
            { label: "ثالثاً", title: "تأكيد الحضور وحفظ الموعد" },
          ],
        },
        notes: {
          title: "كلمة من القلب لكل معزوم",
          body: "كل ضيف بيشوف اسمه ولقبه على الدعوة، وتقدر تضيفله رسالة خاصة بيه لوحده تحسّسه بغلاوته عندكم.",
          eyebrow: "إهداء خاص",
          caption: "في انتظار تشريفكم",
        },
        domain: {
          title: "لينك واحد يليق على واتساب",
          body: "مفيش صور مكسّرة ولا ملفات PDF تقيلة — لينك أنيق يفتح فوراً على أي موبايل بأعلى جودة.",
          url: "naila.inv/ahmed-and-sara",
        },
        manage: {
          title: "تحكم كامل… من غير باسورد ولا تعقيد",
          body: "صفحة إدارة خاصة بيكم لوحدكم لتعديل التفاصيل، متابعة الحضور، وقراءة كل التهاني في أي وقت.",
          initials: ["أ", "س", "ن"],
        },
      },
    },
    pricing: {
      eyebrow: "باقات نايلة",
      badge: "دفعة واحدة بدون اشتراك",
      title: "فخامة كاملة… بتكلفة واضحة لمرة واحدة.",
      lead: "صمّم دعوتك وجرّبها بأساميكم الحقيقية مجاناً قبل ما تدفع جنيه واحد. ولما تقتنع بيها، دفعة واحدة بفيزا أو إنستاباي تفعّلها لحد بعد الفرح.",
      steps: [
        {
          num: "01",
          title: "اختار روح التصميم",
          body: "تصفّح مجموعتنا للفرح والخطوبة وكتب الكتاب، أو اطلب تصميم حصري ننفّذه ليكم من الصفر.",
        },
        {
          num: "02",
          title: "اكتب تفاصيل ليلتكم",
          body: "ضيف الأسامي، الموعد، القاعة، والموسيقى وشوف دعوتكم بتتشكّل قدامك لحظة بلحظة.",
        },
        {
          num: "03",
          title: "فعّل وشارك الفرحة",
          body: "ادفع مرة واحدة، ابعت اللينكات على واتساب، وتابع تأكيدات الحضور ودفتر التهاني لايف.",
        },
      ],
      customCta: "اطلب تصميمك الخاص",
      allIncludedLabel: "مشمول مجاناً في كل الباقات",
    },
    reviews: {
      eyebrow: "من كلام عرساننا",
      title: "دعوة بتخلي المعازيم يكلموكم قبل الفرح بأسبوع.",
      rating: "٤.٩",
      ratingLabel: "تقييم العرسان",
      row1: [
        {
          quote:
            "أول ما بعتنا الدعوة للعيلة، التليفونات ما سكتتش! كل الناس اتبسطت بفتحة الختم والموسيقى، وبقينا حاسين إن الفرح بدأ قبل ميعاده.",
          couple: "سارة وأحمد",
          location: "التجمع الخامس",
        },
        {
          quote:
            "عيلتي في القاهرة وأصحاب عمر بره مصر، وإن الدعوة تطلع بالعربي والإنجليزي بنفس الشياكة والذوق كان أريح وأرقى حل لقيناه.",
          couple: "ليلى وعمر",
          location: "الزمالك",
        },
        {
          quote:
            "تفصيلة إن كل معزوم يفتح اللينك يلاقي اسمه ولقبه جوه الدعوة فرقت مع الكبار قبل الصغيرين — فعلاً حسّستهم بغلاوتهم.",
          couple: "نور وكريم",
          location: "الشيخ زايد",
        },
        {
          quote:
            "رفعنا كشف فيه ٢٤٠ ضيف من شيت الإكسل في أقل من دقيقة، وبقينا عارفين بالظبط مين فتح ومين جاي من غير ما نتعب نفسنا في المكالمات.",
          couple: "مريم ويوسف",
          location: "مصر الجديدة",
        },
      ],
      row2: [
        {
          quote:
            "شكل الدعوة على الموبايل تحفة فنية بجد — لا صورة بتبكسل على واتساب ولا ملف بيتوه، كله راقي وبيفتح في ثانية.",
          couple: "سلمى وطارق",
          location: "الإسكندرية",
        },
        {
          quote:
            "دفتر التهاني اللي اتجمع من المعازيم كان أحلى مفاجأة بعد الفرح — قعدنا نقرأ دعواتهم وكلامهم تاني يوم الصبح واحنا مبسوطين.",
          couple: "فرح وزياد",
          location: "المعادي",
        },
        {
          quote:
            "أكتر حاجة طمّنتنا إننا شفنا دعوتنا كاملة بأسامينا وتفاصيل القاعة على الموبايل قبل ما نحول جنيه واحد على إنستاباي.",
          couple: "هنا وشريف",
          location: "الجونة",
        },
        {
          quote:
            "عملنا بيها كتب الكتاب والفرح، وكل أصحابنا طلبوا اللينك علشان يحجزوا لفرحهم. ذوق هادي وفخم بعيد عن أي زحمة.",
          couple: "دينا ومصطفى",
          location: "دبي والقاهرة",
        },
      ],
    },
    faq: {
      eyebrow: "كل التفاصيل",
      title: "كل اللي في بالك، جاوبناه.",
      subtitle:
        "كل التفاصيل العملية قبل ما تبدأ — المعاينة المجانية، الدفع، وتجربة ضيوفك.",
      items: [
        {
          question: "أقدر أشوف دعوتنا كاملة قبل ما أدفع؟",
          answer:
            "طبعاً. بتختار التصميم، تكتب الأسامي والتاريخ والقاعة والموسيقى، وتشوف دعوتك كاملة لايف على موبايلك قبل ما تدفع جنيه واحد. ولما تعجبك، بتفعّلها بدفعة واحدة.",
        },
        {
          question: "هل في أي اشتراك شهري أو مصاريف مخفية؟",
          answer:
            "أبداً. كل باقة بتدفعها مرة واحدة فقط من غير أي تجديد، وبتفضل الدعوة ولينكات الضيوف ودفتر التهاني شغالين معاكم لحد بعد الفرح.",
        },
        {
          question: "ضيفنا بيشوف الدعوة وبيأكد حضوره إزاي؟",
          answer:
            "بتبعتله اللينك على واتساب، يفتح يلمس ختم الشمع، يشوف فتحة الظرف بالموسيقى وتفاصيل الليلة واللوكيشن على جوجل ماب، ويأكد حضوره ويبعت تهنئته في ثانية من غير أي تسجيل.",
        },
        {
          question: "ينفع كل معزوم يوصله لينك باسمه ورسالة مخصوصة ليه؟",
          answer:
            "أكيد! في باقتي «على ذوقك» و«الخاصة»، كل ضيف بيوصله لينك شخصي بيلقّبه باسمه (مثلاً: أستاذ / دكتورة / عائلة…) ومعاه كلمة خاصة منكم لو حابين.",
        },
        {
          question: "لو عندي كشف معازيم كبير على إكسل، أقدر أرفعه مرة واحدة؟",
          answer:
            "أيوه بسهولة جداً. ارفع ملف إكسل أو CSV فيه الأسامي والأرقام، ونايلة بتظبط أرقام الموبايل المصرية تلقائياً وتجهزلك لينك واتساب جاهز لكل ضيف بضغطة واحدة.",
        },
        {
          question: "هل الدعوة تنفع عربي وإنجليزي؟",
          answer:
            "طبعاً، العربي والإنجليزي مشمولين مجاناً في كل الباقات، وبخطوط عربية وإنجليزية مختارة بعناية علشان الاتنين يطلعوا بنفس الفخامة.",
        },
        {
          question: "إيه طرق الدفع المتاحة عندكم؟",
          answer:
            "تقدر تفعّل فوراً أونلاين بفيزا أو ماستركارد عن طريق Paymob، أو تحوّل على إنستاباي وترفع صورة التحويل من صفحتك الخاصة.",
        },
        {
          question: "لو ميعاد القاعة اتغيّر أو حبيت أعدّل كلمة بعد ما أعمل الدعوة؟",
          answer:
            "ولا يهمك — صفحتك الخاصة بتفضل معاك على طول، تقدر تعدّل التاريخ أو العنوان أو نص الدعوة أو تزوّد معازيم في أي وقت من غير باسورد.",
        },
        {
          question: "ممكن تصمموا دعوة مخصوصة بألوان وثيم فرحنا من الصفر؟",
          answer:
            "أكيد! اختار باقة «على ذوقك» أو «الخاصة» وابعتلنا صور الإلهام أو ألوان الديكور، وفريق التصميم عندنا هينفّذلكم دعوة حصرية معمولة ليكم لوحدكم.",
        },
      ],
    },
    footer: {
      tagline:
        "دار مصرية للدعوات الرقمية — نصمّم أول لحظة في فرحتكم بذوق يليق بيها.",
      links: [
        { label: "التصميمات", href: "/#templates" },
        { label: "أمثلة حيّة", href: "/samples" },
        { label: "المزايا", href: "/#features" },
        { label: "الباقات", href: "/#reviews" },
        { label: "الأسئلة الشائعة", href: "/#faq" },
        { label: "صمّم دعوتك", href: "/create" },
        { label: "تصميم حصري", href: "/request?p=3" },
        { label: "حكايات العرسان", href: "/#reviews" },
      ],
      copyright: "© ٢٠٢٦ نايلة",
    },
  },
};
