-- CreateEnum
CREATE TYPE "CombatAction" AS ENUM ('ATTACK', 'DEFEND', 'SUPPORT', 'HEROIC_STRIKE');

-- AlterTable
ALTER TABLE "check_ins" ADD COLUMN     "combat_action" "CombatAction" NOT NULL DEFAULT 'ATTACK',
ADD COLUMN     "focus_earned" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "party_members" ADD COLUMN     "focus_points" INTEGER NOT NULL DEFAULT 0;
