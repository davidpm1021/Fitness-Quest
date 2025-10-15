-- CreateEnum
CREATE TYPE "CosmeticCategory" AS ENUM ('HAIR', 'CLOTHING', 'ACCESSORY', 'WEAPON', 'COLOR_PALETTE');

-- CreateEnum
CREATE TYPE "UnlockConditionType" AS ENUM ('CHECK_IN_COUNT', 'STREAK_DAYS', 'MONSTERS_DEFEATED', 'FOCUS_POINTS', 'STARTER_ITEM');

-- CreateTable
CREATE TABLE "cosmetic_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "CosmeticCategory" NOT NULL,
    "sprite_sheet_path" TEXT NOT NULL,
    "unlock_condition_type" "UnlockConditionType" NOT NULL,
    "unlock_threshold" INTEGER NOT NULL DEFAULT 0,
    "is_starter_item" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cosmetic_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_cosmetic_unlocks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cosmetic_item_id" TEXT NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_cosmetic_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sprite_customizations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "base_sprite_path" TEXT NOT NULL,
    "hair_sprite_path" TEXT,
    "clothing_sprite_path" TEXT,
    "accessory_sprite_path" TEXT,
    "weapon_sprite_path" TEXT,
    "hair_tint_color" TEXT,
    "clothing_tint_color" TEXT,
    "accessory_tint_color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sprite_customizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_cosmetic_unlocks_user_id_cosmetic_item_id_key" ON "user_cosmetic_unlocks"("user_id", "cosmetic_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_sprite_customizations_user_id_key" ON "user_sprite_customizations"("user_id");

-- AddForeignKey
ALTER TABLE "user_cosmetic_unlocks" ADD CONSTRAINT "user_cosmetic_unlocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_cosmetic_unlocks" ADD CONSTRAINT "user_cosmetic_unlocks_cosmetic_item_id_fkey" FOREIGN KEY ("cosmetic_item_id") REFERENCES "cosmetic_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sprite_customizations" ADD CONSTRAINT "user_sprite_customizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
