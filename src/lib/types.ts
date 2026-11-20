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
