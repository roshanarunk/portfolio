"use client";

import { useState } from "react";
import type { GalleryDemo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DemoShell } from "../DemoShell";

/** Screenshot gallery for projects that cannot run in a browser at all. */
export function GalleryDemoView({ demo }: { demo: GalleryDemo }) {
  const [active, setActive] = useState(0);
  const current = demo.images[active];

  return (
    <DemoShell
      title={demo.title}
      instructions={demo.instructions}
      sourceUrl={demo.sourceUrl}
      badge={demo.badge}
    >
      <figure className="m-0">
        <div className="flex items-center justify-center bg-neutral-100 p-4 dark:bg-neutral-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.src}
            alt={current.alt}
            width={current.width}
            height={current.height}
            className="max-h-[28rem] w-auto rounded-lg object-contain shadow-sm"
          />
        </div>
        {current.caption && (
          <figcaption className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
            {current.caption}
          </figcaption>
        )}
      </figure>

      {demo.images.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto border-t border-neutral-200 px-4 py-3 dark:border-neutral-800"
          role="tablist"
          aria-label={`${demo.title} screenshots`}
        >
          {demo.images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={image.alt}
              onClick={() => setActive(index)}
              className={cn(
                "shrink-0 overflow-hidden rounded-md border-2 transition",
                index === active
                  ? "border-neutral-900 dark:border-neutral-100"
                  : "border-transparent opacity-60 hover:opacity-100",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.src} alt="" className="h-16 w-auto object-cover" />
            </button>
          ))}
        </div>
      )}
    </DemoShell>
  );
}
