import type { Metadata } from "next";
import { Container, Prose } from "@/components/layout/Container";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "About",
  description: site.intro,
};

export default function AboutPage() {
  return (
    <Container className="py-12">
      <Prose>
        <h1 className="marquee text-[2.6rem] text-[var(--ink)] sm:text-6xl">About</h1>

        <div className="mt-8 space-y-4 leading-relaxed text-[var(--ink-dim)]">
          <p>
            I am a software engineer who tends to build things for people I know. Most
            of the work on this site started as somebody&apos;s actual problem: a
            coaching org with no website, a spreadsheet nobody wanted to update by hand,
            a friend who could not read comics on their phone.
          </p>
          <p>
            That shapes how I work. I care about whether something gets used more than
            whether it is clever, and I would rather ship a small thing that works than
            a large thing that almost does.
          </p>
          <p>
            Technically I move around a lot: React and TypeScript on the web, Python for
            data and automation, Java for Android and backend work, Swift for iOS. The
            through line is that I learn a stack when a problem needs it.
          </p>
          <p>
            I am currently looking for internships and early-career roles. If something
            here is relevant to what your team is working on, I would like to hear about
            it.
          </p>
        </div>

        <h2 className="marquee mt-14 text-3xl text-[var(--ink)]">
          How this site works
        </h2>
        <div className="mt-5 space-y-4 leading-relaxed text-[var(--ink-dim)]">
          <p>
            Portfolios usually show screenshots. I wanted the projects to be usable, so
            where a project could be made to run in a browser, it was: the Sudoku solver
            is my original Python algorithm ported to TypeScript, and the League model
            runs its real fitted coefficients client-side.
          </p>
          <p>
            Not everything can be. An Android AR app needs a headset and a Windows
            overlay needs Windows. Those get a video or a code writeup, which is more
            honest than a mockup pretending to be live.
          </p>
          <p>
            Built with Next.js, TypeScript and Tailwind, exported as a fully static
            site. Each demo is code-split, so the landing page never downloads code for
            a demo you have not opened.
          </p>
        </div>

        <p className="mt-10 text-[var(--ink-dim)]">
          Reach me at{" "}
          <a
            href={`mailto:${site.email}`}
            className="text-[var(--active)] underline underline-offset-4"
          >
            {site.email}
          </a>
          .
        </p>
      </Prose>
    </Container>
  );
}
