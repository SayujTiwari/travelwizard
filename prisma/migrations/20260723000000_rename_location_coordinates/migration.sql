-- Align the original Location table with the current Prisma model.
-- Renaming preserves any destinations that have already been created.
ALTER TABLE "public"."Location" RENAME COLUMN "latitude" TO "lat";
ALTER TABLE "public"."Location" RENAME COLUMN "longitude" TO "lng";
