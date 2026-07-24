-- Locations are ordered independently within each trip day.
-- Existing locations remain unscheduled until the user assigns them.
ALTER TABLE "public"."Location" ADD COLUMN "dayIndex" INTEGER;

CREATE INDEX "Location_tripId_dayIndex_order_idx"
ON "public"."Location"("tripId", "dayIndex", "order");
