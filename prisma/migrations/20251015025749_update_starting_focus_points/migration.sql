-- AlterTable
ALTER TABLE "party_members" ALTER COLUMN "focus_points" SET DEFAULT 5;

-- Update existing users with 0 focus to have 5 (new default)
UPDATE "party_members" SET "focus_points" = 5 WHERE "focus_points" = 0;
