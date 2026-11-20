import PricingAdmin from "@/components/admin/PricingAdmin";
import { getPricing } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  return <PricingAdmin initial={await getPricing()} />;
}
