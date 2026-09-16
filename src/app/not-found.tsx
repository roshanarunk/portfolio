import Link from "next/link";
import { Container } from "@/components/layout/Container";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-start py-24">
      <p className="screened text-[0.7rem] text-[var(--live)]">Error</p>
      <h1 className="marquee mt-4 text-[2.6rem] text-[var(--ink)] sm:text-6xl">
        Page not found
      </h1>
      <p className="mt-5 text-[var(--ink-dim)]">That link does not go anywhere.</p>
      <Link
        href="/"
        className="screened mt-8 inline-flex items-center gap-2 bg-[var(--live)] px-5 py-3 text-[0.72rem] text-[var(--on-live)] transition-opacity hover:opacity-90"
      >
        Back home
      </Link>
    </Container>
  );
}
