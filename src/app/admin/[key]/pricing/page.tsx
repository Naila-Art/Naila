import PricingAdmin from "@/components/admin/PricingAdmin";
import { getPricing } from "@/lib/store";

type Props = { params: Promise<{ key: string }> };

export const dynamic = "force-dynamic";

export default async function PricingPage({ params }: Props) {
  const { key } = await params;
  return <PricingAdmin adminKey={key} initial={await getPricing()} />;
}
