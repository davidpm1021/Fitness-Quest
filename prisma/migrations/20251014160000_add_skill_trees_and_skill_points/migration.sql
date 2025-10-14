-- CreateEnum
CREATE TYPE "SkillType" AS ENUM ('PASSIVE', 'ACTIVE', 'MODIFIER');

-- CreateEnum
CREATE TYPE "SkillEffectType" AS ENUM ('DAMAGE_BOOST', 'HP_BOOST', 'MAX_HP_BOOST', 'DEFENSE_BOOST', 'FOCUS_REGEN', 'FOCUS_MAX_BOOST', 'HEALING_BOOST', 'COUNTERATTACK_REDUCTION', 'CRITICAL_CHANCE', 'STREAK_PROTECTION', 'TEAM_DAMAGE_BOOST', 'TEAM_DEFENSE_BOOST', 'XP_BOOST');

-- AlterTable
ALTER TABLE "party_members" ADD COLUMN     "skill_points" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "skill_trees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_trees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "skill_tree_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "skill_type" "SkillType" NOT NULL,
    "effect_type" "SkillEffectType" NOT NULL,
    "effect_value" DOUBLE PRECISION NOT NULL,
    "prerequisite_skill_id" TEXT,
    "required_level" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_member_skills" (
    "id" TEXT NOT NULL,
    "party_member_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "party_member_skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skill_trees_name_key" ON "skill_trees"("name");

-- CreateIndex
CREATE INDEX "skills_skill_tree_id_idx" ON "skills"("skill_tree_id");

-- CreateIndex
CREATE INDEX "skills_tier_idx" ON "skills"("tier");

-- CreateIndex
CREATE INDEX "party_member_skills_party_member_id_idx" ON "party_member_skills"("party_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "party_member_skills_party_member_id_skill_id_key" ON "party_member_skills"("party_member_id", "skill_id");

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_skill_tree_id_fkey" FOREIGN KEY ("skill_tree_id") REFERENCES "skill_trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_prerequisite_skill_id_fkey" FOREIGN KEY ("prerequisite_skill_id") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_member_skills" ADD CONSTRAINT "party_member_skills_party_member_id_fkey" FOREIGN KEY ("party_member_id") REFERENCES "party_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_member_skills" ADD CONSTRAINT "party_member_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
