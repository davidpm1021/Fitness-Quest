-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('CHAT', 'ENCOURAGEMENT', 'SYSTEM');

-- CreateTable
CREATE TABLE "party_messages" (
    "id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "message_type" "MessageType" NOT NULL DEFAULT 'CHAT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "party_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "party_messages_party_id_created_at_idx" ON "party_messages"("party_id", "created_at");

-- AddForeignKey
ALTER TABLE "party_messages" ADD CONSTRAINT "party_messages_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_messages" ADD CONSTRAINT "party_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
