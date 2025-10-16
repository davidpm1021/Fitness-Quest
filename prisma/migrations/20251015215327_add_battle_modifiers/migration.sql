-- CreateEnum
CREATE TYPE "BattleModifierType" AS ENUM ('INSPIRED', 'EXHAUSTED', 'FOCUSED', 'STURDY', 'WEAKENED', 'BLESSED', 'CURSED', 'PRECISE', 'CLUMSY', 'ENRAGED', 'FEARFUL', 'DETERMINED');

-- CreateEnum
CREATE TYPE "BattleModifierCategory" AS ENUM ('POSITIVE', 'NEGATIVE', 'NEUTRAL');

-- CreateTable
CREATE TABLE "battle_modifiers" (
    "id" TEXT NOT NULL,
    "party_monster_id" TEXT NOT NULL,
    "modifier_type" "BattleModifierType" NOT NULL,
    "modifier_category" "BattleModifierCategory" NOT NULL,
    "effect_description" TEXT NOT NULL,
    "stat_effect" TEXT,
    "effect_value" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "battle_modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "battle_modifiers_party_monster_id_idx" ON "battle_modifiers"("party_monster_id");

-- AddForeignKey
ALTER TABLE "battle_modifiers" ADD CONSTRAINT "battle_modifiers_party_monster_id_fkey" FOREIGN KEY ("party_monster_id") REFERENCES "party_monsters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
