"use client";

import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import type { IframeDemo } from "@/lib/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { DemoShell } from "../DemoShell";

/**
 * Embeds a live site behind a click-to-load poster. The iframe stays out of the
 * DOM until requested, so visiting the page costs one image rather than a whole
 * third-party site's assets. On narrow screens a squashed embed is worse than a
 * link, so it offers the link instead.
 */
export function IframeDemoView({ demo }: { demo: IframeDemo }) {
  const [loaded, setLoaded] = useState(false);
  const isNarrow = useMediaQuery("(max-width: 640px)");

  return (
    <DemoShell
      title={demo.title}
      instructions={demo.instructions}
      sourceUrl={demo.sourceUrl}
      badge={demo.badge}
    >
      <div
        className="relative w-full bg-neutral-100 dark:bg-neutral-900"
        style={{ aspectRatio: demo.aspectRatio }}
      >
        {loaded && !isNarrow ? (
          <iframe
            src={demo.src}
            title={demo.title}
            loading="lazy"
            sandbox={demo.sandbox ?? "allow-scripts allow-same-origin allow-popups"}
            referrerPolicy="no-referrer"
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={demo.posterSrc}
              alt={demo.posterAlt}
              className="absolute inset-0 size-full object-cover object-top"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-neutral-950/55 p-6 text-center">
              {isNarrow ? (
                <a
                  href={demo.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-900"
                >
                  <ExternalLink aria-hidden className="size-4" />
                  Open the live site
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setLoaded(true)}
                  className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
                >
                  <Play aria-hidden className="size-4" />
                  Load the live site
                </button>
              )}
              <p className="max-w-sm text-xs text-neutral-300">
                Loads {new URL(demo.src).hostname} in a sandboxed frame.
              </p>
            </div>
          </>
        )}
      </div>
      <footer className="border-t border-neutral-200 px-4 py-2 dark:border-neutral-800">
        <a
          href={demo.src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <ExternalLink aria-hidden className="size-3.5" />
          Open in a new tab
        </a>
      </footer>
    </DemoShell>
  );
}
