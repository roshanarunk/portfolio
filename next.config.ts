import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: no server, no serverless functions. Exports to out/.
  output: "export",
  // The Next image optimizer requires a server, which static export does not have.
  // All images are therefore pre-sized by hand — keep them small.
  images: { unoptimized: true },
  // Emits out/projects/sudoku/index.html rather than out/projects/sudoku.html,
  // which keeps relative asset paths working on any static host.
  trailingSlash: true,
};

export default nextConfig;
