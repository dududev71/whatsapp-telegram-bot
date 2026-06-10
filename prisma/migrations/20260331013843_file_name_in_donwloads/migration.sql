/*
  Warnings:

  - Added the required column `fileName` to the `Downloads` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Downloads" ADD COLUMN     "fileName" TEXT NOT NULL;
