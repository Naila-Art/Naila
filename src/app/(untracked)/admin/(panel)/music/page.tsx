import MusicAdmin from "@/components/admin/MusicAdmin";
import { getTemplateMusicMap, getTemplateMusicOverrides, listMusic, listTemplates } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function MusicPage() {
  const [tracks, templates, assignments, overrides] = await Promise.all([
    listMusic(),
    listTemplates(),
    getTemplateMusicMap(),
    getTemplateMusicOverrides(),
  ]);

  return (
    <MusicAdmin
      initialTracks={tracks}
      templates={templates}
      initialAssignments={assignments}
      initialOverrides={overrides}
    />
  );
}
