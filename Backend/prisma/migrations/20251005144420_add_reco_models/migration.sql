-- CreateTable
CREATE TABLE "MovieEmbedding" (
    "movieId" TEXT NOT NULL,
    "vector" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovieEmbedding_pkey" PRIMARY KEY ("movieId")
);

-- CreateTable
CREATE TABLE "MovieSimilar" (
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovieSimilar_pkey" PRIMARY KEY ("fromId","toId")
);

-- CreateIndex
CREATE INDEX "MovieSimilar_fromId_idx" ON "MovieSimilar"("fromId");

-- CreateIndex
CREATE INDEX "MovieSimilar_toId_idx" ON "MovieSimilar"("toId");

-- AddForeignKey
ALTER TABLE "MovieEmbedding" ADD CONSTRAINT "MovieEmbedding_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieSimilar" ADD CONSTRAINT "MovieSimilar_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieSimilar" ADD CONSTRAINT "MovieSimilar_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
