/*
  Warnings:

  - You are about to drop the column `courseId` on the `ClassSession` table. All the data in the column will be lost.
  - You are about to drop the column `dayOfWeek` on the `ClassSession` table. All the data in the column will be lost.
  - You are about to drop the column `lecturer` on the `ClassSession` table. All the data in the column will be lost.
  - You are about to drop the column `room` on the `ClassSession` table. All the data in the column will be lost.
  - You are about to drop the column `sourceResourceId` on the `ClassSession` table. All the data in the column will be lost.
  - Added the required column `academicPeriod` to the `ClassSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `courseCode` to the `ClassSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `courseTitle` to the `ClassSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `ClassSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `levelScope` to the `ClassSession` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ClassSession" DROP CONSTRAINT "ClassSession_courseId_fkey";

-- DropForeignKey
ALTER TABLE "ClassSession" DROP CONSTRAINT "ClassSession_sourceResourceId_fkey";

-- DropIndex
DROP INDEX "ClassSession_courseId_status_idx";

-- AlterTable
ALTER TABLE "ClassSession" DROP COLUMN "courseId",
DROP COLUMN "dayOfWeek",
DROP COLUMN "lecturer",
DROP COLUMN "room",
DROP COLUMN "sourceResourceId",
ADD COLUMN     "academicPeriod" TEXT NOT NULL,
ADD COLUMN     "courseCode" TEXT NOT NULL,
ADD COLUMN     "courseTitle" TEXT NOT NULL,
ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "levelScope" INTEGER NOT NULL,
ADD COLUMN     "sourceUploadId" INTEGER,
ADD COLUMN     "venue" TEXT;

-- DropEnum
DROP TYPE "DayOfWeek";

-- CreateTable
CREATE TABLE "TimetableUpload" (
    "id" SERIAL NOT NULL,
    "levelScope" INTEGER NOT NULL,
    "academicPeriod" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimetableUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimetableUpload_levelScope_academicPeriod_idx" ON "TimetableUpload"("levelScope", "academicPeriod");

-- CreateIndex
CREATE INDEX "ClassSession_levelScope_status_idx" ON "ClassSession"("levelScope", "status");

-- CreateIndex
CREATE INDEX "ClassSession_levelScope_academicPeriod_idx" ON "ClassSession"("levelScope", "academicPeriod");

-- AddForeignKey
ALTER TABLE "TimetableUpload" ADD CONSTRAINT "TimetableUpload_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_sourceUploadId_fkey" FOREIGN KEY ("sourceUploadId") REFERENCES "TimetableUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
