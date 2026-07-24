"use server";

import { auth } from "@/auth";
import {
  BUDGET_CATEGORIES,
  isBudgetCategory,
  isSupportedBudgetCurrency,
  parseBudgetAmountToCents,
} from "@/lib/budget";
import { getTripDayCount } from "@/lib/date-format";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type BudgetActionResult =
  | { ok: true }
  | { ok: false; error: string };

function parseTravelerCount(value: FormDataEntryValue | null) {
  const travelerCount = Number(value);
  return Number.isInteger(travelerCount) &&
    travelerCount >= 1 &&
    travelerCount <= 100
    ? travelerCount
    : null;
}

function parseOptionalDayIndex(
  value: FormDataEntryValue | null,
  dayCount: number
) {
  if (typeof value !== "string" || value === "") {
    return { valid: true as const, dayIndex: null };
  }

  const dayIndex = Number(value);
  if (
    !Number.isInteger(dayIndex) ||
    dayIndex < 0 ||
    dayIndex >= dayCount
  ) {
    return { valid: false as const, dayIndex: null };
  }

  return { valid: true as const, dayIndex };
}

function parseOptionalUrl(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return { valid: true as const, url: null };
  }

  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { valid: false as const, url: null };
    }

    return { valid: true as const, url: url.toString() };
  } catch {
    return { valid: false as const, url: null };
  }
}

async function getOwnedTrip(tripId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  return prisma.trip.findFirst({
    where: { id: tripId, userId },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      budget: { select: { id: true } },
    },
  });
}

export async function saveTripBudget(
  tripId: string,
  formData: FormData
): Promise<BudgetActionResult> {
  const trip = await getOwnedTrip(tripId);
  if (!trip) {
    return { ok: false, error: "Trip not found or you are not signed in." };
  }

  const totalAmount = parseBudgetAmountToCents(formData.get("totalAmount"));
  const reserveAmount =
    parseBudgetAmountToCents(formData.get("reserveAmount")) ?? 0;
  const travelerCount = parseTravelerCount(formData.get("travelerCount"));
  const currencyValue = formData.get("currency")?.toString().toUpperCase();

  if (!totalAmount || !travelerCount) {
    return {
      ok: false,
      error: "Enter a total budget and a valid number of travelers.",
    };
  }

  if (!currencyValue || !isSupportedBudgetCurrency(currencyValue)) {
    return { ok: false, error: "Select a supported currency." };
  }

  if (reserveAmount > totalAmount) {
    return {
      ok: false,
      error: "The emergency reserve cannot exceed the total budget.",
    };
  }

  const allocations = BUDGET_CATEGORIES.map(({ key }) => ({
    category: key,
    amount: parseBudgetAmountToCents(formData.get(`allocation_${key}`)),
  }));

  if (allocations.some(({ amount }) => amount === null)) {
    return {
      ok: false,
      error: "Enter a valid amount for every budget category.",
    };
  }

  const allocatedAmount = allocations.reduce(
    (total, { amount }) => total + (amount ?? 0),
    0
  );

  if (allocatedAmount + reserveAmount > totalAmount) {
    return {
      ok: false,
      error:
        "Category allocations plus the reserve cannot exceed the total budget.",
    };
  }

  await prisma.$transaction(async (transaction) => {
    const budget = trip.budget
      ? await transaction.tripBudget.update({
          where: { id: trip.budget.id },
          data: {
            totalAmount,
            currency: currencyValue,
            travelerCount,
            reserveAmount,
          },
        })
      : await transaction.tripBudget.create({
          data: {
            tripId: trip.id,
            totalAmount,
            currency: currencyValue,
            travelerCount,
            reserveAmount,
          },
        });

    for (const allocation of allocations) {
      await transaction.budgetAllocation.upsert({
        where: {
          budgetId_category: {
            budgetId: budget.id,
            category: allocation.category,
          },
        },
        update: { amount: allocation.amount ?? 0 },
        create: {
          budgetId: budget.id,
          category: allocation.category,
          amount: allocation.amount ?? 0,
        },
      });
    }
  });

  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}

