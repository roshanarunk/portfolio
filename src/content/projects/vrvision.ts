import type { Project } from "@/lib/types";

export const vrvision: Project = {
  slug: "vrvision",
  title: "VRVision",
  tagline: "Augmented reality as an aid for low vision.",
  year: "2021–2023",
  tier: 1,
  featured: true,
  role: "Solo developer",
  collection: "coursework",
  tech: [
    { label: "Java", category: "language" },
    { label: "Android", category: "platform" },
    { label: "Google Cardboard", category: "platform" },
    { label: "OpenGL", category: "library" },
  ],
  repoUrl: "https://github.com/roshanarunk/VRVision",
  summary:
    "A Google Cardboard app that processes the phone camera feed in real time to make the world more legible for people with vision impairments.",
  longDescription: [
    "Built for my IB Diploma computer science coursework, where the brief was to find a real problem and solve it in code for an actual client rather than an imagined one.",
    "The app renders a stereoscopic camera feed through Google Cardboard and applies shader-based processing to it — adjusting contrast and colour so that detail someone would otherwise miss becomes visible. The rendering runs through OpenGL shaders because per-frame processing had to keep up with head movement to avoid motion sickness.",
    "The part I would carry into any project was consulting someone who actually lives with a vision impairment. It changed the design: what I assumed would help was not what was asked for.",
    "The demo above is not a re-creation. It is the fragment shader out of MyShaders.java, compiled by your browser and run against your webcam — the bounded magnifier region, the offset sampling, the brightness multiply and the channel inversion are all the original arithmetic.",
  ],
  highlights: [
    "Real-time stereoscopic camera processing through OpenGL shaders",
    "Designed around consultation with someone affected, not assumptions",
    "Shipped as an installable APK with a recorded walkthrough",
    "The same GLSL runs in the demo above, unmodified apart from the sampler",
  ],
  challenges: [
    {
      problem:
        "A Cardboard app seems impossible to demonstrate on a website: it needs a phone, a headset, a camera and a gyroscope.",
      solution:
        "The headset part cannot be reproduced, but the image processing is the substance of the project, and it is written in GLSL ES 2.0 — which is the language WebGL speaks. The demo runs the original fragment shaders against your webcam, changing one thing: Android binds the camera to a samplerExternalOES, while a browser supplies an ordinary sampler2D.",
    },
    {
      problem:
        "Assuming I knew what would help. My first idea was heavy edge detection, on the theory that outlines are easier to see.",
      solution:
        "Talking to someone who actually lives with low vision redirected the whole project towards magnification and contrast, which is what they already did with a phone camera and wanted to do hands-free. The lesson outlasted the code.",
    },
  ],
  demo: {
    kind: "live",
    componentId: "vrvision",
    title: "The shaders, running here",
    instructions:
      "Move the magnifier or invert the colours. Use your camera for the real thing.",
    badge: "The app's own GLSL, in WebGL",
    sourceUrl:
      "https://github.com/roshanarunk/VRVision/blob/main/Android/app/src/main/java/org/syriancarrot/hellovr/MyShaders.java",
  },
};
