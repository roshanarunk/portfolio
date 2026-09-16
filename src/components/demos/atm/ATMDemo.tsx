"use client";

import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { DemoComponentProps } from "../registry";
import {
  DEPOSIT,
  WITHDRAWAL,
  type AccountState,
  type Outcome,
  addTransaction,
  checkPin,
  describe,
  formatDate,
  openAccount,
} from "./account";
import { cn } from "@/lib/utils";

/**
 * The ATM project's domain logic, running.
 *
 * The Swing interface cannot come to the browser, but the classes underneath it
 * are pure logic and port directly — which was the point of separating them in
 * the first place. Everything below calls the ported `addTransaction` and
 * `checkPin` rather than reimplementing the rules.
 */

const PIN = "1234";
const START_BALANCE = 500;

const money = (n: number) =>
  n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });

export function ATMDemo({ resetToken }: DemoComponentProps) {
  const initial = useMemo(
    () => openAccount("1001", PIN, START_BALANCE),
    // A new account whenever the shell's reset button is pressed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resetToken],
  );

  const [account, setAccount] = useState<AccountState>(initial);
  const [authed, setAuthed] = useState(false);
  const [pinEntry, setPinEntry] = useState("");
  const [pinError, setPinError] = useState(false);
  const [amount, setAmount] = useState("100");
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  function submitPin(event: React.FormEvent) {
    event.preventDefault();
    if (checkPin(account, pinEntry)) {
      setAuthed(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinEntry("");
    }
  }

  function run(type: typeof WITHDRAWAL | typeof DEPOSIT) {
    const value = Number(amount);
    if (!Number.isFinite(value)) return;

    const result = addTransaction(account, {
      date: new Date(),
      type,
      amount: value,
    });
    setAccount(result.account);
    setOutcome(result.outcome);
  }

  if (!authed) {
    return (
      <div className="p-6 sm:p-10">
        <form onSubmit={submitPin} className="mx-auto max-w-xs">
          <label
            htmlFor="atm-pin"
            className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
          >
            Enter PIN
          </label>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
            Use {PIN} — this account is fictional and lives only in this tab.
          </p>
          <input
            id="atm-pin"
            inputMode="numeric"
            autoComplete="off"
            value={pinEntry}
            onChange={(e) => setPinEntry(e.target.value.replace(/\D/g, ""))}
            className="mt-3 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-center text-lg tracking-[0.5em] text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            maxLength={6}
          />
          {pinError && (
            <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
              Incorrect PIN.
            </p>
          )}
          <button
            type="submit"
            className="tx mt-3 w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            Sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <div>
        <p className="text-xs tracking-wide text-neutral-600 uppercase dark:text-neutral-400">
          Balance
        </p>
        <p className="fig mt-1 text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
          {money(account.balance)}
        </p>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor="atm-amount"
              className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
            >
              Amount
            </label>
            <input
              id="atm-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="fig mt-1 w-32 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </div>
          <button
            type="button"
            onClick={() => run(DEPOSIT)}
            className="tx rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
          >
            Deposit
          </button>
          <button
            type="button"
            onClick={() => run(WITHDRAWAL)}
            className="tx rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
          >
            Withdraw
          </button>
        </div>

        {outcome && !outcome.ok && (
          <p
            role="alert"
            className="mt-4 flex gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
          >
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              {outcome.reason === "insufficient" ? (
                <>
                  Refused: insufficient funds. Try withdrawing{" "}
                  <strong>exactly {money(account.balance)}</strong> — the original
                  checks <code>balance &gt; amount</code>, so emptying the account is
                  impossible. That is a real bug in the 2021 code, kept here rather than
                  quietly fixed.
                </>
              ) : (
                <>
                  A negative withdrawal sets the balance to zero and prints
                  &ldquo;BEGONE HACKER&rdquo;. The original punishes the account instead
                  of rejecting the input.
                </>
              )}
            </span>
          </p>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-xs tracking-wide text-neutral-600 uppercase dark:text-neutral-400">
          Statement
        </p>
        {account.transactions.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            No transactions yet. Refused ones are never recorded.
          </p>
        ) : (
          <ol className="mt-2 space-y-1.5">
            {account.transactions.map((t, i) => (
              <li
                key={`${t.date.getTime()}-${i}`}
                className="fig flex items-baseline justify-between gap-3 text-sm"
              >
                <span
                  className={cn(
                    "font-medium",
                    t.type === DEPOSIT
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-neutral-900 dark:text-neutral-100",
                  )}
                >
                  {describe(t.type)}
                </span>
                <span className="text-neutral-600 dark:text-neutral-400">
                  {money(t.amount)}
                </span>
              </li>
            ))}
          </ol>
        )}
        {account.transactions.length > 0 && (
          <p className="mt-3 text-[0.65rem] text-neutral-500 dark:text-neutral-500">
            {formatDate(account.transactions[0].date)} — first entry
          </p>
        )}
      </div>
    </div>
  );
}
