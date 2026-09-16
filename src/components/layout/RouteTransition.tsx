"use client";

import { usePathname } from "next/navigation";

/**
 * Animates page content on route change, so navigation reads as a transition
 * rather than a hard cut.
 *
 * React's `<ViewTransition>` would be the better mechanism, but it ships only
 * in React canary — this project is on stable 19.2.8, where the export does not
 * exist. Keying a wrapper on the pathname achieves the same visible result:
 * React discards the old subtree and mounts a new one, so the entrance
 * animation replays on every navigation.
 *
 * The animation starts from an already-visible state and only offsets, so a
 * browser that skips it still shows a correctly laid-out page. Reduced motion
 * disables it entirely, handled once in globals.css.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="route-enter">
      {children}
    </div>
  );
}
