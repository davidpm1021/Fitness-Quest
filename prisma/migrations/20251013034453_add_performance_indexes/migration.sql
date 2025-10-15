-- CreateIndex
CREATE INDEX "check_ins_party_id_idx" ON "check_ins"("party_id");

-- CreateIndex
CREATE INDEX "check_ins_party_id_check_in_date_idx" ON "check_ins"("party_id", "check_in_date");

-- CreateIndex
CREATE INDEX "monsters_is_defeated_idx" ON "monsters"("is_defeated");

-- CreateIndex
CREATE INDEX "party_members_party_id_idx" ON "party_members"("party_id");

-- CreateIndex
CREATE INDEX "party_members_user_id_idx" ON "party_members"("user_id");

-- CreateIndex
CREATE INDEX "party_monsters_party_id_is_active_idx" ON "party_monsters"("party_id", "is_active");
