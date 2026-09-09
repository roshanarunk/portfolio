"use client";

import { useState } from "react";
import { Download, Play } from "lucide-react";
import type { VideoDemo } from "@/lib/types";
import { DemoShell } from "../DemoShell";

/**
 * A YouTube facade: the poster is a plain image and the embed is only mounted on
 * click, which avoids loading the player JS (and its cookies) for everyone who
 * merely scrolls past.
 */
export function VideoDemoView({ demo }: { demo: VideoDemo }) {
  const [playing, setPlaying] = useState(false);

  return (
    <DemoShell
      title={demo.title}
      instructions={demo.instructions}
      sourceUrl={demo.sourceUrl}
      badge={demo.badge}
    >
      <div className="relative aspect-video w-full bg-neutral-950">
        {playing ? (
          demo.provider === "youtube" ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${demo.src}?autoplay=1`}
              title={demo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 size-full border-0"
            />
          ) : (
            <video
              src={demo.src}
              controls
              autoPlay
              playsInline
              poster={demo.posterSrc}
              className="absolute inset-0 size-full"
            />
          )
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={demo.posterSrc}
              alt={demo.posterAlt}
              className="absolute inset-0 size-full object-cover"
            />
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center bg-neutral-950/40 transition hover:bg-neutral-950/25"
              aria-label={`Play video: ${demo.title}`}
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-white/95 shadow-lg">
                <Play aria-hidden className="ml-1 size-7 text-neutral-900" />
              </span>
            </button>
          </>
        )}
      </div>

      {demo.downloads && demo.downloads.length > 0 && (
        <footer className="flex flex-wrap items-center gap-4 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
          {demo.downloads.map((file) => (
            <a
              key={file.href}
              href={file.href}
              download
              className="inline-flex items-center gap-1.5 text-sm text-neutral-700 underline underline-offset-4 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
            >
              <Download aria-hidden className="size-3.5" />
              {file.label}
              {file.note && (
                <span className="text-neutral-500 no-underline dark:text-neutral-500">
                  ({file.note})
                </span>
              )}
            </a>
          ))}
        </footer>
      )}
    </DemoShell>
  );
}
