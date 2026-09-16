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
        "overflow-hidden border-2 border-[var(--rule)] bg-[var(--ground-panel)]",
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[var(--rule)] px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id={headingId} className="font-semibold text-[var(--ink)]">
              {title}
            </h2>
            {badge && (
              <span className="screened text-[0.6rem] text-[var(--live)]">{badge}</span>
            )}
          </div>
          {instructions && (
            <p className="mt-1 text-sm text-[var(--ink-dim)]">{instructions}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {resettable && (
            <button
              type="button"
              onClick={reset}
              className="screened inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[0.65rem] text-[var(--ink-dim)] transition-colors hover:text-[var(--active)]"
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
              className="screened inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[0.65rem] text-[var(--ink-dim)] transition-colors hover:text-[var(--active)]"
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
