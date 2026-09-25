"use client";

import { useEffect, useRef } from "react";
import { MediaPlayer, MediaProvider, type MediaPlayerInstance } from "@vidstack/react";
import { defaultLayoutIcons, DefaultVideoLayout } from "@vidstack/react/player/layouts/default";
import { useHeartbeatMutation } from "@/query-hooks/lessons.api";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

export function LessonVideoPlayer({
  src,
  title,
  lessonId,
  initialPlaybackSeconds = 0,
}: {
  src: string;
  title: string;
  lessonId?: string;
  initialPlaybackSeconds?: number;
}) {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const heartbeat = useHeartbeatMutation();
  const lastLoggedSecond = useRef<number>(initialPlaybackSeconds || 0);
  const hasSeekedInitial = useRef(false);

  useEffect(() => {
    if (!lessonId) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player || player.paused) return;

      const currentSec = Math.floor(player.currentTime);
      const sessionDelta = Math.max(0, currentSec - lastLoggedSecond.current);
      if (sessionDelta >= 5) {
        heartbeat.mutate({
          id: lessonId,
          data: {
            playback_seconds: currentSec,
            session_seconds: sessionDelta,
          },
        });
        lastLoggedSecond.current = currentSec;
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      const player = playerRef.current;
      if (player && lessonId) {
        const currentSec = Math.floor(player.currentTime);
        const sessionDelta = Math.max(0, currentSec - lastLoggedSecond.current);
        if (sessionDelta > 0) {
          heartbeat.mutate({
            id: lessonId,
            data: {
              playback_seconds: currentSec,
              session_seconds: sessionDelta,
            },
          });
        }
      }
    };
  }, [lessonId]);

  return (
    <MediaPlayer
      ref={playerRef}
      key={src}
      title={title}
      src={src}
      onCanPlay={() => {
        if (!hasSeekedInitial.current && initialPlaybackSeconds > 0 && playerRef.current) {
          playerRef.current.currentTime = initialPlaybackSeconds;
          lastLoggedSecond.current = initialPlaybackSeconds;
          hasSeekedInitial.current = true;
        }
      }}
      className="aspect-video w-full overflow-hidden rounded-lg bg-black"
      crossOrigin
      playsInline
    >
      <MediaProvider />
      <DefaultVideoLayout icons={defaultLayoutIcons} />
    </MediaPlayer>
  );
}
