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
  /**
   * Layout family. "envelope" (default) is the classic card; "doors" is the Doors & Arches
   * family: the opening video plays full-screen and the invitation rises over its last frame.
   */
  family?: TemplateFamily;
  /** Last frame of the video: the scene the invitation sits on after the opening. */
  endPosterUrl?: string;
  /** A small blurred copy of the last frame, used as the desktop backdrop. */
  ambientUrl?: string;
  /** When (ms into the video) the scene is open enough for the names to appear. */
  revealAtMs?: number;
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
  /** Top of the mirrored names in water; null when the scene has no still water. Default 58.5. */
  reflectionTop?: number | null;
  /** Colour of all text drawn on the scene (threshold, names, farewell). Default ivory #f7eedd;
   *  use a deep tone from the palette for bright daytime scenes. */
  ink?: string;
}

export type TemplateFamily = "envelope" | "doors";

/** One line of the night's programme, e.g. { time: "19:00", label: "Katb kitab" }. */
export interface ScheduleItem {
  time: string;
  label: string;
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
  /** A track from our music library (package 2+). */
  musicTrackId?: string;
  /** The night's programme, in order. Optional. */
  schedule?: ScheduleItem[];
  /** e.g. "Black tie" / "سواريه". Optional. */
  dressCode?: string;
  /** Short practical notes for guests (parking, children, gifts…). Optional. */
  notes?: string;
  createdAt?: string;
  /**
   * Set on the storefront's sample invitations (one per package). They show that package's
   * features, the newest uploaded design and a date that's always ahead.
   */
  samplePackage?: PackageId;
}

export type PackageId = 1 | 2 | 3 | 4;

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
  /** EGP, fixed when the order is made or changed; later price edits don't touch it. */
  total: number;
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

/** What an event may use, from its package. */
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
  /** Optional personal note shown on this guest's invitation only (packages 3-4). */
  message?: string;
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
  message?: string;
}

export interface GuestView {
  eventId: string;
  guestId?: string;
  openedAt: string;
  userAgent?: string;
}
