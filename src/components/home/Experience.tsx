import { experience } from "@/content/site";

/**
 * Employment history as a plain list: logo, company and role on the left, term
 * right-aligned. No cards and no borders between rows — the alignment does the
 * work, and a recruiter scanning for company names finds them immediately.
 *
 * Logos are each company's own favicon. Two of them were only available at
 * 32px, so every mark is rendered inside a fixed box on a neutral tile rather
 * than at its native size, which keeps the column even when the sources differ.
 */
export function Experience({ className }: { className?: string }) {
  if (experience.length === 0) return null;

  return (
    <section
      aria-labelledby="experience"
      className={[
        "section-gap border-t border-neutral-200 dark:border-neutral-800",
        className ?? "",
      ].join(" ")}
    >
      <h2 id="experience" className="h-section text-neutral-900 dark:text-neutral-100">
        Experience
      </h2>

      <ul className="mt-8">
        {experience.map((role) => (
          <li
            key={`${role.company}-${role.start}`}
            className="tx flex items-center gap-4 border-b border-neutral-200 px-3 py-4 first:border-t hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/60"
          >
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
              {role.logo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={role.logo}
                  alt=""
                  width={40}
                  height={40}
                  loading="lazy"
                  className="size-7 object-contain"
                />
              ) : (
                <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  {role.company.charAt(0)}
                </span>
              )}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block font-medium text-neutral-900 dark:text-neutral-100">
                {role.company}
              </span>
              <span className="block text-sm text-neutral-600 dark:text-neutral-400">
                {role.title}
              </span>
            </span>

            <span className="fig shrink-0 text-sm text-neutral-500 dark:text-neutral-400">
              {role.period}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
