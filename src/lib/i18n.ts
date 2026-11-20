import type { Lang } from "./types";

const strings = {
  ar: {
    tapToOpen: "اضغط لفتح الدعوة",
    and: "و",
    countdown: "باقي على الفرح",
    days: "يوم",
    hours: "ساعة",
    minutes: "دقيقة",
    seconds: "ثانية",
    eventStarted: "اليوم هو اليوم ✨",
    yourName: "اسمك",
    wishesTitle: "ابعت تهنئة",
    wishPlaceholder: "اكتب تهنئتك للعروسين…",
    send: "إرسال",
    wishThanks: "وصلت تهنئتك 🤍",
    location: "اللوكيشن",
    openMaps: "افتح على الخريطة",
    addToCalendar: "أضف للتقويم",
    mute: "كتم الصوت",
    unmute: "تشغيل الصوت",
    error: "حصلت مشكلة، جرب تاني",
    nameRequired: "اكتب اسمك الأول",
    previewRibbon: "معاينة · الدعوة هتتفعّل بعد الدفع",
    previewNoReplies: "الردود هتشتغل بعد تفعيل الدعوة",
    closedTitle: "الدعوة دي مش متاحة",
    closedBody: "اللينك ده اتقفل. لو محتاج تتأكد من حاجة، كلم أصحاب الدعوة.",
  },
  en: {
    tapToOpen: "Tap to open",
    and: "&",
    countdown: "Counting down",
    days: "Days",
    hours: "Hours",
    minutes: "Minutes",
    seconds: "Seconds",
    eventStarted: "Today is the day ✨",
    yourName: "Your name",
    wishesTitle: "Send your wishes",
    wishPlaceholder: "Write a message to the couple…",
    send: "Send",
    wishThanks: "Your wishes were sent 🤍",
    location: "Location",
    openMaps: "Open in Maps",
    addToCalendar: "Add to calendar",
    mute: "Mute",
    unmute: "Unmute",
    error: "Something went wrong, please try again",
    nameRequired: "Please enter your name",
    previewRibbon: "Preview · the invitation goes live after payment",
    previewNoReplies: "Replies open once the invitation is live",
    closedTitle: "This invitation is no longer available",
    closedBody: "This link has been closed. Please contact the hosts if you need anything.",
  },
} as const;

export type Strings = { [K in keyof (typeof strings)["ar"]]: string };

export function t(lang: Lang): Strings {
  return strings[lang];
}
