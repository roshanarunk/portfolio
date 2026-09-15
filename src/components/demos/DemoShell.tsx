"use client";

import { useCallback, useId, useState, type ReactNode } from "react";
import { ExternalLink, RotateCcw } from "lucide-react";
import { DemoErrorBoundary } from "./DemoErrorBoundary";
import { cn } from "@/lib/utils";

export interface DemoShellProps {
  title: string;
  instructions?: string;
  sourceUrl?: string;
  badge?: string;
  /** Adds a reset button that remounts the demo. */
  resettable?: boolean;
  /** Receives a token that changes on every reset. */
  children: ReactNode | ((resetToken: number) => ReactNode);
  className?: string;
}

/**
 * Consistent chrome around every demo, whatever its kind. Owns the reset token
 * so no individual demo has to implement its own reset, and wraps children in an
 * error boundary so one broken demo cannot blank the page.
 */
export function DemoShell({
  title,
  instructions,
  sourceUrl,
  badge,
  resettable = false,
  children,
  className,
}: DemoShellProps) {
  const [resetToken, setResetToken] = useState(0);
  const reset = useCallback(() => setResetToken((n) => n + 1), []);
  const headingId = useId();

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950",
        className,
      )}
      aria-labelledby={headingId}
    >
      {/*
        An <h2>, not an <h3>: the demo sits directly under the project's <h1>,
        so anything deeper skips a level and breaks the document outline for
        screen readers. A plain <div> rather than a nested <header>, which would
        otherwise add a second banner-ish landmark inside the page's <article>.
      */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id={headingId}
              className="font-medium text-neutral-900 dark:text-neutral-100"
            >
              {title}
            </h2>
            {badge && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                {badge}
              </span>
            )}
          </div>
          {instructions && (
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
              {instructions}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {resettable && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            >
              <RotateCcw aria-hidden className="size-3.5" />
              Reset
            </button>
          )}
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            >
              <ExternalLink aria-hidden className="size-3.5" />
              Source
            </a>
          )}
        </div>
      </div>

      <DemoErrorBoundary resetToken={resetToken} onRetry={reset} sourceUrl={sourceUrl}>
        {typeof children === "function" ? children(resetToken) : children}
      </DemoErrorBoundary>
    </section>
  );
}
