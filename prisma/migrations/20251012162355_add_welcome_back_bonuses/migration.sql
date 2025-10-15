-- CreateTable
CREATE TABLE "welcome_back_bonuses" (
    "id" TEXT NOT NULL,
    "party_member_id" TEXT NOT NULL,
    "days_absent" INTEGER NOT NULL,
    "hp_restored" INTEGER NOT NULL,
    "bonus_check_ins_remaining" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "welcome_back_bonuses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "welcome_back_bonuses" ADD CONSTRAINT "welcome_back_bonuses_party_member_id_fkey" FOREIGN KEY ("party_member_id") REFERENCES "party_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
