import type { Project } from "@/lib/types";

export const whjStudentUpdate: Project = {
  slug: "whj-student-update",
  title: "Student Progress Tracker",
  tagline: "Automating the coaching report nobody wanted to write.",
  year: "2023",
  tier: 3,
  featured: false,
  collection: "hooj",
  tech: [
    { label: "Python", category: "language" },
    { label: "Google Sheets API", category: "platform" },
    { label: "xlsxwriter", category: "library" },
  ],
  repoUrl: "https://github.com/roshanarunk/WHJStudentUpdate",
  summary:
    "Reads a roster of coaching students from Google Sheets, looks up each player's current rank, and reports who has actually improved since they started.",
  longDescription: [
    "The coaching org tracked students in a spreadsheet: name, starting rank, tracker link. Working out who had progressed meant opening every link by hand, which is exactly the sort of chore that stops getting done.",
    "The script reads the sheet, parses Riot IDs out of the tracker URLs with a regex, queries current rank across the NA, EU and AP regions, and compares it against where each student started — spanning the act and episode boundaries that reset ranks.",
    "It writes two files rather than one: students with usable data, and students whose data is missing or stale. Separating them was the difference between a report someone reads and a report someone has to audit.",
  ],
  highlights: [
    "Google Sheets as the input surface, so coaches kept their existing workflow",
    "Rank comparison across act and episode boundaries",
    "Splits confident results from stale data instead of silently mixing them",
  ],
  demo: {
    kind: "writeup",
    title: "How it reads the roster",
    excerpts: [
      {
        file: "hooj.py",
        language: "python",
        code: `# Tracker links are pasted by hand, so the Riot ID has to be
# recovered from the URL rather than assumed to be a clean field.
match = re.search(r"riot/([^/]+)", unquote(tracker_url))
name, tag = match.group(1).split("#")`,
        note: "The roster is human-maintained, so every input is treated as untrusted and parsed defensively.",
      },
    ],
    sourceUrl: "https://github.com/roshanarunk/WHJStudentUpdate",
  },
};
