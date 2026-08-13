-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('SUGGESTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "RecommendedVideo" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "youtubeUrl" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "VideoStatus" NOT NULL DEFAULT 'SUGGESTED',
    "suggestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suggestedById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "RecommendedVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecommendedVideo_courseId_status_idx" ON "RecommendedVideo"("courseId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendedVideo_courseId_videoId_key" ON "RecommendedVideo"("courseId", "videoId");

-- AddForeignKey
ALTER TABLE "RecommendedVideo" ADD CONSTRAINT "RecommendedVideo_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendedVideo" ADD CONSTRAINT "RecommendedVideo_suggestedById_fkey" FOREIGN KEY ("suggestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendedVideo" ADD CONSTRAINT "RecommendedVideo_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
