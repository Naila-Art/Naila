"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import styles from "./landing.module.css";

interface TrialCtaProps {
  href: string;
  label: string;
  subLabel: string;
  /** "light" = cream pill with dark metallic tab underneath; "dark" = espresso pill with ivory paper tab underneath */
  variant: "light" | "dark";
  showArrow?: boolean;
  fullWidthMobile?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function TrialCta({
  href,
  label,
  subLabel,
  variant,
  showArrow = false,
  fullWidthMobile = false,
  size = "md",
}: TrialCtaProps) {
  const pillClass =
    variant === "light" ? styles.trialCtaLight : styles.trialCtaDark;
  const tabClass =
    variant === "light" ? styles.trialTabOnLight : styles.trialTabOnDark;
  const sizeClass =
    size === "lg"
      ? styles.trialCtaLg
      : size === "sm"
      ? styles.trialCtaSm
      : "";

  // "Design yours — 300 EGP": give the price its own emphasis.
  const dashAt = label.lastIndexOf("—");
  const lead = dashAt >= 0 ? label.slice(0, dashAt + 1) : label;
  const price = dashAt >= 0 ? label.slice(dashAt + 1).trim() : "";

  return (
    <Link
      href={href}
      className={`${styles.trialCta} ${pillClass} ${sizeClass} ${
        fullWidthMobile ? styles.trialCtaFullMobile : ""
      }`}
    >
      <span className={styles.trialCtaLabel}>
        <span>{lead}</span>
        {price && <span className={styles.trialCtaPrice}>{price}</span>}
        {showArrow && (
          <ArrowUpRight className={styles.trialCtaArrow} aria-hidden="true" />
        )}
      </span>
      <span aria-hidden="true" className={`${styles.trialTab} ${tabClass}`}>
        <span className={styles.trialTabLabel}>{subLabel}</span>
      </span>
    </Link>
  );
}
