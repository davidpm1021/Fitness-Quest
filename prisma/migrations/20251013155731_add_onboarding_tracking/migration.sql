-- AlterTable
ALTER TABLE "users" ADD COLUMN     "character_name" TEXT,
ADD COLUMN     "onboarding_completed_at" TIMESTAMP(3),
ADD COLUMN     "onboarding_step" TEXT NOT NULL DEFAULT 'character';
