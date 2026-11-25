"use client";

import { useEffect } from "react";
import { hasTrackableReferrer } from "@/lib/storefront-analytics";

const GOOGLE_TAG_ID = "GTM-W796ZRVK";
const GOOGLE_TAG_SCRIPT_ID = "naila-google-tag";

export default function StorefrontGoogleTag() {
  useEffect(() => {
    if (!hasTrackableReferrer(document.referrer, window.location.host)) return;
    if (document.getElementById(GOOGLE_TAG_SCRIPT_ID)) return;

    const tagWindow = window as Window & {
      dataLayer?: unknown[];
      gtag?: (...args: unknown[]) => void;
    };
    const dataLayer = (tagWindow.dataLayer ??= []);
    const gtag = (tagWindow.gtag ??= function () {
      // Google Tag Manager's bootstrap queues an Arguments object.
      // eslint-disable-next-line prefer-rest-params
      dataLayer.push(arguments);
    });

    gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
    gtag("js", new Date());

    const script = document.createElement("script");
    script.id = GOOGLE_TAG_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GOOGLE_TAG_ID}`;
    document.head.prepend(script);
  }, []);

  return null;
}
