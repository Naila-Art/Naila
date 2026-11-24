"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Languages } from "lucide-react";
import { STORE_COPY } from "./storeCopy";
import { useSiteLang } from "@/lib/site-lang";
import { templateDisplayName } from "@/lib/templates";
import type { Template } from "@/lib/types";
import { localeHref } from "@/lib/locale";

export default function TemplatePreviewDock({
  template,
}: {
  template: Template;
}) {
  const { lang, toggleLang } = useSiteLang();
  const isAr = lang === "ar";
  const copy = STORE_COPY[lang];
  const title = templateDisplayName(template, lang);

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: 6,
        borderRadius: 9999,
        border: "1px solid rgba(252, 247, 237, 0.2)",
        background: "rgba(41, 35, 31, 0.88)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.36)",
      }}
    >
      <Link
        href={localeHref(lang, "/#templates")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          minHeight: 40,
          padding: "0 14px",
          borderRadius: 9999,
          color: "rgba(252, 247, 237, 0.88)",
          fontSize: 13,
          fontWeight: 500,
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        {isAr ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
        {copy.previewDock.templates}
      </Link>

      <button
        type="button"
        onClick={toggleLang}
        aria-label={copy.switchLangAria}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          minHeight: 36,
          padding: "0 11px",
          borderRadius: 9999,
          border: "1px solid rgba(252, 247, 237, 0.2)",
          background: "rgba(252, 247, 237, 0.08)",
          color: "#fcf7ed",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <Languages size={14} strokeWidth={1.7} aria-hidden="true" />
        <span>{copy.switchLangTitle}</span>
      </button>

      <Link
        href={localeHref(lang, `/create?t=${template.id}`)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          minHeight: 40,
          padding: "0 18px",
          borderRadius: 9999,
          background: "#fcf7ed",
          color: "#2f241b",
          fontSize: 13,
          fontWeight: 600,
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        {copy.previewDock.usePrefix} {title}
        <ArrowUpRight size={15} />
      </Link>
    </div>
  );
}
