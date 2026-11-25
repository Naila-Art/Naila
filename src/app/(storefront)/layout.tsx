import { headers } from "next/headers";
import SiteDocument, { siteMetadata, siteViewport } from "../site-document";
import StorefrontClarity from "@/components/store/StorefrontClarity";
import StorefrontGoogleTag from "@/components/store/StorefrontGoogleTag";
import StorefrontMetaPixel from "@/components/store/StorefrontMetaPixel";
import { hasTrackableReferrer } from "@/lib/storefront-analytics";

export const metadata = siteMetadata;
export const viewport = siteViewport;

const META_PIXEL_ID = "1818440896032304";

// Separate root layouts force document navigation between tracked and untracked pages.
export default async function StorefrontLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim();
  const requestHeaders = await headers();
  const referrer = requestHeaders.get("referer") ?? "";
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";

  return (
    <SiteDocument>
      {children}
      {projectId && <StorefrontClarity projectId={projectId} />}
      <StorefrontGoogleTag />
      <StorefrontMetaPixel pixelId={META_PIXEL_ID} />
      {hasTrackableReferrer(referrer, host) && (
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            width={1}
            height={1}
            alt=""
            hidden
            fetchPriority="low"
            referrerPolicy="no-referrer"
          />
        </noscript>
      )}
    </SiteDocument>
  );
}
