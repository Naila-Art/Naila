import "server-only";
import { NextResponse } from "next/server";
import { getEventBySlug, getGuestByToken } from "./store";
import type { EventData, Guest } from "./types";

export const MAX_NAME = 80;
export const MAX_WISH = 500;

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Resolves the event and (optional) guest. A token that doesn't belong to the event is rejected. */
export async function resolve(
  slug: string,
  token: unknown,
): Promise<{ event: EventData; guest: Guest | null } | NextResponse> {
  const event = await getEventBySlug(slug);
  if (!event) return bad("not_found", 404);
  if (token === undefined || token === null || token === "") return { event, guest: null };
  if (typeof token !== "string") return bad("invalid_token");
  const guest = await getGuestByToken(event.id, token);
  if (!guest) return bad("invalid_token", 404);
  return { event, guest };
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const v = value.replace(/\s+/g, " ").trim();
  return v.length === 0 || v.length > max ? null : v;
}
