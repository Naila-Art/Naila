import type { Category, EventData, GuestInput, PackageId } from "./types";

/**
 * The storefront's sample invitations: one per package, at fixed links, so we can show
 * anyone what each package looks like. Created on first visit (see getEventBySlug).
 * At render time they take the newest uploaded design and a date that's always ahead.
 */
export interface Sample {
  packageId: PackageId;
  slug: string;
  category: Category;
  event: Pick<EventData, "partnerA" | "partnerB" | "venueName" | "venueAddress" | "mapsUrl" | "generalText" | "personalText">;
  /** Packages 3-4 show a named invitation with a personal message. */
  guest?: GuestInput & { token: string };
}

export const SAMPLES: Sample[] = [
  {
    packageId: 1,
    slug: "sample-1",
    category: "wedding",
    event: {
      partnerA: "أحمد",
      partnerB: "سارة",
      venueName: "قاعة الماسة",
      venueAddress: "القاهرة الجديدة",
      mapsUrl: "https://maps.google.com/?q=30.0074,31.4913",
      generalText: "يشرفنا حضوركم حفل زفافنا",
      personalText: "تشرفنا بحضورك يا {title} {name}",
    },
  },
  {
    packageId: 2,
    slug: "sample-2",
    category: "engagement",
    event: {
      partnerA: "عمر",
      partnerB: "ليلى",
      venueName: "فندق النيل",
      venueAddress: "الزمالك",
      mapsUrl: "https://maps.google.com/?q=30.0626,31.2197",
      generalText: "يسعدنا مشاركتكم فرحة خطوبتنا",
      personalText: "تشرفنا بحضورك يا {title} {name}",
    },
  },
  {
    packageId: 3,
    slug: "sample-3",
    category: "katb_kitab",
    event: {
      partnerA: "يوسف",
      partnerB: "مريم",
      venueName: "مسجد الشرطة",
      venueAddress: "الشيخ زايد",
      mapsUrl: "https://maps.google.com/?q=30.0444,30.9760",
      generalText: "يشرفنا حضوركم عقد قراننا",
      personalText: "تشرفنا بحضورك أنت والأسرة الكريمة يا {title} {name}",
    },
    guest: {
      token: "s3mahmoud",
      title: "أستاذ",
      name: "محمود",
      message: "إنت من أول الناس اللي كان لازم يعرفوا. وجودك معانا هيفرق كتير 🤍",
    },
  },
  {
    packageId: 4,
    slug: "sample-4",
    category: "wedding",
    event: {
      partnerA: "كريم",
      partnerB: "نور",
      venueName: "قصر البارون",
      venueAddress: "مصر الجديدة",
      mapsUrl: "https://maps.google.com/?q=30.0866,31.3302",
      generalText: "يشرفنا حضوركم حفل زفافنا",
      personalText: "تشرفنا بحضورك يا {title} {name}",
    },
    guest: {
      token: "s4mona",
      title: "دكتورة",
      name: "منى",
      message: "يا أحلى خالة، الفرح مايكملش من غيرك. مستنيينك من بدري!",
    },
  },
];

/** The link to show for a package's sample (the named one for packages 3-4). */
export function sampleLink(packageId: PackageId): string {
  const s = SAMPLES.find((x) => x.packageId === packageId)!;
  return s.guest ? `/i/${s.slug}/${s.guest.token}` : `/i/${s.slug}`;
}

export const isSampleSlug = (slug: string) => SAMPLES.some((s) => s.slug === slug);
