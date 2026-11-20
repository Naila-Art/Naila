import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import type { EventData, Order } from "./types";

/**
 * Paymob (Visa / Mastercard / Apple Pay / wallets) through the Intention API + Unified Checkout.
 * Ziad sets up the account; the values go in .env.local and Vercel:
 *   PAYMOB_SECRET_KEY, PAYMOB_PUBLIC_KEY      Dashboard → Settings → Account info
 *   PAYMOB_INTEGRATION_IDS                    comma-separated, e.g. "4567890,4567891" (card, wallet…)
 *   PAYMOB_HMAC_SECRET                        Dashboard → Settings → Account info → HMAC
 *   PAYMOB_BASE_URL                           optional, default https://accept.paymob.com
 * In the Paymob dashboard, set the transaction processed callback to {site}/api/payments/paymob/webhook.
 * Until these are set, the client page offers Instapay only.
 */

interface PaymobConfig {
  secretKey: string;
  publicKey: string;
  integrationIds: number[];
  hmacSecret: string;
  baseUrl: string;
}

function config(): PaymobConfig | null {
  const secretKey = process.env.PAYMOB_SECRET_KEY?.trim();
  const publicKey = process.env.PAYMOB_PUBLIC_KEY?.trim();
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET?.trim();
  const integrationIds = (process.env.PAYMOB_INTEGRATION_IDS ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  if (!secretKey || !publicKey || !hmacSecret || integrationIds.length === 0) return null;
  const baseUrl = (process.env.PAYMOB_BASE_URL?.trim() || "https://accept.paymob.com").replace(/\/+$/, "");
  return { secretKey, publicKey, integrationIds, hmacSecret, baseUrl };
}

export const paymobEnabled = () => config() !== null;

/** special_reference must be unique per attempt, so the order id gets a timestamp suffix. */
const reference = (orderId: string) => `${orderId}.${Date.now()}`;
export const orderIdFromReference = (ref: string) => ref.split(".")[0];

/** Creates a payment intention and returns the Unified Checkout URL to send the client to. */
export async function createCheckout(order: Order, event: EventData, siteUrl: string): Promise<string> {
  const c = config();
  if (!c) throw new Error("Paymob is not configured");
  const amountCents = order.total * 100;
  const [firstName, ...rest] = order.clientName.split(" ");

  const res = await fetch(`${c.baseUrl}/v1/intention/`, {
    method: "POST",
    headers: { Authorization: `Token ${c.secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: amountCents,
      currency: "EGP",
      payment_methods: c.integrationIds,
      items: [{ name: `Invitation package ${order.packageId}`, amount: amountCents, description: `${event.partnerA} & ${event.partnerB}`, quantity: 1 }],
      // Paymob requires billing fields; we only collect name and phone.
      billing_data: {
        first_name: firstName || "Client",
        last_name: rest.join(" ") || "-",
        phone_number: order.clientPhone,
        email: "NA",
        country: "EG",
        city: "NA",
        street: "NA",
        building: "NA",
        floor: "NA",
        apartment: "NA",
      },
      special_reference: reference(order.id),
      notification_url: `${siteUrl}/api/payments/paymob/webhook`,
      redirection_url: `${siteUrl}/c/${event.manageToken}?paid=1`,
    }),
  });
  if (!res.ok) throw new Error(`Paymob intention failed: ${res.status} ${await res.text().catch(() => "")}`);
  const data = (await res.json()) as { client_secret?: string };
  if (!data.client_secret) throw new Error("Paymob intention: no client_secret");
  return `${c.baseUrl}/unifiedcheckout/?publicKey=${encodeURIComponent(c.publicKey)}&clientSecret=${encodeURIComponent(data.client_secret)}`;
}

/** Fields Paymob signs in the "transaction processed" callback, in this exact order. */
const HMAC_FIELDS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order.id",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
];

function pick(obj: Record<string, unknown>, path: string): string {
  let v: unknown = obj;
  for (const part of path.split(".")) v = v && typeof v === "object" ? (v as Record<string, unknown>)[part] : undefined;
  return v === undefined || v === null ? "" : String(v);
}

export interface PaymobTransaction {
  id: string;
  success: boolean;
  pending: boolean;
  amountCents: number;
  reference: string;
}

/** Verifies the callback's HMAC and extracts what we need. Returns null if it isn't genuine. */
export function verifyCallback(body: unknown, hmac: string | null): PaymobTransaction | null {
  const c = config();
  if (!c || !hmac || !body || typeof body !== "object") return null;
  const obj = (body as { obj?: Record<string, unknown> }).obj;
  if (!obj) return null;

  const expected = createHmac("sha512", c.hmacSecret).update(HMAC_FIELDS.map((f) => pick(obj, f)).join("")).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(hmac.toLowerCase());
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const order = (obj.order ?? {}) as Record<string, unknown>;
  return {
    id: pick(obj, "id"),
    success: obj.success === true && obj.is_voided !== true && obj.is_refunded !== true,
    pending: obj.pending === true,
    amountCents: Number(obj.amount_cents),
    reference: String(order.merchant_order_id ?? obj.special_reference ?? ""),
  };
}
