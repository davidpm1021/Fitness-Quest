-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('WEIGHT', 'CARDIO', 'STRENGTH', 'PROTEIN', 'SLEEP', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MonsterType" AS ENUM ('TANK', 'BALANCED', 'GLASS_CANNON');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('MUSCLE', 'FIRE', 'STAR', 'CLAP');

-- CreateEnum
CREATE TYPE "HealingType" AS ENUM ('QUICK', 'DEEP');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "invite_code" TEXT NOT NULL,
    "check_in_start_hour" INTEGER NOT NULL DEFAULT 18,
    "check_in_end_hour" INTEGER NOT NULL DEFAULT 24,
    "morning_report_hour" INTEGER NOT NULL DEFAULT 6,
    "active_monster_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_members" (
    "id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_hp" INTEGER NOT NULL DEFAULT 100,
    "max_hp" INTEGER NOT NULL DEFAULT 100,
    "current_defense" INTEGER NOT NULL DEFAULT 0,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "party_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "goal_type" "GoalType" NOT NULL,
    "name" TEXT NOT NULL,
    "target_value" DOUBLE PRECISION,
    "target_unit" TEXT,
    "flex_percentage" INTEGER NOT NULL DEFAULT 10,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "party_member_id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "check_in_date" DATE NOT NULL,
    "goals_met" INTEGER NOT NULL DEFAULT 0,
    "is_rest_day" BOOLEAN NOT NULL DEFAULT false,
    "attack_roll" INTEGER NOT NULL,
    "attack_bonus" INTEGER NOT NULL,
    "damage_dealt" INTEGER NOT NULL,
    "was_hit_by_monster" BOOLEAN NOT NULL DEFAULT false,
    "damage_taken" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_check_ins" (
    "id" TEXT NOT NULL,
    "check_in_id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "actual_value" DOUBLE PRECISION,
    "target_value" DOUBLE PRECISION,
    "was_met" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monsters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "monster_type" "MonsterType" NOT NULL,
    "max_hp" INTEGER NOT NULL,
    "current_hp" INTEGER NOT NULL,
    "armor_class" INTEGER NOT NULL,
    "base_damage" INTEGER[],
    "counterattack_chance" INTEGER NOT NULL,
    "is_defeated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "defeated_at" TIMESTAMP(3),

    CONSTRAINT "monsters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_monsters" (
    "id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "monster_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "party_monsters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encouragements" (
    "id" TEXT NOT NULL,
    "from_user_id" TEXT NOT NULL,
    "to_party_member_id" TEXT NOT NULL,
    "check_in_id" TEXT,
    "reaction_type" "ReactionType" NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encouragements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "healing_actions" (
    "id" TEXT NOT NULL,
    "from_party_member_id" TEXT NOT NULL,
    "to_party_member_id" TEXT NOT NULL,
    "healing_type" "HealingType" NOT NULL,
    "hp_restored" INTEGER NOT NULL,
    "action_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "healing_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "parties_invite_code_key" ON "parties"("invite_code");

-- CreateIndex
CREATE INDEX "parties_invite_code_idx" ON "parties"("invite_code");

-- CreateIndex
CREATE UNIQUE INDEX "party_members_party_id_user_id_key" ON "party_members"("party_id", "user_id");

-- CreateIndex
CREATE INDEX "check_ins_check_in_date_idx" ON "check_ins"("check_in_date");

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_party_member_id_check_in_date_key" ON "check_ins"("party_member_id", "check_in_date");

-- AddForeignKey
ALTER TABLE "party_members" ADD CONSTRAINT "party_members_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_members" ADD CONSTRAINT "party_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_party_member_id_fkey" FOREIGN KEY ("party_member_id") REFERENCES "party_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_check_ins" ADD CONSTRAINT "goal_check_ins_check_in_id_fkey" FOREIGN KEY ("check_in_id") REFERENCES "check_ins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_check_ins" ADD CONSTRAINT "goal_check_ins_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_monsters" ADD CONSTRAINT "party_monsters_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_monsters" ADD CONSTRAINT "party_monsters_monster_id_fkey" FOREIGN KEY ("monster_id") REFERENCES "monsters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encouragements" ADD CONSTRAINT "encouragements_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encouragements" ADD CONSTRAINT "encouragements_to_party_member_id_fkey" FOREIGN KEY ("to_party_member_id") REFERENCES "party_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encouragements" ADD CONSTRAINT "encouragements_check_in_id_fkey" FOREIGN KEY ("check_in_id") REFERENCES "check_ins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "healing_actions" ADD CONSTRAINT "healing_actions_from_party_member_id_fkey" FOREIGN KEY ("from_party_member_id") REFERENCES "party_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "healing_actions" ADD CONSTRAINT "healing_actions_to_party_member_id_fkey" FOREIGN KEY ("to_party_member_id") REFERENCES "party_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
