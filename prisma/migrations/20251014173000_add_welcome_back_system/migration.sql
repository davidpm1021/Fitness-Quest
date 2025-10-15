-- Add welcome-back system fields to party_members table
-- This enables tracking of welcome-back buffs for players who return after missing 3+ days

-- Track if welcome-back buff is currently active
ALTER TABLE "party_members" ADD COLUMN "welcome_back_active" BOOLEAN NOT NULL DEFAULT false;

-- Track how many check-ins remain with the welcome-back bonus
ALTER TABLE "party_members" ADD COLUMN "welcome_back_remaining" INTEGER NOT NULL DEFAULT 0;

-- Track when the welcome-back buff was activated
ALTER TABLE "party_members" ADD COLUMN "welcome_back_activated_at" TIMESTAMP(3);

-- Track if user has acknowledged the welcome-back notification
ALTER TABLE "party_members" ADD COLUMN "welcome_back_acknowledged" BOOLEAN NOT NULL DEFAULT false;

-- Add index for efficient queries of active welcome-back buffs
CREATE INDEX "party_members_welcome_back_active_idx" ON "party_members"("welcome_back_active");

-- Add comment for documentation
COMMENT ON COLUMN "party_members"."welcome_back_active" IS 'Whether the welcome-back buff is currently active';
COMMENT ON COLUMN "party_members"."welcome_back_remaining" IS 'Number of check-ins remaining with welcome-back bonuses';
COMMENT ON COLUMN "party_members"."welcome_back_activated_at" IS 'Timestamp when welcome-back buff was activated';
COMMENT ON COLUMN "party_members"."welcome_back_acknowledged" IS 'Whether user has acknowledged the welcome-back notification';
