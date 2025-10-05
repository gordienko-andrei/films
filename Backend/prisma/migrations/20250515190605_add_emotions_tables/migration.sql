/*
  Warnings:

  - The primary key for the `Movie` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "MovieCollection" DROP CONSTRAINT "MovieCollection_movieId_fkey";

-- DropForeignKey
ALTER TABLE "MovieTag" DROP CONSTRAINT "MovieTag_movieId_fkey";

-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_movieId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_movieId_fkey";

-- AlterTable
ALTER TABLE "Movie" DROP CONSTRAINT "Movie_pkey",
ADD COLUMN     "posterPath" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Movie_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Movie_id_seq";

-- AlterTable
ALTER TABLE "MovieCollection" ALTER COLUMN "movieId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "MovieTag" ALTER COLUMN "movieId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Rating" ALTER COLUMN "movieId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "movieId" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "emotions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_emotions" (
    "filmId" TEXT NOT NULL,
    "emotionId" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "film_emotions_pkey" PRIMARY KEY ("filmId","emotionId")
);

-- CreateTable
CREATE TABLE "user_emotions" (
    "userId" INTEGER NOT NULL,
    "filmId" TEXT NOT NULL,
    "emotionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_emotions_pkey" PRIMARY KEY ("userId","filmId","emotionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "emotions_slug_key" ON "emotions"("slug");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieTag" ADD CONSTRAINT "MovieTag_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieCollection" ADD CONSTRAINT "MovieCollection_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_emotions" ADD CONSTRAINT "film_emotions_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_emotions" ADD CONSTRAINT "film_emotions_emotionId_fkey" FOREIGN KEY ("emotionId") REFERENCES "emotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_emotions" ADD CONSTRAINT "user_emotions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_emotions" ADD CONSTRAINT "user_emotions_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_emotions" ADD CONSTRAINT "user_emotions_emotionId_fkey" FOREIGN KEY ("emotionId") REFERENCES "emotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
