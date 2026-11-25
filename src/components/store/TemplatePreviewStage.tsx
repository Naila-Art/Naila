"use client";

import { useEffect, useState, type ReactNode } from "react";
import TemplatePreview from "@/components/TemplatePreview";
import TemplatePreviewDock from "./TemplatePreviewDock";
import type { MusicTrack, Template } from "@/lib/types";

interface Props {
  template: Template;
  music: MusicTrack[];
  defaultTrackId: string;
  children?: ReactNode;
}

/**
 * Interactive stage for /t/[id]: pairs the template's assigned soundtrack with the
 * live invitation preview and lets visitors swap & audition library tracks from the dock.
 */
export default function TemplatePreviewStage({ template, music, defaultTrackId, children }: Props) {
  const [selectedTrackId, setSelectedTrackId] = useState(defaultTrackId);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("m");
    if (!requested) return;
    if (requested === "none" || music.some((t) => t.id === requested)) {
      setSelectedTrackId(requested);
    }
  }, [music]);

  const activeMusicUrl =
    selectedTrackId && selectedTrackId !== "none"
      ? music.find((t) => t.id === selectedTrackId)?.url
      : undefined;

  return (
    <>
      <TemplatePreview template={template} musicUrl={activeMusicUrl} />
      {children}
      <TemplatePreviewDock
        template={template}
        music={music}
        defaultTrackId={defaultTrackId}
        selectedTrackId={selectedTrackId}
        onSelectTrack={setSelectedTrackId}
      />
    </>
  );
}
