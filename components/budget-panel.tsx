"use client";

import {
  BudgetActionResult,
  createBudgetItem,
  deleteBudgetItem,
  saveTripBudget,
  updateBudgetItem,
} from "@/lib/actions/budget";
import {
  BUDGET_CATEGORIES,
  BudgetCategory,
  SUPPORTED_BUDGET_CURRENCIES,
  centsToInputValue,
  formatBudgetAmount,
} from "@/lib/budget";
import {
  formatTripDate,
  getTripDayCount,
  getTripDayDate,
} from "@/lib/date-format";
import {
  BedDouble,
  BusFront,
  CalendarDays,
  ExternalLink,
  LoaderCircle,
  Pencil,
  PiggyBank,
  Plus,
  ReceiptText,
  ShoppingBag,
  Ticket,
  Trash2,
  Utensils,
  WalletCards,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button } from "./ui/button";

export interface TripBudgetData {
  id: string;
  totalAmount: number;
  currency: string;
  travelerCount: number;
  reserveAmount: number;
  allocations: Array<{
    id: string;
    category: string;
    amount: number;
  }>;
  items: Array<{
    id: string;
    name: string;
    category: string;
    plannedAmount: number;
    actualAmount: number | null;
    dayIndex: number | null;
    notes: string | null;
    url: string | null;
    locationId: string | null;
    location: {
      id: string;
      locationTitle: string;
      dayIndex: number | null;
    } | null;
  }>;
}

const CATEGORY_STYLES: Record<
  BudgetCategory,
  {
    icon: typeof BedDouble;
    bar: string;
    iconBackground: string;
    iconColor: string;
  }
> = {
  lodging: {
    icon: BedDouble,
    bar: "bg-indigo-500",
    iconBackground: "bg-indigo-100",
    iconColor: "text-indigo-700",
  },
  transportation: {
    icon: BusFront,
    bar: "bg-sky-500",
    iconBackground: "bg-sky-100",
    iconColor: "text-sky-700",
  },
  food: {
    icon: Utensils,
    bar: "bg-orange-500",
    iconBackground: "bg-orange-100",
    iconColor: "text-orange-700",
  },
  activities: {
    icon: Ticket,
    bar: "bg-emerald-500",
    iconBackground: "bg-emerald-100",
    iconColor: "text-emerald-700",
  },
  miscellaneous: {
    icon: ShoppingBag,
    bar: "bg-violet-500",
    iconBackground: "bg-violet-100",
    iconColor: "text-violet-700",
  },
};

function allocationValuesFor(
  totalValue: string,
  reserveValue: string
): Record<BudgetCategory, string> {
  const total = Math.max(0, Number(totalValue) || 0);
  const reserve = Math.max(0, Number(reserveValue) || 0);
  const available = Math.max(0, total - reserve);

  return Object.fromEntries(
    BUDGET_CATEGORIES.map(({ key, suggestedPercent }) => [
      key,
      ((available * suggestedPercent) / 100).toFixed(2),
    ])
  ) as Record<BudgetCategory, string>;
}

