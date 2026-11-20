import PaymentsAdmin from "@/components/admin/PaymentsAdmin";
import { paymobEnabled } from "@/lib/paymob";
import { listPaymentMethods } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  return <PaymentsAdmin initial={await listPaymentMethods()} paymobReady={paymobEnabled()} />;
}
