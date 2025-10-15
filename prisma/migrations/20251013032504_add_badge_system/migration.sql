-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('FIRST_MONSTER', 'THREE_MONSTERS', 'TEN_MONSTERS', 'TWENTY_MONSTERS', 'WEEK_STREAK', 'TWO_WEEK_STREAK', 'MONTH_STREAK', 'HUNDRED_DAY_STREAK', 'PERFECT_WEEK', 'PERFECT_MONTH', 'GOAL_MASTER', 'SUPPORT_HERO', 'HEALER', 'DEFENDER', 'CRITICAL_HERO', 'FOCUS_MASTER', 'HEROIC_WARRIOR', 'EARLY_BIRD', 'NIGHT_OWL', 'COMEBACK_KID');

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_type" "BadgeType" NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "victory_rewards" (
    "id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "monster_id" TEXT NOT NULL,
    "defeated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "days_to_defeat" INTEGER NOT NULL,
    "total_damage_dealt" INTEGER NOT NULL,
    "total_heals" INTEGER NOT NULL,
    "mvp_consistent" TEXT,
    "mvp_supportive" TEXT,
    "mvp_damage" TEXT,
    "badges_awarded" JSONB[] DEFAULT ARRAY[]::JSONB[],

    CONSTRAINT "victory_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "badges_user_id_idx" ON "badges"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "badges_user_id_badge_type_key" ON "badges"("user_id", "badge_type");

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
