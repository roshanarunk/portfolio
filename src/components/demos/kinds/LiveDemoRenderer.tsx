"use client";

import type { LiveDemo } from "@/lib/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DemoShell } from "../DemoShell";
import { demoRegistry } from "../registry";

/**
 * Resolves a live demo id to its lazily-loaded component. This is the only place
 * the registry is imported, which keeps demo bundles off pages that do not
 * render one.
 */
export function LiveDemoRenderer({ demo }: { demo: LiveDemo }) {
  const Component = demoRegistry[demo.componentId];
  const reducedMotion = useReducedMotion();
  const isNarrow = useMediaQuery("(max-width: 640px)");

  const blocked = demo.mobileFallback === "blocked" && isNarrow;

  return (
    <DemoShell
      title={demo.title}
      instructions={demo.instructions}
      sourceUrl={demo.sourceUrl}
      badge={demo.badge}
      resettable={!blocked}
    >
      {(resetToken) =>
        blocked ? (
          <div className="p-12 text-center text-sm text-neutral-600 dark:text-neutral-400">
            This demo needs a wider screen. Open it on a laptop to try it.
          </div>
        ) : (
          <Component
            key={resetToken}
            resetToken={resetToken}
            reducedMotion={reducedMotion}
          />
        )
      }
    </DemoShell>
  );
}
