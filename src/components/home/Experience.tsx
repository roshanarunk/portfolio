import { experience } from "@/content/site";

/**
 * Employment history as a system list: logo tile, company and role, term on the
 * right. The heading lives in the enclosing window's title bar, so this renders
 * as the window's contents rather than as a section carrying its own title.
 *
 * Logos are each company's own favicon, rendered inside a fixed 1px-framed tile
 * so the column stays even when the sources differ in size.
 */
export function Experience() {
  if (experience.length === 0) return null;

  return (
    <ul>
      {experience.map((role, i) => (
        <li
          key={`${role.company}-${role.start}`}
          className={[
            "flex items-center gap-3 py-2.5",
            i > 0 ? "border-t border-[var(--ink)]/30" : "",
          ].join(" ")}
        >
          <span className="grid size-8 shrink-0 place-items-center overflow-hidden border border-[var(--ink)] bg-[var(--paper)]">
            {role.logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={role.logo}
                alt=""
                width={32}
                height={32}
                loading="lazy"
                className="size-5 object-contain"
              />
            ) : (
              <span className="pixel text-[0.6rem] text-[var(--ink)]">
                {role.company.charAt(0)}
              </span>
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-[var(--ink)]">
              {role.company}
            </span>
            <span className="block text-sm text-[var(--ink)]/75">
              {role.title}
            </span>
          </span>

          <span className="pixel score shrink-0 text-[0.6rem] text-[var(--ink)]">
            {role.period}
          </span>
        </li>
      ))}
    </ul>
  );
}
