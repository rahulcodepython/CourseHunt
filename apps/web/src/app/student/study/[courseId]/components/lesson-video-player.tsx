"use client";

import { MediaPlayer, MediaProvider } from "@vidstack/react";
import { defaultLayoutIcons, DefaultVideoLayout } from "@vidstack/react/player/layouts/default";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

export function LessonVideoPlayer({ src, title }: { src: string; title: string }) {
  return (
    <MediaPlayer
      key={src}
      title={title}
      src={src}
      className="aspect-video w-full overflow-hidden rounded-lg bg-black"
      crossOrigin
      playsInline
    >
      <MediaProvider />
      <DefaultVideoLayout icons={defaultLayoutIcons} />
    </MediaPlayer>
  );
}
