import MusicAdmin from "@/components/admin/MusicAdmin";
import { listMusic } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function MusicPage() {
  return <MusicAdmin initial={await listMusic()} />;
}
