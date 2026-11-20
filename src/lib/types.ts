export type Category = "wedding" | "engagement" | "katb_kitab";
export type Lang = "ar" | "en";
export type RsvpStatus = "attending" | "declined";

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
  /** Set for templates uploaded from the admin dashboard (not the built-in fallback). */
  createdAt?: string;
}

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
  /** A track from our music library (package 2+). A client's own song goes in musicUrl. */
  musicTrackId?: string;
  createdAt?: string;
}

export type PackageId = 1 | 2 | 3 | 4;
export type NamesTier = "100" | "300" | "unlimited";

export interface Addons {
  arabic: boolean;
  maps: boolean;
  /** The client uploads their own song. */
  customMusic: boolean;
  /** Personalised link per guest, priced by guest count. null = general link only. */
  names: NamesTier | null;
}

export type PaymentState = "unpaid" | "pending_review" | "paid";
export type PaymentMethod = "paymob" | "instapay" | "manual";
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
  addons: Addons;
  /** EGP, fixed when the order is made or changed; later price edits don't touch it. */
  total: number;
  /** Named-guest cap sold with this order (snapshot of the tier at the time). */
  namesLimit?: number;
  payment: PaymentState;
  paymentMethod?: PaymentMethod;
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
  brief?: { category: Category; date?: string; notes: string };
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

/** What an event may use, from its package and add-ons. */
export interface Features {
  wishes: boolean;
  music: boolean;
  maps: boolean;
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
}

export interface Rsvp {
  eventId: string;
  guestId?: string;
  /** For general links the guest types their own name. */
  name: string;
  status: RsvpStatus;
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
}

export interface GuestInput {
  title?: string;
  name: string;
  phone?: string;
}

export interface GuestView {
  eventId: string;
  guestId?: string;
  openedAt: string;
  userAgent?: string;
}
