import type { Demo } from "@/lib/types";
import { LiveDemoRenderer } from "./kinds/LiveDemoRenderer";
import { IframeDemoView } from "./kinds/IframeDemoView";
import { VideoDemoView } from "./kinds/VideoDemoView";
import { GalleryDemoView } from "./kinds/GalleryDemoView";
import { WriteupDemoView } from "./kinds/WriteupDemoView";

/**
 * Dispatches on demo kind. The union is exhaustive, so adding a new kind to
 * `DemoKind` fails the build here until it is handled.
 */
export function DemoRenderer({ demo }: { demo: Demo }) {
  switch (demo.kind) {
    case "live":
      return <LiveDemoRenderer demo={demo} />;
    case "iframe":
      return <IframeDemoView demo={demo} />;
    case "video":
      return <VideoDemoView demo={demo} />;
    case "gallery":
      return <GalleryDemoView demo={demo} />;
    case "writeup":
      return <WriteupDemoView demo={demo} />;
  }
}
