/*
  Warnings:

  - The primary key for the `Downloads` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[localFile]` on the table `Downloads` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fileName]` on the table `Downloads` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Downloads" DROP CONSTRAINT "Downloads_pkey",
ADD COLUMN     "isCompact" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Downloads_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Downloads_id_seq";

-- CreateIndex
CREATE UNIQUE INDEX "Downloads_localFile_key" ON "Downloads"("localFile");

-- CreateIndex
CREATE UNIQUE INDEX "Downloads_fileName_key" ON "Downloads"("fileName");
