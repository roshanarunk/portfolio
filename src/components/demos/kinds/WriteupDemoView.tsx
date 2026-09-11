import type { WriteupDemo } from "@/lib/types";
import { DemoShell } from "../DemoShell";

/**
 * For work that cannot be demonstrated live — the code itself carries the story,
 * so show the excerpts that matter with a note on why each one is interesting.
 */
export function WriteupDemoView({ demo }: { demo: WriteupDemo }) {
  if (!demo.excerpts?.length) return null;

  return (
    <DemoShell
      title={demo.title}
      instructions={demo.instructions}
      sourceUrl={demo.sourceUrl}
      badge={demo.badge}
    >
      <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {demo.excerpts.map((excerpt) => (
          <div key={excerpt.file} className="p-4">
            <p className="mb-2 font-mono text-xs text-neutral-500 dark:text-neutral-400">
              {excerpt.file}
            </p>
            <pre className="overflow-x-auto rounded-lg bg-neutral-950 p-4 text-sm text-neutral-100 dark:bg-black">
              <code>{excerpt.code}</code>
            </pre>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {excerpt.note}
            </p>
          </div>
        ))}
      </div>
    </DemoShell>
  );
}
