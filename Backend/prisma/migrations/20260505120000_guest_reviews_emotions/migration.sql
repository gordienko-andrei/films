-- Review: один отзыв на автора (user или гость по UUID), userId опционален
ALTER TABLE "Review" ADD COLUMN "authorRef" TEXT;

UPDATE "Review" SET "authorRef" = 'u:' || "userId"::text;

ALTER TABLE "Review" ALTER COLUMN "authorRef" SET NOT NULL;

DROP INDEX IF EXISTS "Review_userId_movieId_key";

ALTER TABLE "Review" DROP CONSTRAINT IF EXISTS "Review_userId_fkey";

ALTER TABLE "Review" ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Review_authorRef_movieId_key" ON "Review"("authorRef", "movieId");

-- user_emotions: ключ участника u:<id> | g:<uuid>, без составного PK по userId
CREATE TABLE "user_emotions_new" (
    "id" SERIAL NOT NULL,
    "participantKey" TEXT NOT NULL,
    "userId" INTEGER,
    "filmId" TEXT NOT NULL,
    "emotionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_emotions_new_pkey" PRIMARY KEY ("id")
);

INSERT INTO "user_emotions_new" ("participantKey", "userId", "filmId", "emotionId", "createdAt")
SELECT ('u:' || "userId"::text), "userId", "filmId", "emotionId", "createdAt"
FROM "user_emotions";

DROP TABLE "user_emotions";

ALTER TABLE "user_emotions_new" RENAME TO "user_emotions";

CREATE UNIQUE INDEX "user_emotions_participantKey_filmId_emotionId_key" ON "user_emotions"("participantKey", "filmId", "emotionId");

CREATE INDEX "user_emotions_filmId_idx" ON "user_emotions"("filmId");

ALTER TABLE "user_emotions" ADD CONSTRAINT "user_emotions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user_emotions" ADD CONSTRAINT "user_emotions_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_emotions" ADD CONSTRAINT "user_emotions_emotionId_fkey" FOREIGN KEY ("emotionId") REFERENCES "emotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
