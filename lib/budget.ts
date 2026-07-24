export const BUDGET_CATEGORIES = [
  {
    key: "lodging",
    label: "Lodging",
    suggestedPercent: 40,
  },
  {
    key: "transportation",
    label: "Transportation",
    suggestedPercent: 20,
  },
  {
    key: "food",
    label: "Food",
    suggestedPercent: 20,
  },
  {
    key: "activities",
    label: "Activities",
    suggestedPercent: 15,
  },
  {
    key: "miscellaneous",
    label: "Miscellaneous",
    suggestedPercent: 5,
  },
] as const;

export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number]["key"];

export const SUPPORTED_BUDGET_CURRENCIES = [
  "CAD",
  "USD",
  "EUR",
  "GBP",
  "AUD",
] as const;

export function isBudgetCategory(value: string): value is BudgetCategory {
  return BUDGET_CATEGORIES.some(({ key }) => key === value);
}

export function isSupportedBudgetCurrency(
  value: string
): value is (typeof SUPPORTED_BUDGET_CURRENCIES)[number] {
  return SUPPORTED_BUDGET_CURRENCIES.some(
    (currency) => currency === value
  );
}

export function parseBudgetAmountToCents(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > 20_000_000) {
    return null;
  }

  return Math.round(amount * 100);
}

export function formatBudgetAmount(amountInCents: number, currency: string) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInCents / 100);
}

export function centsToInputValue(amountInCents: number | null | undefined) {
  if (amountInCents === null || amountInCents === undefined) {
    return "";
  }

  return (amountInCents / 100).toFixed(2);
}
