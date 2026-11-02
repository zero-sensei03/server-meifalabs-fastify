-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "verified_at" TIMESTAMPTZ(3),
    "status" "UserStatus" NOT NULL DEFAULT 'INACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_category" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "module_category_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "module" (
    "code" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "module_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price_monthly" DECIMAL(2,2),
    "price_yearly" DECIMAL(2,2),
    "discount_monthly" DECIMAL(2,2),
    "discount_yearly" DECIMAL(2,2),
    "order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_sellable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "module_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_status_idx" ON "user"("status");

-- CreateIndex
CREATE UNIQUE INDEX "module_category_slug_key" ON "module_category"("slug");

-- CreateIndex
CREATE INDEX "module_category_is_active_idx" ON "module_category"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "module_slug_key" ON "module"("slug");

-- CreateIndex
CREATE INDEX "module_is_active_idx" ON "module"("is_active");

-- CreateIndex
CREATE INDEX "module_is_sellable_idx" ON "module"("is_sellable");

-- CreateIndex
CREATE INDEX "module_category_id_idx" ON "module"("category_id");

-- AddForeignKey
ALTER TABLE "module" ADD CONSTRAINT "module_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "module_category"("code") ON DELETE CASCADE ON UPDATE CASCADE;
