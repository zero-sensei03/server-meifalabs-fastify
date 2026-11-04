-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "LicenseOrderType" AS ENUM ('NEW_LICENSE', 'RENEWAL', 'UPGRADE');

-- CreateEnum
CREATE TYPE "LicenseOrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "license" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "license_key_hash" TEXT NOT NULL,
    "license_key_prefix" TEXT NOT NULL,
    "installation_id" TEXT,
    "vps_id" TEXT NOT NULL,
    "status" "LicenseStatus" NOT NULL DEFAULT 'PENDING',
    "starts_at" TIMESTAMPTZ(3),
    "expires_at" TIMESTAMPTZ(3),
    "activated_at" TIMESTAMPTZ(3),
    "last_validated_at" TIMESTAMPTZ(3),
    "suspended_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "license_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_module" (
    "id" TEXT NOT NULL,
    "license_id" TEXT NOT NULL,
    "module_code" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "assigned_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "license_module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_order" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "license_id" TEXT NOT NULL,
    "type" "LicenseOrderType" NOT NULL,
    "status" "LicenseOrderStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(14,2) NOT NULL,
    "discount_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "description" TEXT,
    "paid_at" TIMESTAMPTZ(3),
    "expires_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "license_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_order_item" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "module_code" TEXT NOT NULL,
    "billing_cycle" "BillingCycle" NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "final_amount" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "license_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_order_id" TEXT NOT NULL,
    "provider_transaction_id" TEXT,
    "provider_event_id" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "payment_method" TEXT,
    "checkout_url" TEXT,
    "expires_at" TIMESTAMPTZ(3),
    "paid_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "license_license_key_hash_key" ON "license"("license_key_hash");

-- CreateIndex
CREATE UNIQUE INDEX "license_installation_id_key" ON "license"("installation_id");

-- CreateIndex
CREATE INDEX "license_user_id_status_idx" ON "license"("user_id", "status");

-- CreateIndex
CREATE INDEX "license_status_expires_at_idx" ON "license"("status", "expires_at");

-- CreateIndex
CREATE INDEX "license_module_module_code_is_enabled_idx" ON "license_module"("module_code", "is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "license_module_license_id_module_code_key" ON "license_module"("license_id", "module_code");

-- CreateIndex
CREATE UNIQUE INDEX "license_order_order_number_key" ON "license_order"("order_number");

-- CreateIndex
CREATE INDEX "license_order_user_id_status_created_at_idx" ON "license_order"("user_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "license_order_license_id_created_at_idx" ON "license_order"("license_id", "created_at");

-- CreateIndex
CREATE INDEX "license_order_item_module_code_idx" ON "license_order_item"("module_code");

-- CreateIndex
CREATE UNIQUE INDEX "license_order_item_order_id_module_code_key" ON "license_order_item"("order_id", "module_code");

-- CreateIndex
CREATE UNIQUE INDEX "payment_provider_event_id_key" ON "payment"("provider_event_id");

-- CreateIndex
CREATE INDEX "payment_order_id_status_idx" ON "payment"("order_id", "status");

-- CreateIndex
CREATE INDEX "payment_provider_transaction_id_idx" ON "payment"("provider_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_provider_provider_order_id_key" ON "payment"("provider", "provider_order_id");

-- AddForeignKey
ALTER TABLE "license" ADD CONSTRAINT "license_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_module" ADD CONSTRAINT "license_module_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "license"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_module" ADD CONSTRAINT "license_module_module_code_fkey" FOREIGN KEY ("module_code") REFERENCES "module"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_order" ADD CONSTRAINT "license_order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_order" ADD CONSTRAINT "license_order_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "license"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_order_item" ADD CONSTRAINT "license_order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "license_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_order_item" ADD CONSTRAINT "license_order_item_module_code_fkey" FOREIGN KEY ("module_code") REFERENCES "module"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "license_order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
