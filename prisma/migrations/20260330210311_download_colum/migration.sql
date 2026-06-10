-- CreateTable
CREATE TABLE "Downloads" (
    "id" SERIAL NOT NULL,
    "localFile" TEXT NOT NULL,
    "cratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checked" TIMESTAMP(3),

    CONSTRAINT "Downloads_pkey" PRIMARY KEY ("id")
);
