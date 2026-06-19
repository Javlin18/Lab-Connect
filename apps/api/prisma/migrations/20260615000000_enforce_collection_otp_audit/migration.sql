-- Admin-assisted collection OTPs and durable security audit events.
ALTER TABLE "OtpAssistanceRequest"
  ADD COLUMN "adminOtp" TEXT,
  ADD COLUMN "adminOtpExpiresAt" TIMESTAMP(3);

CREATE TABLE "SystemAuditLog" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "actorId" TEXT,
  "actorRole" "UserRole",
  "appointmentId" TEXT,
  "patientId" TEXT,
  "employeeId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SystemAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SystemAuditLog_action_idx" ON "SystemAuditLog"("action");
CREATE INDEX "SystemAuditLog_actorId_idx" ON "SystemAuditLog"("actorId");
CREATE INDEX "SystemAuditLog_appointmentId_idx" ON "SystemAuditLog"("appointmentId");
CREATE INDEX "SystemAuditLog_createdAt_idx" ON "SystemAuditLog"("createdAt");
