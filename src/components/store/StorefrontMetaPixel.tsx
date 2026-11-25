"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { hasTrackableReferrer } from "@/lib/storefront-analytics";

type MetaPixel = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  disablePushState?: boolean;
  loaded: boolean;
  push: MetaPixel;
  queue: IArguments[];
  version: string;
};

let lastPageView: string | undefined;

function loadMetaPixel() {
  const pixelWindow = window as Window & { fbq?: MetaPixel; _fbq?: MetaPixel };
  if (pixelWindow.fbq) return pixelWindow.fbq;

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      // Meta's bootstrap queues its original Arguments object.
      // eslint-disable-next-line prefer-rest-params
      fbq.queue.push(arguments);
    }
  } as MetaPixel;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  // Route changes are tracked below so history updates cannot fire duplicate PageViews.
  fbq.disablePushState = true;
  pixelWindow.fbq = fbq;
  pixelWindow._fbq ??= fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.prepend(script);
  return fbq;
}

export default function StorefrontMetaPixel({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname === lastPageView) return;
    if (!hasTrackableReferrer(document.referrer, window.location.host)) return;

    const fbq = loadMetaPixel();
    if (!lastPageView) {
      fbq("set", "autoConfig", false, pixelId);
      fbq("init", pixelId);
    }

    lastPageView = pathname;
    fbq("trackSingle", pixelId, "PageView");
  }, [pathname, pixelId]);

  return null;
}
