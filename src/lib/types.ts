export type Category = "wedding" | "engagement" | "katb_kitab";
export type Lang = "ar" | "en";
export type RsvpStatus = "attending" | "maybe" | "declined";

/**
 * A visual template. Each one wraps a Google Flow video (made by Ziad).
 * The video must contain NO text — names and wording are drawn on top as HTML.
 */
export interface Template {
  id: string;
  name: string;
  category: Category;
  /** Opening animation (MP4 H.264, ~720x1280, 1–2 MB). If missing, a CSS envelope is used. */
  videoUrl?: string;
  /** First frame of the video, shown while sealed. */
  posterUrl?: string;
  theme: {
    background: string;
    surface: string;
    text: string;
    accent: string;
    /** Wax-seal colour for the CSS fallback envelope. */
    seal: string;
  };
  /** Optional label on the shop card ("مميز", "الأكثر طلباً", "جديد"); badged templates are listed first. */
  badge?: TemplateBadge;
  /** Optional artwork drawn in the video's style, placed on the page after the opening. */
  art?: TemplateArt;
  /** Set for templates uploaded from the admin dashboard (not the built-in fallback). */
  createdAt?: string;
  /**
   * Layout family. "envelope" (default) is the classic card; "doors" is the Doors & Arches
   * family: the opening video plays full-screen and the invitation rises over its last frame.
   * "paper" is the Stationery family: same stage, but the opening ends on a blank card or frame,
   * the names are printed into it, and the letter is a deckled sheet with engraved details.
   */
  family?: TemplateFamily;
  /** Last frame of the video: the scene the invitation sits on after the opening. */
  endPosterUrl?: string;
  /** A small blurred copy of the last frame, used as the desktop backdrop. */
  ambientUrl?: string;
  /** When (ms into the video) the scene is open enough for the names to appear. */
  revealAtMs?: number;
  /** Sub-category within `category`, for storefront filters (see STYLE_LABELS). */
  style?: TemplateStyle;
  /** Doors family: where the names sit on this design's last frame. */
  scene?: SceneLayout;
}

/**
 * Placement of the names over the last frame of a "doors" opening, in % of the screen
 * (the frame is 9:16 and covers the screen). Find the values by eye on end.jpg: the names
 * belong in the calmest open area (sky, wall, sea), the reflection on still water.
 */
export interface SceneLayout {
  /** Top of the names block. Default 19. */
  skyTop?: number;
  /** Width of the names block. Default 58. */
  skyWidth?: number;
  /** Horizontal centre of the names block, for off-centre cards. Default 50. */
  skyCenter?: number;
  /** Multiplies the names' size, for small cards. Default 1. */
  scale?: number;
  /** Paper family: lay a soft paper plate behind the names when the frame has no blank area. */
  plate?: boolean;
  /** Top of the mirrored names in water; null when the scene has no still water. Default 58.5. */
  reflectionTop?: number | null;
  /** The first frame is bright (pale watercolor, daylight): threshold text turns to the
   *  letter's ink with a pale halo, and the veil turns pale. */
  lightStart?: boolean;
  /** The last frame is bright: names, date, scroll cue and farewell turn to ink. */
  light?: boolean;
  /** The first frame has its own seal, knot or emblem at this height (% from top, centred).
   *  The guest taps that instead: a pulsing ring marks it and no medallion is drawn over it. */
  ownSeal?: number;
  /** Diameter of that seal in % of the screen width (the ring is drawn just outside it). Default 24. */
  ownSealSize?: number;
  /** What the guest is opening, for the threshold label. Default "doors". */
  opens?: "doors" | "curtains" | "other";
  /** Override for the colour of text on the last frame. Default ivory, or theme.text when light. */
  ink?: string;
}

export type TemplateFamily = "envelope" | "doors" | "paper";

/** Storefront sub-category inside a category (Katb Kitab / Wedding / Engagement). */
export type TemplateStyle = "arches" | "night" | "palace" | "garden" | "coastal" | "stationery" | "storybook";

/** Display order and bilingual labels for the style sub-categories. */
export const STYLE_LABELS: Record<TemplateStyle, { en: string; ar: string }> = {
  arches: { en: "Arches & Arabesque", ar: "أقواس وزخارف" },
  night: { en: "Night & Lanterns", ar: "ليل وفوانيس" },
  palace: { en: "Palaces & Ballrooms", ar: "قصور وقاعات" },
  garden: { en: "Gardens & Blooms", ar: "حدائق وزهور" },
  coastal: { en: "Coast & Sea", ar: "بحر وشواطئ" },
  storybook: { en: "Storybook & Travel", ar: "حكايات وسفر" },
  stationery: { en: "Paper & Seals", ar: "ورق وأختام" },
};

/** Category order on the storefront. */
export const CATEGORY_ORDER: Category[] = ["katb_kitab", "wedding", "engagement"];

/** One line of the night's programme, e.g. { time: "19:00", label: "Katb kitab" }. */
export interface ScheduleItem {
  time: string;
  label: string;
}

export type TemplateBadge = "featured" | "popular" | "new";
/** In the order they're listed on the site. */
export const BADGE_LABELS: Record<TemplateBadge, string> = {
  featured: "مميز",
  popular: "الأكثر طلباً",
  new: "جديد",
};

/** Where each optional artwork image goes on the invitation page. */
export type ArtSlot = "top" | "corner" | "bottom";
export const ART_SLOTS: ArtSlot[] = ["top", "corner", "bottom"];
export type TemplateArt = Partial<Record<ArtSlot, string>>;

export const CATEGORY_LABELS: Record<Category, string> = {
  wedding: "فرح",
  engagement: "خطوبة",
  katb_kitab: "كتب كتاب",
};

