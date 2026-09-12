import type { Metadata } from "next";
import { ProjectCard } from "@/components/project/ProjectCard";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Interactive demos and writeups of what I have built — web apps, machine learning, mobile and desktop tools.",
};

export default function ProjectsPage() {
  const tiers = [
    { tier: 1 as const, label: "Selected work" },
    { tier: 2 as const, label: "Also built" },
    { tier: 3 as const, label: "Earlier work" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 sm:px-8 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
        Projects
      </h1>
      <p className="mt-3 max-w-2xl text-neutral-600 dark:text-neutral-400">
        Where a project could be made to run in the browser, it does. Where it
        genuinely could not — an iOS app, an Android AR headset app, a Windows
        overlay — there is a video or a writeup instead.
      </p>

      {tiers.map(({ tier, label }) => {
        const group = projects.filter((project) => project.tier === tier);
        if (group.length === 0) return null;

        return (
          <section key={tier} className="mt-12">
            <h2 className="mb-5 text-sm font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
              {label}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
