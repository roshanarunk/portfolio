import type { Project } from "@/lib/types";

export const leagueMl: Project = {
  slug: "league-ml",
  title: "League Win Predictor",
  tagline: "Can a game's outcome be called from its 14th minute?",
  year: "2024",
  tier: 1,
  featured: true,
  collection: "personal",
  tech: [
    { label: "Python", category: "language" },
    { label: "scikit-learn", category: "library" },
    { label: "pandas", category: "library" },
    { label: "Riot API", category: "platform" },
  ],
  repoUrl: "https://github.com/roshanarunk/league-ML",
  summary:
    "Pulled match timelines from the Korean solo queue ladder, extracted team state at the 14-minute mark, and trained classifiers to predict which side wins.",
  longDescription: [
    "The question was whether a League of Legends game is effectively decided before it ends. I scraped the top 100 ranked players on the Korean ladder, pulled their match timelines through the Riot API, and captured each team's position at 14 minutes: gold, level, minions, jungle farm, kills, deaths, assists, turret plates, towers, dragons, heralds and wards.",
    "I compared logistic regression, a decision tree and a random forest, each on the full 13-feature set and a reduced 10-feature set that drops plates and ward counts. Evaluation used a shared helper reporting precision, recall, a confusion matrix and ROC-AUC, so the models were judged the same way rather than on accuracy alone.",
    "Logistic regression is the model worth showing interactively: inference is a dot product, so exporting the fitted coefficients lets the predictor run entirely in the browser with no backend.",
  ],
  highlights: [
    "Built the dataset end to end, from ladder scrape to labelled feature frame",
    "Compared three model families on both full and reduced feature sets",
    "Correlation analysis to identify which mid-game advantages actually carry",
  ],
  demo: {
    kind: "live",
    componentId: "league-ml",
    title: "Win probability at 14 minutes",
    instructions: "Adjust a team's position and watch the prediction move.",
    badge: "Model runs in your browser",
    sourceUrl: "https://github.com/roshanarunk/league-ML",
  },
};