export interface EventData {
  id: string;
  slug: string;
  /** Private, password-free link for the client's page: /c/{manageToken}. */
  manageToken: string;
  templateId: string;
  lang: Lang;
  /** Couple names as they should appear, e.g. "أحمد" and "سارة". */
  partnerA: string;
  partnerB: string;
  /** ISO date-time with offset, e.g. 2027-02-14T19:00:00+02:00 */
  date: string;
  venueName: string;
  venueAddress?: string;
  mapsUrl?: string;
  musicUrl?: string;
  /** Shown when the link has no guest token. */
  generalText: string;
  /** Shown on named links. Supports {title} and {name} (or {اللقب} and {الاسم}). */
  personalText: string;
  /** Set for events created from the storefront. Demo events have none and get every feature. */
  orderId?: string;
  /**
   * "draft" = preview only (ribbon on the invitation, replies off) until the order is paid.
   * "cancelled" = order cancelled / refunded by us: every link to this event is closed.
   */
  status?: "draft" | "active" | "cancelled";
  category?: Category;
  /** A track from our music library (package 2+). */
  musicTrackId?: string;
  /** The night's programme, in order. Optional. */
  schedule?: ScheduleItem[];
  /** e.g. "Black tie" / "سواريه". Optional. */
  dressCode?: string;
  /** Short practical notes for guests (parking, children, gifts…). Optional. */
  notes?: string;
  /** The client wants guests to confirm attendance (package 2+). */
  rsvp?: boolean;
  createdAt?: string;
  /**
   * Set on the storefront's sample invitations (one per package). They show that package's
   * features, the newest uploaded design and a date that's always ahead.
   */
  samplePackage?: PackageId;
}

export type PackageId = 1 | 2 | 3 | 4;

export type PaymentState = "unpaid" | "pending_review" | "paid";
/** "paymob", "manual" (marked paid by us), or the id of a payment method from the dashboard. */
export type PaymentMethod = string;

/** A way to pay, managed from the dashboard (Instapay, wallets, bank transfer, card). */
export interface PaymentMethodConfig {
  id: string;
  /** Shown to the client, e.g. "إنستاباي", "فودافون كاش". */
  name: string;
  /** "transfer" = the client transfers and uploads a screenshot; "card" = Paymob checkout. */
  kind: "transfer" | "card";
  /** Where to transfer: an Instapay address, a wallet number, an IBAN… (transfer only). */
  account: string;
  /** Optional short instructions shown under the account. */
  instructions?: string;
  active: boolean;
}
/** Packages 3–4 are made by our team, so those orders move through stages. */
export type CustomStage = "new" | "contacted" | "in_design" | "delivered";

export interface Order {
  id: string;
  /** "self" = built by the client in the storefront (packages 1–2); "custom" = a request for packages 3–4. */
  kind: "self" | "custom";
  eventId?: string;
  clientName: string;
  /** WhatsApp number, +20… */
  clientPhone: string;
  packageId: PackageId;
  /** EGP, fixed when the order is made or changed; later price edits don't touch it. */
  total: number;
  payment: PaymentState;
  paymentMethod?: PaymentMethod;
  /** Display name of the method the client used (kept even if the method is later renamed or removed). */
  paymentMethodName?: string;
  /** Our note on a manual confirmation (transaction number, sender's name…). */
  paymentNote?: string;
  /** Instapay transfer screenshot. */
  proofUrl?: string;
  rejectReason?: string;
  paidAt?: string;
  paymobTransactionId?: string;
  stage?: CustomStage;
  /** Set when we cancel the order; its event's links stop working. */
  cancelledAt?: string;
  cancelReason?: string;
  /** Money returned to the client (a refund), as opposed to a cancellation before payment. */
  refunded?: boolean;
  /** Package 3+: what the client wants, and a link to their files (e.g. Google Drive). */
  brief?: { category: Category; date?: string; notes: string; link?: string };
  /** Package 3+: the client's photos, videos and references for our team. */
  references?: { url: string; name: string; type: "image" | "video" | "audio"; addedAt: string }[];
  createdAt: string;
}

/** A team member who can sign in to the dashboard. */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  /** scrypt$salt$hash */
  passwordHash: string;
  createdAt: string;
}

export interface ChangeRequest {
  id: string;
  eventId: string;
  body: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface MusicTrack {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

/** What an event may use, from its package. */
export interface Features {
  wishes: boolean;
  music: boolean;
  maps: boolean;
  /** Guests can confirm attendance, if the client turned it on. */
  rsvp: boolean;
  /** Max named guests; 0 = general link only. */
  namesLimit: number;
}

export interface Guest {
  id: string;
  eventId: string;
  /** Unguessable token used in /i/{slug}/{token}. */
  token: string;
  title?: string;
  name: string;
  phone?: string;
  /** Optional personal note shown on this guest's invitation only (packages 3-4). */
  message?: string;
}

export interface Rsvp {
  eventId: string;
  guestId?: string;
  /** For general links the guest types their own name. */
  name: string;
  status: RsvpStatus;
  /** How many people are coming, the guest included (attending / maybe only). */
  count?: number;
  /** Optional note to the hosts. */
  note?: string;
  createdAt: string;
}

export interface Wish {
  id: string;
  eventId: string;
  guestId?: string;
  name: string;
  body: string;
  createdAt: string;
}

/** A guest row as the client sees it on their page. */
export interface GuestWithStatus extends Guest {
  openedAt?: string;
  rsvp?: RsvpStatus;
  rsvpCount?: number;
}

export interface GuestInput {
  title?: string;
  name: string;
  phone?: string;
  message?: string;
}

export interface GuestView {
  eventId: string;
  guestId?: string;
  openedAt: string;
  userAgent?: string;
}
