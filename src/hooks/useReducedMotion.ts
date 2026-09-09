"use client";

import { useMediaQuery } from "./useMediaQuery";

/**
 * True when the visitor has asked for reduced motion. Demos use this to default
 * to manual stepping instead of auto-playing animation.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
