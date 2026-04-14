-- CreateEnum
CREATE TYPE "SpeedUnit" AS ENUM ('KNOTS', 'KMH', 'MPH');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "speedUnit" "SpeedUnit" NOT NULL DEFAULT 'KNOTS';
