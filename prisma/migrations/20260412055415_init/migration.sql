-- CreateEnum
CREATE TYPE "SessionSource" AS ENUM ('UPLOAD', 'STRAVA');

-- CreateEnum
CREATE TYPE "ProcessingState" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETE', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StravaToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "athleteId" INTEGER NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "webhookSubId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StravaToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurfSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "SessionSource" NOT NULL,
    "sourceId" TEXT,
    "title" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "distanceMeters" DOUBLE PRECISION NOT NULL,
    "maxSpeedMs" DOUBLE PRECISION NOT NULL,
    "avgSpeedMs" DOUBLE PRECISION NOT NULL,
    "waveCount" INTEGER NOT NULL DEFAULT 0,
    "rawFileKey" TEXT,
    "processingState" "ProcessingState" NOT NULL DEFAULT 'PENDING',
    "processingError" TEXT,
    "centerLat" DOUBLE PRECISION,
    "centerLng" DOUBLE PRECISION,
    "boundingBox" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SurfSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trackpoint" (
    "id" BIGSERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "altitudeM" DOUBLE PRECISION,
    "speedMs" DOUBLE PRECISION,
    "heartRate" INTEGER,

    CONSTRAINT "Trackpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wave" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "waveNumber" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "durationSeconds" DOUBLE PRECISION NOT NULL,
    "distanceMeters" DOUBLE PRECISION NOT NULL,
    "maxSpeedMs" DOUBLE PRECISION NOT NULL,
    "avgSpeedMs" DOUBLE PRECISION NOT NULL,
    "bearing" DOUBLE PRECISION,
    "startLat" DOUBLE PRECISION NOT NULL,
    "startLng" DOUBLE PRECISION NOT NULL,
    "endLat" DOUBLE PRECISION NOT NULL,
    "endLng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Wave_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "StravaToken_userId_key" ON "StravaToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StravaToken_athleteId_key" ON "StravaToken"("athleteId");

-- CreateIndex
CREATE INDEX "SurfSession_userId_startTime_idx" ON "SurfSession"("userId", "startTime" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "SurfSession_userId_source_sourceId_key" ON "SurfSession"("userId", "source", "sourceId");

-- CreateIndex
CREATE INDEX "Trackpoint_sessionId_recordedAt_idx" ON "Trackpoint"("sessionId", "recordedAt");

-- CreateIndex
CREATE INDEX "Wave_sessionId_idx" ON "Wave"("sessionId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StravaToken" ADD CONSTRAINT "StravaToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurfSession" ADD CONSTRAINT "SurfSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trackpoint" ADD CONSTRAINT "Trackpoint_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SurfSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wave" ADD CONSTRAINT "Wave_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SurfSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
