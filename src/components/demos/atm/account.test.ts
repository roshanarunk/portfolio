import { describe, it, expect } from "vitest";
import {
  DEPOSIT,
  WITHDRAWAL,
  addTransaction,
  checkPin,
  describe as describeType,
  openAccount,
  printStatement,
} from "./account";

const at = (amount: number, type: typeof WITHDRAWAL | typeof DEPOSIT) => ({
  date: new Date("2024-03-01T09:30:00"),
  type,
  amount,
});

describe("the ported ATM account", () => {
  it("deposits add to the balance and are recorded", () => {
    const account = openAccount("1001", "1234");
    const { account: after, outcome } = addTransaction(account, at(250, DEPOSIT));

    expect(outcome.ok).toBe(true);
    expect(after.balance).toBe(250);
    expect(after.transactions).toHaveLength(1);
  });

  it("withdraws less than the balance", () => {
    const account = openAccount("1001", "1234", 500);
    const { account: after, outcome } = addTransaction(account, at(200, WITHDRAWAL));

    expect(outcome.ok).toBe(true);
    expect(after.balance).toBe(300);
  });

  /**
   * The original reads `if (this.balance > t.getAmount())`, so an exact-balance
   * withdrawal is refused. This test pins the real behaviour rather than the
   * intended one — the demo's whole point is showing the bug.
   */
  it("refuses a withdrawal of exactly the balance, as the original does", () => {
    const account = openAccount("1001", "1234", 500);
    const { account: after, outcome } = addTransaction(account, at(500, WITHDRAWAL));

    expect(outcome).toEqual({ ok: false, reason: "insufficient" });
    expect(after.balance).toBe(500);
    expect(after.transactions).toHaveLength(0);
  });

  it("refuses a withdrawal larger than the balance", () => {
    const account = openAccount("1001", "1234", 100);
    const { outcome } = addTransaction(account, at(150, WITHDRAWAL));

    expect(outcome).toEqual({ ok: false, reason: "insufficient" });
  });

  /** The original zeroes the balance and prints "BEGONE HACKER". */
  it("zeroes the balance on a negative withdrawal, as the original does", () => {
    const account = openAccount("1001", "1234", 800);
    const { account: after, outcome } = addTransaction(account, at(-50, WITHDRAWAL));

    expect(outcome).toEqual({ ok: false, reason: "negative" });
    expect(after.balance).toBe(0);
  });

  it("checks the PIN by exact match", () => {
    const account = openAccount("1001", "4321");
    expect(checkPin(account, "4321")).toBe(true);
    expect(checkPin(account, "4320")).toBe(false);
  });

  it("names transaction types the way the original does", () => {
    expect(describeType(DEPOSIT)).toBe("Deposit");
    expect(describeType(WITHDRAWAL)).toBe("Withdrawal");
  });

  it("prints a statement line per recorded transaction", () => {
    let account = openAccount("1001", "1234");
    account = addTransaction(account, at(300, DEPOSIT)).account;
    account = addTransaction(account, at(100, WITHDRAWAL)).account;

    const lines = printStatement(account).split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("Deposit 300");
    expect(lines[1]).toContain("Withdrawal 100");
    expect(lines[0]).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} /);
  });

  it("does not record a refused transaction", () => {
    const account = openAccount("1001", "1234", 50);
    const { account: after } = addTransaction(account, at(999, WITHDRAWAL));
    expect(printStatement(after)).toBe("");
  });
});
