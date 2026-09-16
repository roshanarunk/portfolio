import { experience } from "@/content/site";

/**
 * Employment history as a plain list: logo, company and role on the left, term
 * right-aligned. No cards and no borders between rows — the alignment does the
 * work, and a recruiter scanning for company names finds them immediately.
 *
 * Logos are each company's own favicon. Two of them were only available at
 * 32px, so every mark is rendered inside a fixed box on a panel tile rather
 * than at its native size, which keeps the column even when the sources differ.
 */
export function Experience() {
  if (experience.length === 0) return null;

  return (
    <section
      aria-labelledby="experience"
      className="border-t-2 border-[var(--rule)] py-16"
    >
      <h2 id="experience" className="marquee text-3xl text-[var(--ink)] sm:text-4xl">
        Experience
      </h2>

      <ul className="mt-8">
        {experience.map((role) => (
          <li
            key={`${role.company}-${role.start}`}
            className="group flex items-center gap-4 border-b border-[var(--rule-soft)] px-3 py-4 transition-colors hover:bg-[var(--ground-panel)]"
          >
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden border border-[var(--rule)] bg-[var(--ground-panel)]">
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
                <span className="screened text-sm text-[var(--ink-dim)]">
                  {role.company.charAt(0)}
                </span>
              )}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-[var(--ink)]">
                {role.company}
              </span>
              <span className="block text-sm text-[var(--ink-dim)]">{role.title}</span>
            </span>

            <span className="screened score shrink-0 text-[0.65rem] text-[var(--score)]">
              {role.period}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
