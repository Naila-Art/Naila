import MusicAdmin from "@/components/admin/MusicAdmin";
import { listMusic } from "@/lib/store";

type Props = { params: Promise<{ key: string }> };

export const dynamic = "force-dynamic";

export default async function MusicPage({ params }: Props) {
  const { key } = await params;
  return <MusicAdmin adminKey={key} initial={await listMusic()} />;
}
