import Icon from "./Icon";

/** The word "واتساب", always bold in WhatsApp green with its icon, so it stands out wherever we mention it. */
export default function WhatsApp({ text = "واتساب" }: { text?: string }) {
  return (
    <strong style={{ color: "#128c4a", display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
      <Icon name="whatsapp" size={17} strokeWidth={1.9} />
      {text}
    </strong>
  );
}
