-- CreateEnum
CREATE TYPE "BoardType" AS ENUM ('SHORTBOARD', 'FISH', 'FUNBOARD', 'MID_LENGTH', 'LONGBOARD', 'GUN', 'FOIL', 'OTHER');

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shaper" TEXT,
    "boardType" "BoardType" NOT NULL DEFAULT 'SHORTBOARD',
    "lengthStr" TEXT,
    "widthStr" TEXT,
    "thicknessStr" TEXT,
    "volumeL" DOUBLE PRECISION,
    "purchasedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Board_userId_createdAt_idx" ON "Board"("userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