function Feedback({
  message,
}: {
  message: { tone: "success" | "error"; text: string } | null;
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      role={message.tone === "error" ? "alert" : "status"}
      className={`rounded-lg border px-3 py-2 text-sm ${
        message.tone === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {message.text}
    </p>
  );
}

function BudgetSetupForm({
  tripId,
  budget,
  onCancel,
}: {
  tripId: string;
  budget: TripBudgetData | null;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [total, setTotal] = useState(
    budget ? centsToInputValue(budget.totalAmount) : ""
  );
  const [reserve, setReserve] = useState(
    budget ? centsToInputValue(budget.reserveAmount) : "0.00"
  );
  const [allocations, setAllocations] = useState<
    Record<BudgetCategory, string>
  >(() =>
    Object.fromEntries(
      BUDGET_CATEGORIES.map(({ key }) => [
        key,
        budget
          ? centsToInputValue(
              budget.allocations.find(
                (allocation) => allocation.category === key
              )?.amount ?? 0
            )
          : "",
      ])
    ) as Record<BudgetCategory, string>
  );

  const applySuggestedSplit = () => {
    setAllocations(allocationValuesFor(total, reserve));
  };

  const handleResult = (result: BudgetActionResult) => {
    if (!result.ok) {
      setMessage({ tone: "error", text: result.error });
      return;
    }

    setMessage({ tone: "success", text: "Trip budget saved." });
    router.refresh();
    onCancel?.();
  };

  return (
    <form
      className="space-y-6"
      action={(formData) => {
        setMessage(null);
        startTransition(async () => {
          handleResult(await saveTripBudget(tripId, formData));
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="budget-total"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Total budget
          </label>
          <input
            id="budget-total"
            name="totalAmount"
            type="number"
            min="0.01"
            max="20000000"
            step="0.01"
            value={total}
            onChange={(event) => {
              const nextTotal = event.target.value;
              setTotal(nextTotal);
              if (!budget) {
                setAllocations(allocationValuesFor(nextTotal, reserve));
              }
            }}
            required
            placeholder="2000.00"
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label
            htmlFor="budget-currency"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Currency
          </label>
          <select
            id="budget-currency"
            name="currency"
            defaultValue={budget?.currency ?? "CAD"}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {SUPPORTED_BUDGET_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="budget-travelers"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Travelers
          </label>
          <input
            id="budget-travelers"
            name="travelerCount"
            type="number"
            min="1"
            max="100"
            step="1"
            defaultValue={budget?.travelerCount ?? 1}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label
            htmlFor="budget-reserve"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Emergency reserve
          </label>
          <input
            id="budget-reserve"
            name="reserveAmount"
            type="number"
            min="0"
            max="20000000"
            step="0.01"
            value={reserve}
            onChange={(event) => {
              const nextReserve = event.target.value;
              setReserve(nextReserve);
              if (!budget) {
                setAllocations(allocationValuesFor(total, nextReserve));
              }
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={applySuggestedSplit}
          disabled={!total}
        >
          <PiggyBank aria-hidden="true" />
          Apply suggested split
        </Button>
      </div>

      <div>
        <div className="mb-3">
          <h3 className="font-semibold text-slate-900">Category allocations</h3>
          <p className="text-sm text-slate-500">
            These are spending targets, not expenses.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {BUDGET_CATEGORIES.map(({ key, label, suggestedPercent }) => {
            const style = CATEGORY_STYLES[key];
            const Icon = style.icon;

            return (
              <label
                key={key}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Icon className={`h-4 w-4 ${style.iconColor}`} />
                  {label}
                  <span className="ml-auto text-xs font-normal text-slate-400">
                    Suggested {suggestedPercent}%
                  </span>
                </span>
                <input
                  name={`allocation_${key}`}
                  type="number"
                  min="0"
                  max="20000000"
                  step="0.01"
                  value={allocations[key]}
                  onChange={(event) =>
                    setAllocations((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  required
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </label>
            );
          })}
        </div>
      </div>

      <Feedback message={message} />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <LoaderCircle className="animate-spin" aria-hidden="true" />
              Saving
            </>
          ) : (
            "Save budget"
          )}
        </Button>
      </div>
    </form>
  );
}

function ExpenseForm({
  tripId,
  currency,
  dayCount,
  item,
  onDone,
}: {
  tripId: string;
  currency: string;
  dayCount: number;
  item?: TripBudgetData["items"][number];
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  return (
    <form
      className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5"
      action={(formData) => {
        setMessage(null);
        startTransition(async () => {
          const result = item
            ? await updateBudgetItem(tripId, item.id, formData)
            : await createBudgetItem(tripId, formData);

          if (!result.ok) {
            setMessage({ tone: "error", text: result.error });
            return;
          }

          router.refresh();
          onDone();
        });
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">
            {item ? "Edit expense" : "Add an expense"}
          </h3>
          <p className="text-sm text-slate-500">
            Record an estimate now and the actual amount whenever it is paid.
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onDone}>
          <X aria-label="Close expense form" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Expense name
          </label>
          <input
            name="name"
            required
            maxLength={120}
            defaultValue={item?.name}
            placeholder="Hotel, train tickets, dinner..."
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            name="category"
            defaultValue={item?.category ?? "lodging"}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {BUDGET_CATEGORIES.map(({ key, label }) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Trip day
          </label>
          {item?.location ? (
            <>
              <input
                type="hidden"
                name="dayIndex"
                value={item.location.dayIndex ?? ""}
              />
              <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600">
                {item.location.dayIndex === null
                  ? "Unscheduled"
                  : `Day ${item.location.dayIndex + 1}`}
                <span className="ml-1 text-xs text-slate-400">
                  (follows itinerary)
                </span>
              </div>
            </>
          ) : (
            <select
              name="dayIndex"
              defaultValue={
                item?.dayIndex === null || item?.dayIndex === undefined
                  ? ""
                  : String(item.dayIndex)
              }
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Whole trip / not scheduled</option>
              {Array.from({ length: dayCount }, (_, dayIndex) => (
                <option key={dayIndex} value={dayIndex}>
                  Day {dayIndex + 1}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Planned amount ({currency})
          </label>
          <input
            name="plannedAmount"
            type="number"
            min="0"
            max="20000000"
            step="0.01"
            required
            defaultValue={centsToInputValue(item?.plannedAmount)}
            placeholder="0.00"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Actual amount ({currency})
            <span className="ml-1 font-normal text-slate-400">(optional)</span>
          </label>
          <input
            name="actualAmount"
            type="number"
            min="0"
            max="20000000"
            step="0.01"
            defaultValue={centsToInputValue(item?.actualAmount)}
            placeholder="Enter after payment"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Booking or receipt link
            <span className="ml-1 font-normal text-slate-400">(optional)</span>
          </label>
          <input
            name="url"
            type="url"
            defaultValue={item?.url ?? ""}
            placeholder="https://..."
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Notes
            <span className="ml-1 font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            name="notes"
            maxLength={500}
            rows={3}
            defaultValue={item?.notes ?? ""}
            placeholder="Cancellation details, confirmation number, split between travelers..."
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <Feedback message={message} />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <LoaderCircle className="animate-spin" />
              Saving
            </>
          ) : item ? (
            "Save expense"
          ) : (
            "Add expense"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function BudgetPanel({
  tripId,
  startDate,
  endDate,
  budget,
}: {
  tripId: string;
  startDate: Date | string;
  endDate: Date | string;
  budget: TripBudgetData | null;
}) {
  const router = useRouter();
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const dayCount = getTripDayCount(startDate, endDate);

  const calculations = useMemo(() => {
    if (!budget) {
      return null;
    }

    const allocated = budget.allocations.reduce(
      (total, allocation) => total + allocation.amount,
      0
    );
    const planned = budget.items.reduce(
      (total, item) => total + item.plannedAmount,
      0
    );
    const spent = budget.items.reduce(
      (total, item) => total + (item.actualAmount ?? 0),
      0
    );
    const fixedPlanned = budget.items
      .filter(
        ({ category }) =>
          category === "lodging" || category === "transportation"
      )
      .reduce((total, item) => total + item.plannedAmount, 0);

    return {
      allocated,
      planned,
      spent,
      unallocated: budget.totalAmount - budget.reserveAmount - allocated,
      projectedRemaining: budget.totalAmount - planned,
      actualRemaining: budget.totalAmount - spent,
      dailyAllowance: Math.max(
        0,
        Math.floor(
          (budget.totalAmount - budget.reserveAmount - fixedPlanned) / dayCount
        )
      ),
    };
  }, [budget, dayCount]);

  if (!budget) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-sky-50 p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm">
            <WalletCards className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-2xl font-semibold text-slate-900">
            Plan the whole trip budget
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Set a total, choose spending targets, and track estimated and actual
            costs without leaving your itinerary.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-6">
          <BudgetSetupForm tripId={tripId} budget={null} />
        </div>
      </div>
    );
  }

  const currency = budget.currency;
  const editingItem = budget.items.find(({ id }) => id === editingItemId);

  const handleDelete = async (item: TripBudgetData["items"][number]) => {
    if (!window.confirm(`Delete “${item.name}” from this budget?`)) {
      return;
    }

    setDeletingItemId(item.id);
    setDeleteMessage(null);
    const result = await deleteBudgetItem(tripId, item.id);

    if (!result.ok) {
      setDeleteMessage(result.error);
    } else {
      router.refresh();
    }

    setDeletingItemId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Trip budget</h2>
          <p className="mt-1 text-sm text-slate-500">
            {budget.travelerCount}{" "}
            {budget.travelerCount === 1 ? "traveler" : "travelers"} ·{" "}
            {currency}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditingBudget((current) => !current)}
          >
            <Pencil aria-hidden="true" />
            Edit budget
          </Button>
          <Button
            type="button"
            onClick={() => {
              setEditingItemId(null);
              setIsAddingExpense(true);
            }}
          >
            <Plus aria-hidden="true" />
            Add expense
          </Button>
        </div>
      </div>

      {isEditingBudget && (
        <div className="rounded-2xl border border-slate-200 p-6">
          <BudgetSetupForm
            tripId={tripId}
            budget={budget}
            onCancel={() => setIsEditingBudget(false)}
          />
        </div>
      )}

      {calculations && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: "Total budget",
              value: budget.totalAmount,
              detail: `${formatBudgetAmount(
                budget.reserveAmount,
                currency
              )} held as reserve`,
            },
            {
              label: "Planned expenses",
              value: calculations.planned,
              detail: `${formatBudgetAmount(
                calculations.projectedRemaining,
                currency
              )} projected remaining`,
            },
            {
              label: "Actually spent",
              value: calculations.spent,
              detail: `${formatBudgetAmount(
                calculations.actualRemaining,
                currency
              )} actually remaining`,
            },
            {
              label: "Still unallocated",
              value: calculations.unallocated,
              detail: "After category targets and reserve",
            },
            {
              label: "Flexible daily allowance",
              value: calculations.dailyAllowance,
              detail: "After planned lodging, transport, and reserve",
            },
            {
              label: "Per traveler planned",
              value: Math.round(
                calculations.planned / budget.travelerCount
              ),
              detail: `Across ${budget.travelerCount} ${
                budget.travelerCount === 1 ? "traveler" : "travelers"
              }`,
            },
          ].map(({ label, value, detail }) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {label}
              </p>
              <p
                className={`mt-2 text-2xl font-bold ${
                  value < 0 ? "text-red-600" : "text-slate-900"
                }`}
              >
                {formatBudgetAmount(value, currency)}
              </p>
              <p className="mt-1 text-xs text-slate-500">{detail}</p>
            </div>
          ))}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900">
            Category targets
          </h3>
          <p className="text-sm text-slate-500">
            Planned costs are compared with the amount assigned to each
            category.
          </p>
        </div>
        <div className="space-y-5">
          {BUDGET_CATEGORIES.map(({ key, label }) => {
            const style = CATEGORY_STYLES[key];
            const Icon = style.icon;
            const allocated =
              budget.allocations.find(
                (allocation) => allocation.category === key
              )?.amount ?? 0;
            const planned = budget.items
              .filter((item) => item.category === key)
              .reduce((total, item) => total + item.plannedAmount, 0);
            const spent = budget.items
              .filter((item) => item.category === key)
              .reduce(
                (total, item) => total + (item.actualAmount ?? 0),
                0
              );
            const progress =
              allocated === 0 ? (planned > 0 ? 100 : 0) : (planned / allocated) * 100;

            return (
              <div key={key}>
                <div className="mb-2 flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${style.iconBackground} ${style.iconColor}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-medium text-slate-800">{label}</p>
                      <p className="text-sm text-slate-600">
                        {formatBudgetAmount(planned, currency)} planned of{" "}
                        {formatBudgetAmount(allocated, currency)}
                      </p>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${style.bar}`}
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-slate-500">
                      <span>{formatBudgetAmount(spent, currency)} spent</span>
                      <span
                        className={
                          planned > allocated ? "font-medium text-red-600" : ""
                        }
                      >
                        {planned > allocated
                          ? `${formatBudgetAmount(
                              planned - allocated,
                              currency
                            )} over target`
                          : `${formatBudgetAmount(
                              allocated - planned,
                              currency
                            )} available`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {(isAddingExpense || editingItem) && (
        <ExpenseForm
          key={editingItem?.id ?? "new"}
          tripId={tripId}
          currency={currency}
          dayCount={dayCount}
          item={editingItem}
          onDone={() => {
            setIsAddingExpense(false);
            setEditingItemId(null);
          }}
        />
      )}

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Expenses</h3>
            <p className="text-sm text-slate-500">
              Planned and actual costs for the whole trip.
            </p>
          </div>
          <ReceiptText className="h-5 w-5 text-slate-400" />
        </div>

        {deleteMessage && (
          <p className="m-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {deleteMessage}
          </p>
        )}

        {budget.items.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ReceiptText className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">
              No expenses added yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add lodging, transportation, meals, activities, or anything else
              you plan to pay for.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {budget.items.map((item) => {
              const category =
                BUDGET_CATEGORIES.find(({ key }) => key === item.category) ??
                BUDGET_CATEGORIES[BUDGET_CATEGORIES.length - 1];
              const style = CATEGORY_STYLES[category.key];
              const Icon = style.icon;
              const dayDate =
                item.dayIndex === null
                  ? null
                  : getTripDayDate(startDate, item.dayIndex);

              return (
                <article
                  key={item.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${style.iconBackground} ${style.iconColor}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-medium text-slate-900">{item.name}</h4>
                      {item.location && (
                        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                          Linked to itinerary
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>{category.label}</span>
                      <span>
                        {dayDate
                          ? `Day ${item.dayIndex! + 1} · ${formatTripDate(
                              dayDate
                            )}`
                          : "Whole trip"}
                      </span>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-teal-700 hover:underline"
                        >
                          Open link
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    {item.notes && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <div className="grid shrink-0 grid-cols-2 gap-x-5 text-right text-sm">
                    <div>
                      <p className="text-xs text-slate-400">Planned</p>
                      <p className="font-semibold text-slate-800">
                        {formatBudgetAmount(item.plannedAmount, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Actual</p>
                      <p className="font-semibold text-slate-800">
                        {item.actualAmount === null
                          ? "—"
                          : formatBudgetAmount(item.actualAmount, currency)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setIsAddingExpense(false);
                        setEditingItemId(item.id);
                      }}
                    >
                      <Pencil aria-label={`Edit ${item.name}`} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={deletingItemId === item.id}
                      onClick={() => handleDelete(item)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      {deletingItemId === item.id ? (
                        <LoaderCircle
                          className="animate-spin"
                          aria-label={`Deleting ${item.name}`}
                        />
                      ) : (
                        <Trash2 aria-label={`Delete ${item.name}`} />
                      )}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-teal-700" />
          <h3 className="text-lg font-semibold text-slate-900">
            Planned spending by day
          </h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: dayCount }, (_, dayIndex) => {
            const amount = budget.items
              .filter((item) => item.dayIndex === dayIndex)
              .reduce((total, item) => total + item.plannedAmount, 0);
            const date = getTripDayDate(startDate, dayIndex);

            return (
              <div
                key={dayIndex}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-sm font-medium text-slate-700">
                  Day {dayIndex + 1}
                </p>
                <p className="text-xs text-slate-500">
                  {formatTripDate(date)}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {formatBudgetAmount(amount, currency)}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
