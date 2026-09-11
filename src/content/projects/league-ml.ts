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
    "Logistic regression is the model worth showing interactively: inference is a dot product, so exporting the fitted coefficients lets the predictor run entirely in the browser with no backend. It reaches 79.5% accuracy and 0.886 ROC-AUC on games it has never seen.",
    "The result that surprised me was how lopsided the coefficients are. Gold lead carries about seven times the weight of the next strongest feature — vision and plates barely register once gold is known, largely because gold already encodes them.",
  ],
  highlights: [
    "Built the dataset end to end, from ladder scrape to labelled feature frame",
    "Compared three model families on both full and reduced feature sets",
    "79.5% accuracy and 0.886 ROC-AUC on held-out games",
    "Gold lead dominates every other signal by roughly seven to one",
  ],
  challenges: [
    {
      problem:
        "The dataset has one row per team, so every game appears twice with mirrored features and opposite labels. Splitting rows at random puts both halves of the same game either side of the split, which leaks the answer into the test set and flatters the score.",
      solution:
        "Split by game rather than by row, using GroupShuffleSplit so both teams stay together. The export script verifies the pairing holds before it trains, so a reordered dataset fails loudly instead of quietly reporting a better number than it earned.",
    },
  ],
  cardImage: {
    src: "/images/cards/league-ml.png",
    alt: "The League win-probability predictor with its feature sliders",
    width: 960,
    height: 600,
    placeholder: true,
  },
  demo: {
    kind: "live",
    componentId: "league-ml",
    title: "Win probability at 14 minutes",
    instructions: "Adjust a team's position and watch the prediction move.",
    badge: "Model runs in your browser",
    sourceUrl: "https://github.com/roshanarunk/league-ML",
  },
};
