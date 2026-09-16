import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The one-bit window: 1px chrome, a hard offset shadow, a title bar whose
 * flanking rules mean focus, and an optional status bar along the bottom.
 *
 * Everything here is drawn the way a 1-bit display drew it — no blur, no
 * rounding, no grey. The close box is decorative chrome and is marked
 * aria-hidden: this is a page, not a window manager, and offering a control
 * that does not close anything would be a lie told to a screen reader.
 */
export function Win({
  title,
  status,
  idle = false,
  className,
  bodyClassName,
  children,
  titleId,
}: {
  title: string;
  /** Rendered along the bottom edge, as the original's item/size counts were. */
  status?: ReactNode;
  /** An unfocused window: bare title bar, no flanking rules. */
  idle?: boolean;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
  titleId?: string;
}) {
  return (
    <div className={cn("win flex flex-col", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 px-2 py-1.5",
          idle ? "titlebar-idle" : "titlebar",
        )}
      >
        <span
          aria-hidden
          className="grid size-3 shrink-0 place-items-center border border-[var(--ink)] bg-[var(--paper)]"
        >
          <span className="block h-px w-1.5 bg-[var(--ink)]" />
        </span>
        <h2
          id={titleId}
          className="pixel titlebar-label truncate px-1.5 text-[0.7rem] text-[var(--ink)]"
        >
          {title}
        </h2>
      </div>

      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>

      {status !== undefined && (
        <div className="pixel score flex shrink-0 items-center justify-between gap-3 border-t border-[var(--ink)] px-2 py-1 text-[0.6rem] text-[var(--ink)]">
          {status}
        </div>
      )}
    </div>
  );
}

/**
 * A raised one-bit button. Pressing inverts it and shifts it into its own
 * shadow, which is how the original showed a click rather than a colour change.
 */
export function btnClass(primary = false, className?: string) {
  return cn(
    "btn1 pixel inline-flex items-center justify-center gap-2 px-4 py-2 text-[0.7rem] text-[var(--ink)]",
    primary && "btn1-default",
    className,
  );
}

export function Btn({
  onClick,
  primary = false,
  className,
  children,
}: {
  onClick?: () => void;
  /** The default action, which wears a second frame. */
  primary?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={btnClass(primary, className)}>
      {children}
    </button>
  );
}
