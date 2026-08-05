generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x", "debian-openssl-3.0.x"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Tenant {
  id        String       @id @default(uuid())
  name      String
  slug      String       @unique
  status    TenantStatus @default(TRIAL)
  createdAt DateTime     @default(now()) @map("created_at")
  updatedAt DateTime     @updatedAt @map("updated_at")
  deletedAt DateTime?    @map("deleted_at")

  users       User[]
  roles       Role[]
  license     License?
  auditLogs   AuditLog[]
  invitations Invitation[]
  accessCodes AccessCode[]
  products    Product[]

  @@map("tenants")
}

enum TenantStatus {
  TRIAL
  ACTIVE
  SUSPENDED
  CANCELLED

  @@map("tenant_status")
}

model License {
  id       String @id @default(uuid())
  tenantId String @unique @map("tenant_id")
  tenant   Tenant @relation(fields: [tenantId], references: [id])

  plan      LicensePlan   @default(TRIAL)
  status    LicenseStatus @default(TRIAL)
  seats     Int           @default(1)
  seatsUsed Int           @default(0) @map("seats_used")
  features  Json          @default("[]")

  isLifetime       Boolean   @default(false) @map("is_lifetime")
  trialEndsAt      DateTime? @map("trial_ends_at")
  currentPeriodEnd DateTime? @map("current_period_end")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("licenses")
}

enum LicensePlan {
  TRIAL
  STARTER
  PRO
  ENTERPRISE

  @@map("license_plan")
}

enum LicenseStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  SUSPENDED
  CANCELLED

  @@map("license_status")
}

model User {
  id       String @id @default(uuid())
  tenantId String @map("tenant_id")
  tenant   Tenant @relation(fields: [tenantId], references: [id])

  email        String  @unique
  phone        String? @unique
  passwordHash String  @map("password_hash")
  firstName    String  @map("first_name")
  lastName     String  @map("last_name")

  emailVerifiedAt DateTime? @map("email_verified_at")
  phoneVerifiedAt DateTime? @map("phone_verified_at")

  status     UserStatus @default(PENDING)
  mfaEnabled Boolean    @default(false) @map("mfa_enabled")
  mfaSecret  String?    @map("mfa_secret")
  isSuperAdmin Boolean  @default(false) @map("is_super_admin")

  failedLoginAttempts Int       @default(0) @map("failed_login_attempts")
  lockedUntil         DateTime? @map("locked_until")

  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  roles     UserRole[]
  sessions  Session[]
  auditLogs AuditLog[]

  @@index([tenantId])
  @@map("users")
}

enum UserStatus {
  PENDING
  ACTIVE
  DISABLED
  ARCHIVED

  @@map("user_status")
}

model Role {
  id       String @id @default(uuid())
  tenantId String @map("tenant_id")
  tenant   Tenant @relation(fields: [tenantId], references: [id])

  name        String
  description String?
  isSystem    Boolean @default(false) @map("is_system")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  permissions RolePermission[]
  users       UserRole[]

  @@unique([tenantId, name])
  @@map("roles")
}

model Permission {
  id          String  @id @default(uuid())
  code        String  @unique
  module      String
  action      String
  description String?

  roles RolePermission[]

  @@map("permissions")
}

model RolePermission {
  roleId       String @map("role_id")
  permissionId String @map("permission_id")

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
  @@map("role_permissions")
}

model UserRole {
  userId String @map("user_id")
  roleId String @map("role_id")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
  @@map("user_roles")
}

model Session {
  id     String @id @default(uuid())
  userId String @map("user_id")
  user   User   @relation(fields: [userId], references: [id])

  refreshTokenHash String  @map("refresh_token_hash")
  userAgent        String? @map("user_agent")
  ipAddress        String? @map("ip_address")

  createdAt      DateTime  @default(now()) @map("created_at")
  lastActivityAt DateTime  @default(now()) @map("last_activity_at")
  expiresAt      DateTime  @map("expires_at")
  revokedAt      DateTime? @map("revoked_at")

  @@index([userId])
  @@map("sessions")
}

model Invitation {
  id       String @id @default(uuid())
  tenantId String @map("tenant_id")
  tenant   Tenant @relation(fields: [tenantId], references: [id])

  email      String
  roleId     String?
  token      String    @unique
  expiresAt  DateTime  @map("expires_at")
  acceptedAt DateTime? @map("accepted_at")

  createdAt DateTime @default(now()) @map("created_at")

  @@map("invitations")
}

model AuditLog {
  id       String  @id @default(uuid())
  tenantId String  @map("tenant_id")
  tenant   Tenant  @relation(fields: [tenantId], references: [id])
  userId   String? @map("user_id")
  user     User?   @relation(fields: [userId], references: [id])

  action    String
  resource  String?
  result    String
  ipAddress String? @map("ip_address")
  metadata  Json?

  createdAt DateTime @default(now()) @map("created_at")

  @@index([tenantId, createdAt])
  @@map("audit_logs")
}

model AccessCode {
  id   String @id @default(uuid())
  code String @unique

  batchId  String?      @map("batch_id")
  plan     LicensePlan
  duration CodeDuration

  periodDays Int? @map("period_days")

  priceFcfa   Int?    @map("price_fcfa")
  soldChannel String? @map("sold_channel")

  status AccessCodeStatus @default(UNUSED)

  tenantId        String?   @map("tenant_id")
  redeemedByEmail String?   @map("redeemed_by_email")
  redeemedAt      DateTime? @map("redeemed_at")
  expiresAt       DateTime? @map("expires_at")

  createdAt DateTime @default(now()) @map("created_at")
  createdBy String?  @map("created_by")

  tenant Tenant? @relation(fields: [tenantId], references: [id])

  @@index([batchId])
  @@index([tenantId])
  @@map("access_codes")
}

enum CodeDuration {
  MONTHLY
  THREE_MONTHS
  SIX_MONTHS
  TWELVE_MONTHS
  CUSTOM
  LIFETIME

  @@map("code_duration")
}

enum AccessCodeStatus {
  UNUSED
  ACTIVE
  EXPIRED
  REVOKED

  @@map("access_code_status")
}

model Product {
  id       String @id @default(uuid())
  tenantId String @map("tenant_id")
  tenant   Tenant @relation(fields: [tenantId], references: [id])

  name          String
  sku           String?
  priceFcfa     Int          @map("price_fcfa")
  stockQuantity Int          @default(0) @map("stock_quantity")
  status        ProductStatus @default(ACTIVE)

  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  @@index([tenantId])
  @@map("products")
}

enum ProductStatus {
  ACTIVE
  ARCHIVED

  @@map("product_status")
}

// ============================================================================
// TARIFICATION — prix par défaut (plan x durée), gérés depuis la console
// admin plateforme (/platform-admin). Utilisés pour préremplir le prix lors
// de la génération de codes ; toujours modifiable au cas par cas.
// ============================================================================
model PriceConfig {
  id        String       @id @default(uuid())
  plan      LicensePlan
  duration  CodeDuration
  priceFcfa Int          @map("price_fcfa")
  updatedAt DateTime     @updatedAt @map("updated_at")

  @@unique([plan, duration])
  @@map("price_configs")
}
