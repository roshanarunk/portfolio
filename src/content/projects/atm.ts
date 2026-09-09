import type { Project } from "@/lib/types";

export const atm: Project = {
  slug: "atm",
  title: "ATM Simulator",
  tagline: "Where the object modelling clicked.",
  year: "2021",
  tier: 3,
  featured: false,
  collection: "coursework",
  tech: [
    { label: "Java", category: "language" },
    { label: "Swing", category: "framework" },
  ],
  repoUrl: "https://github.com/roshanarunk/ATM",
  summary:
    "A desktop ATM simulator modelling customers, accounts and transactions as separate classes behind a Swing interface.",
  longDescription: [
    "An early coursework project, included because it is where domain modelling stopped being an abstract idea. Customer, BankAccount and Transactions each own their own state and rules, with the Swing GUI kept as a layer on top rather than the place the logic lives.",
    "That separation is the same instinct behind the Sudoku solver on this site — keep the rules independent of whatever is drawing them — arrived at years earlier and much less deliberately.",
  ],
  disclosure:
    "An introductory coursework project. Included for the modelling, not the scope.",
  demo: {
    kind: "writeup",
    title: "Domain model",
    excerpts: [
      {
        file: "BankAccount.java",
        language: "java",
        code: `public class BankAccount {
    private double balance;

    public boolean withdraw(double amount) {
        if (amount <= 0 || amount > balance) return false;
        balance -= amount;
        return true;
    }
}`,
        note: "The account enforces its own invariants, so no caller can push it into an invalid state.",
      },
    ],
    sourceUrl: "https://github.com/roshanarunk/ATM",
  },
};
