/**
 * A direct port of the ATM project's domain classes.
 *
 * `BankAccount`, `Customer` and `Transactions` each own their own state and
 * rules, with the Swing interface sitting on top rather than holding the logic
 * — which is what makes them portable to this demo at all.
 *
 * The port is faithful, including one bug: see `addTransaction`.
 */

export const WITHDRAWAL = 1;
export const DEPOSIT = 2;

export type TransactionType = typeof WITHDRAWAL | typeof DEPOSIT;

export interface Transaction {
  date: Date;
  type: TransactionType;
  amount: number;
}

/** Matches `Transactions.getTransactionTypeDescription()`. */
export function describe(type: TransactionType): string {
  if (type === DEPOSIT) return "Deposit";
  if (type === WITHDRAWAL) return "Withdrawal";
  return "Error - Invalid Type";
}

export type Outcome =
  | { ok: true }
  /** The original prints to stderr and drops the transaction. */
  | { ok: false; reason: "insufficient" | "negative" };

export interface AccountState {
  accountNumber: string;
  pin: string;
  balance: number;
  transactions: Transaction[];
}

export function openAccount(
  accountNumber: string,
  pin: string,
  balance = 0,
): AccountState {
  return { accountNumber, pin, balance, transactions: [] };
}

/** Matches `BankAccount.checkPin`. */
export function checkPin(account: AccountState, attempt: string): boolean {
  return attempt === account.pin;
}

/**
 * A faithful port of `BankAccount.addTransaction`, including its off-by-one.
 *
 * The Java reads `if (this.balance > t.getAmount())`, so withdrawing an amount
 * exactly equal to the balance is rejected as insufficient funds — emptying the
 * account is impossible. It should be `>=`. The demo keeps the original
 * behaviour and surfaces it rather than quietly correcting it.
 *
 * The negative-amount branch is also real: the original sets the balance to
 * zero and prints "BEGONE HACKER", which punishes the account rather than
 * rejecting the input.
 */
export function addTransaction(
  account: AccountState,
  transaction: Transaction,
): { account: AccountState; outcome: Outcome } {
  if (transaction.type === WITHDRAWAL) {
    if (transaction.amount < 0) {
      // The original zeroes the balance here.
      return {
        account: { ...account, balance: 0 },
        outcome: { ok: false, reason: "negative" },
      };
    }

    // The bug: strictly greater, so balance === amount is refused.
    if (account.balance > transaction.amount) {
      return {
        account: {
          ...account,
          balance: account.balance - transaction.amount,
          transactions: [...account.transactions, transaction],
        },
        outcome: { ok: true },
      };
    }

    return { account, outcome: { ok: false, reason: "insufficient" } };
  }

  return {
    account: {
      ...account,
      balance: account.balance + transaction.amount,
      transactions: [...account.transactions, transaction],
    },
    outcome: { ok: true },
  };
}

/** Matches `BankAccount.printStatement()`, which is plain text in the original. */
export function printStatement(account: AccountState): string {
  return account.transactions
    .map((t) => `${formatDate(t.date)} ${describe(t.type)} ${t.amount}`)
    .join("\n");
}

/** The original's `SimpleDateFormat("yyyy/MM/dd HH:mm:ss")`. */
export function formatDate(date: Date): string {
  const p = (n: number, width = 2) => String(n).padStart(width, "0");
  return (
    `${date.getFullYear()}/${p(date.getMonth() + 1)}/${p(date.getDate())} ` +
    `${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`
  );
}
