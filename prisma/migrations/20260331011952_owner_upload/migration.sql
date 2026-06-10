/*
  Warnings:

  - Added the required column `OwnerUserName` to the `Downloads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerPhone` to the `Downloads` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Downloads" ADD COLUMN     "OwnerUserName" TEXT NOT NULL,
ADD COLUMN     "ownerPhone" TEXT NOT NULL;
