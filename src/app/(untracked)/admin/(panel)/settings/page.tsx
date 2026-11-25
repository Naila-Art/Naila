import SettingsAdmin from "@/components/admin/SettingsAdmin";
import { getSiteSettings } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  return <SettingsAdmin initial={await getSiteSettings()} />;
}
