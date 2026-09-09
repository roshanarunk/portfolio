import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "About",
  description: site.intro,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
        About
      </h1>

      <div className="mt-6 space-y-4 leading-relaxed text-neutral-700 dark:text-neutral-300">
        <p>
          I am a software engineer who tends to build things for people I know.
          Most of the work on this site started as somebody&apos;s actual
          problem: a coaching org with no website, a spreadsheet nobody wanted to
          update by hand, a friend who could not read comics on their phone.
        </p>
        <p>
          That shapes how I work. I care about whether something gets used more
          than whether it is clever, and I would rather ship a small thing that
          works than a large thing that almost does.
        </p>
        <p>
          Technically I move around a lot: React and TypeScript on the web, Python
          for data and automation, Java for Android and backend work, Swift for
          iOS. The through line is that I learn a stack when a problem needs it.
        </p>
        <p>
          I am currently looking for internships and early-career roles. If
          something here is relevant to what your team is working on, I would
          like to hear about it.
        </p>
      </div>

      <h2 className="mt-12 text-lg font-medium text-neutral-900 dark:text-neutral-100">
        How this site works
      </h2>
      <div className="mt-4 space-y-4 leading-relaxed text-neutral-700 dark:text-neutral-300">
        <p>
          Portfolios usually show screenshots. I wanted the projects to be
          usable, so where a project could be made to run in a browser, it was:
          the Sudoku solver is my original Python algorithm ported to TypeScript,
          and the League model runs its real fitted coefficients client-side.
        </p>
        <p>
          Not everything can be. An Android AR app needs a headset and a Windows
          overlay needs Windows. Those get a video or a code writeup, which is
          more honest than a mockup pretending to be live.
        </p>
        <p>
          Built with Next.js, TypeScript and Tailwind, exported as a fully static
          site. Each demo is code-split, so the landing page never downloads code
          for a demo you have not opened.
        </p>
      </div>

      <p className="mt-10 text-neutral-700 dark:text-neutral-300">
        Reach me at{" "}
        <a
          href={`mailto:${site.email}`}
          className="underline underline-offset-4 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          {site.email}
        </a>
        .
      </p>
    </div>
  );
}
