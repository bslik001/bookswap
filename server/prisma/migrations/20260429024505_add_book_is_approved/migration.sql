-- AlterTable
ALTER TABLE "books" ADD COLUMN "is_approved" BOOLEAN NOT NULL DEFAULT false;

-- Les livres deja en base sont consideres approuves (pas de regression visuelle).
UPDATE "books" SET "is_approved" = true;

-- CreateIndex
CREATE INDEX "books_is_approved_idx" ON "books"("is_approved");
