import type { CSSProperties } from "react";

/**
 * One line-icon family for the whole product (24×24, 1.75 stroke, round caps), drawn inline as SVG.
 * No emoji anywhere: use these instead.
 */
const PATHS = {
  home: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z",
  orders: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  chart: "M3 3v18h18M7 15l4-4 3 3 5-6",
  card: "M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 10h20M6 15h4",
  tag: "M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01",
  layout: "M4 4h16v16H4zM4 9h16M9 9v11",
  music: "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  settings: "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  external: "M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  check: "M20 6 9 17l-5-5",
  checkCircle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12l3 3 5-6",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  x: "M18 6 6 18M6 6l12 12",
  xCircle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15 9l-6 6M9 9l6 6",
  alert: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  copy: "M8 8h12v12H8zM16 8V4H4v12h4",
  download: "M12 3v12M7 10l5 5 5-5M5 21h14",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  image: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M9 9.5h.01",
  video: "M3 6h13v12H3zM16 10l5-3v10l-5-3",
  heart: "M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 12 5a5.5 5.5 0 0 0-10 3.5c0 2.3 1.5 4 3 5.5l7 7z",
  mail: "M3 5h18v14H3zM3 6l9 7 9-7",
  volume: "M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14",
  volumeOff: "M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  menu: "M4 6h16M4 12h16M4 18h16",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
  calendar: "M4 5h16v16H4zM4 10h16M8 3v4M16 3v4",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  trash: "M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14",
  filter: "M3 5h18l-7 8v6l-4 2v-8z",
  plus: "M12 5v14M5 12h14",
  arrowUp: "M12 19V5M6 11l6-6 6 6",
  arrowDown: "M12 5v14M6 13l6 6 6-6",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  arrowLeft: "M19 12H5M11 6l-6 6 6 6",
  link: "M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7",
  whatsapp:
    "M3 21l1.6-4.6A9 9 0 1 1 7.8 19.6zM9 8.5c0 3.6 2.9 6.5 6.5 6.5l1.2-1.4-2.1-1.1-1 .9c-1.1-.5-2-1.4-2.5-2.5l.9-1-1.1-2.1z",
  facebook: "M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5v4h3v7h4v-7h3l1-4h-4V7.5a1 1 0 0 1 1-1h2z",
  instagram: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17.5 6.5h.01",
  tiktok: "M15 3c.5 2.5 2.2 4 5 4v3.5c-2 0-3.6-.6-5-1.6V15a6 6 0 1 1-6-6v3.5a2.5 2.5 0 1 0 2.5 2.5V3z",
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({
  name,
  size = 18,
  strokeWidth = 1.75,
  className,
  style,
  label,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
  /** Accessible name; omit for decorative icons next to visible text. */
  label?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flex: "none", ...style }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
