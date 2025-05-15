/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `Movie` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Movie" ADD COLUMN     "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Movie_externalId_key" ON "Movie"("externalId");
