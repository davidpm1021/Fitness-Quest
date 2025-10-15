-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('SLIM', 'AVERAGE', 'MUSCULAR', 'BULKY');

-- CreateEnum
CREATE TYPE "HairStyle" AS ENUM ('SHORT', 'MEDIUM', 'LONG', 'BALD', 'PONYTAIL', 'MOHAWK', 'AFRO');

-- CreateEnum
CREATE TYPE "FacialHair" AS ENUM ('NONE', 'STUBBLE', 'BEARD', 'GOATEE', 'MUSTACHE');

-- CreateEnum
CREATE TYPE "Outfit" AS ENUM ('CASUAL', 'ATHLETIC', 'ARMOR', 'NINJA', 'WIZARD', 'KNIGHT');

-- CreateTable
CREATE TABLE "character_appearances" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "body_type" "BodyType" NOT NULL DEFAULT 'AVERAGE',
    "skin_color" TEXT NOT NULL DEFAULT '#fbbf24',
    "hair_style" "HairStyle" NOT NULL DEFAULT 'SHORT',
    "hair_color" TEXT NOT NULL DEFAULT '#92400e',
    "facial_hair" "FacialHair" NOT NULL DEFAULT 'NONE',
    "outfit" "Outfit" NOT NULL DEFAULT 'CASUAL',
    "outfit_color" TEXT NOT NULL DEFAULT '#3b82f6',
    "accessory_color" TEXT DEFAULT '#9ca3af',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_appearances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "character_appearances_user_id_key" ON "character_appearances"("user_id");

-- AddForeignKey
ALTER TABLE "character_appearances" ADD CONSTRAINT "character_appearances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
