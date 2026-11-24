/** Egypt uses daylight saving time again (since 2023), so the offset is +02:00 or +03:00 depending on the date. */
export const TIME_ZONE = "Africa/Cairo";

function cairoParts(at: Date): Record<string, string> {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
}

/** Offset of Cairo from UTC at a given instant, in minutes. */
function cairoOffsetMinutes(at: Date): number {
  const p = cairoParts(at);
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** "2027-02-14T19:00" (Cairo wall-clock time, from DateTimePicker) → ISO with the right offset. */
export function cairoLocalToIso(local: string): string | null {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return null;
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  if (Number.isNaN(wall)) return null;
  let offset = cairoOffsetMinutes(new Date(wall));
  offset = cairoOffsetMinutes(new Date(wall - offset * 60000)); // second pass settles DST edges
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00${sign}${hh}:${mm}`;
}

/** ISO → "2027-02-14T19:00" in Cairo time, for filling DateTimePicker. */
export function isoToCairoLocal(iso: string): string {
  const p = cairoParts(new Date(iso));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** An event's date for people, in Arabic and Cairo time: "١٤ فبراير ٢٠٢٧ · ٨:٠٠ م". */
export function formatEventDateAr(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  const day = new Intl.DateTimeFormat("ar-EG", { timeZone: TIME_ZONE, day: "numeric", month: "long", year: "numeric" }).format(at);
  const time = new Intl.DateTimeFormat("ar-EG", { timeZone: TIME_ZONE, hour: "numeric", minute: "2-digit" }).format(at);
  return `${day} · ${time}`;
}
