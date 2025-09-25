-- CreateEnum
CREATE TYPE "public"."GiftCodeStatus" AS ENUM ('UNASSIGNED', 'ASSIGNED', 'SENT', 'VOID');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."AllocationStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."gift_codes" (
    "id" TEXT NOT NULL,
    "codeEnc" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "public"."GiftCodeStatus" NOT NULL DEFAULT 'UNASSIGNED',
    "importedBatchId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "lockId" TEXT,
    "memberId" TEXT,
    "deviceId" TEXT,
    "assignedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory_batches" (
    "id" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "importedByUserId" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "count" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."devices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetPrice" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."allocations" (
    "id" TEXT NOT NULL,
    "lockId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "deviceId" TEXT,
    "target" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "diff" INTEGER NOT NULL,
    "status" "public"."AllocationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."allocation_items" (
    "id" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "giftCodeId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "allocation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'OPERATOR',
    "twoFAHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "diffJson" TEXT,
    "ip" TEXT,
    "ua" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gift_codes_codeHash_key" ON "public"."gift_codes"("codeHash");

-- CreateIndex
CREATE UNIQUE INDEX "allocations_lockId_key" ON "public"."allocations"("lockId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- AddForeignKey
ALTER TABLE "public"."gift_codes" ADD CONSTRAINT "gift_codes_importedBatchId_fkey" FOREIGN KEY ("importedBatchId") REFERENCES "public"."inventory_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gift_codes" ADD CONSTRAINT "gift_codes_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gift_codes" ADD CONSTRAINT "gift_codes_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gift_codes" ADD CONSTRAINT "gift_codes_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_batches" ADD CONSTRAINT "inventory_batches_importedByUserId_fkey" FOREIGN KEY ("importedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."allocations" ADD CONSTRAINT "allocations_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."allocations" ADD CONSTRAINT "allocations_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."allocation_items" ADD CONSTRAINT "allocation_items_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "public"."allocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."allocation_items" ADD CONSTRAINT "allocation_items_giftCodeId_fkey" FOREIGN KEY ("giftCodeId") REFERENCES "public"."gift_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
