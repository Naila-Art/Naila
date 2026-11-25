"use client";

import Clarity from "@microsoft/clarity";
import { useEffect } from "react";
import { hasTrackableReferrer } from "@/lib/storefront-analytics";

export default function StorefrontClarity({ projectId }: { projectId: string }) {
  useEffect(() => {
    if (!hasTrackableReferrer(document.referrer, window.location.host)) return;

    Clarity.init(projectId);
    Clarity.consentV2({ analytics_Storage: "denied", ad_Storage: "denied" });
  }, [projectId]);

  return null;
}
