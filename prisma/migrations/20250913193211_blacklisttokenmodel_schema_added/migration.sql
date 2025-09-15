-- CreateTable
CREATE TABLE "public"."blacklisttokenmodel" (
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blacklisttokenmodel_pkey" PRIMARY KEY ("token")
);
