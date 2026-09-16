import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
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
    <Container className="py-12">
      <h1 className="marquee text-[2.6rem] text-[var(--ink)] sm:text-6xl">Projects</h1>
      <p className="mt-5 max-w-xl text-[var(--ink-dim)]">
        Where a project could be made to run in the browser, it does. Where it genuinely
        could not — an iOS app, an Android AR headset app, a Windows overlay — there is
        a video or a writeup instead.
      </p>

      {tiers.map(({ tier, label }) => {
        const group = projects.filter((project) => project.tier === tier);
        if (group.length === 0) return null;

        return (
          <section key={tier} className="mt-12">
            <h2 className="screened mb-5 text-[0.7rem] text-[var(--score)]">{label}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
          </section>
        );
      })}
    </Container>
  );
}
