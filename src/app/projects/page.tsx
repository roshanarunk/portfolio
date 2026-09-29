import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { ProjectIndex } from "@/components/project/ProjectIndex";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Interactive demos and writeups of what I have built — web apps, machine learning, mobile and desktop tools.",
};

const tiers = [
  { tier: 1 as const, label: "Selected work" },
  { tier: 2 as const, label: "Also built" },
  { tier: 3 as const, label: "Earlier work" },
];

export default function ProjectsPage() {
  return (
    <Container className="py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
        Projects
      </h1>
      <p className="mt-3 max-w-xl text-neutral-600 dark:text-neutral-400">
        Where a project could be made to run in the browser, it does. Where it genuinely
        could not — an iOS app, a Windows overlay — there are screenshots, a video or a
        writeup instead. Cards marked <em className="not-italic font-medium">Playable here</em>{" "}
        or <em className="not-italic font-medium">Try it here</em> run on their page.
      </p>

      <ProjectIndex projects={projects} tiers={tiers} />
    </Container>
  );
}
