CREATE TABLE "public"."TripBudget" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "travelerCount" INTEGER NOT NULL DEFAULT 1,
    "reserveAmount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripBudget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."BudgetAllocation" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "BudgetAllocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."BudgetItem" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "plannedAmount" INTEGER NOT NULL,
    "actualAmount" INTEGER,
    "dayIndex" INTEGER,
    "notes" TEXT,
    "url" TEXT,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TripBudget_tripId_key"
ON "public"."TripBudget"("tripId");

CREATE UNIQUE INDEX "BudgetAllocation_budgetId_category_key"
ON "public"."BudgetAllocation"("budgetId", "category");

CREATE UNIQUE INDEX "BudgetItem_locationId_key"
ON "public"."BudgetItem"("locationId");

CREATE INDEX "BudgetItem_budgetId_category_idx"
ON "public"."BudgetItem"("budgetId", "category");

CREATE INDEX "BudgetItem_budgetId_dayIndex_idx"
ON "public"."BudgetItem"("budgetId", "dayIndex");

ALTER TABLE "public"."TripBudget"
ADD CONSTRAINT "TripBudget_tripId_fkey"
FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."BudgetAllocation"
ADD CONSTRAINT "BudgetAllocation_budgetId_fkey"
FOREIGN KEY ("budgetId") REFERENCES "public"."TripBudget"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."BudgetItem"
ADD CONSTRAINT "BudgetItem_budgetId_fkey"
FOREIGN KEY ("budgetId") REFERENCES "public"."TripBudget"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."BudgetItem"
ADD CONSTRAINT "BudgetItem_locationId_fkey"
FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
