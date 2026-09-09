import { cn } from "@/lib/utils";

/**
 * Placeholder shown while a demo chunk downloads. Reserves height so the page
 * does not shift when the real demo arrives.
 */
export function DemoSkeleton({
  label = "Loading demo…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-80 flex-col items-center justify-center gap-3 p-12",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="size-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700 motion-reduce:animate-none dark:border-neutral-700 dark:border-t-neutral-300" />
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
    </div>
  );
}