interface ParsedBudgetItem {
  name: string;
  category: string;
  plannedAmount: number;
  actualAmount: number | null;
  dayIndex: number | null;
  notes: string | null;
  url: string | null;
}

function parseBudgetItem(
  formData: FormData,
  dayCount: number
): { ok: true; item: ParsedBudgetItem } | { ok: false; error: string } {
  const name = formData.get("name")?.toString().trim() ?? "";
  const category = formData.get("category")?.toString() ?? "";
  const plannedAmount = parseBudgetAmountToCents(
    formData.get("plannedAmount")
  );
  const actualValue = formData.get("actualAmount");
  const actualAmount =
    typeof actualValue === "string" && actualValue.trim() === ""
      ? null
      : parseBudgetAmountToCents(actualValue);
  const parsedDay = parseOptionalDayIndex(
    formData.get("dayIndex"),
    dayCount
  );
  const parsedUrl = parseOptionalUrl(formData.get("url"));
  const notes = formData.get("notes")?.toString().trim() || null;

  if (!name || name.length > 120) {
    return {
      ok: false,
      error: "Enter an expense name no longer than 120 characters.",
    };
  }

  if (!isBudgetCategory(category)) {
    return { ok: false, error: "Select a valid expense category." };
  }

  if (plannedAmount === null || actualAmount === null && actualValue !== null &&
    typeof actualValue === "string" && actualValue.trim() !== "") {
    return { ok: false, error: "Enter valid planned and actual amounts." };
  }

  if (!parsedDay.valid) {
    return { ok: false, error: "Select a valid trip day." };
  }

  if (!parsedUrl.valid) {
    return {
      ok: false,
      error: "Booking links must start with http:// or https://.",
    };
  }

  if (notes && notes.length > 500) {
    return { ok: false, error: "Notes cannot exceed 500 characters." };
  }

  return {
    ok: true,
    item: {
      name,
      category,
      plannedAmount,
      actualAmount,
      dayIndex: parsedDay.dayIndex,
      notes,
      url: parsedUrl.url,
    },
  };
}

export async function createBudgetItem(
  tripId: string,
  formData: FormData
): Promise<BudgetActionResult> {
  const trip = await getOwnedTrip(tripId);
  if (!trip?.budget) {
    return { ok: false, error: "Set up the trip budget first." };
  }

  const parsed = parseBudgetItem(
    formData,
    getTripDayCount(trip.startDate, trip.endDate)
  );
  if (!parsed.ok) {
    return parsed;
  }

  await prisma.budgetItem.create({
    data: {
      budgetId: trip.budget.id,
      ...parsed.item,
    },
  });

  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}

export async function updateBudgetItem(
  tripId: string,
  itemId: string,
  formData: FormData
): Promise<BudgetActionResult> {
  const trip = await getOwnedTrip(tripId);
  if (!trip?.budget) {
    return { ok: false, error: "Trip budget not found." };
  }

  const existingItem = await prisma.budgetItem.findFirst({
    where: { id: itemId, budgetId: trip.budget.id },
    select: {
      id: true,
      location: { select: { dayIndex: true } },
    },
  });

  if (!existingItem) {
    return { ok: false, error: "Expense not found." };
  }

  const parsed = parseBudgetItem(
    formData,
    getTripDayCount(trip.startDate, trip.endDate)
  );
  if (!parsed.ok) {
    return parsed;
  }

  await prisma.budgetItem.update({
    where: { id: existingItem.id },
    data: {
      ...parsed.item,
      dayIndex: existingItem.location
        ? existingItem.location.dayIndex
        : parsed.item.dayIndex,
    },
  });

  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}

export async function deleteBudgetItem(
  tripId: string,
  itemId: string
): Promise<BudgetActionResult> {
  const trip = await getOwnedTrip(tripId);
  if (!trip?.budget) {
    return { ok: false, error: "Trip budget not found." };
  }

  const result = await prisma.budgetItem.deleteMany({
    where: { id: itemId, budgetId: trip.budget.id },
  });

  if (result.count === 0) {
    return { ok: false, error: "Expense not found." };
  }

  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}
