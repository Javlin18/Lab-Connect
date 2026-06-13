CREATE TYPE "OtpAssistanceStatus" AS ENUM ('pending', 'approved', 'rejected', 'verified_by_admin');

CREATE TABLE "OtpAssistanceRequest" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "orderId" TEXT,
    "employeeId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "bookingOwnerId" TEXT,
    "status" "OtpAssistanceStatus" NOT NULL DEFAULT 'pending',
    "reason" TEXT NOT NULL,
    "collectionLocation" TEXT NOT NULL,
    "otpShared" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "adminReason" TEXT,

    CONSTRAINT "OtpAssistanceRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OtpAssistanceAuditLog" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "orderId" TEXT,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorRole" "UserRole" NOT NULL,
    "employeeName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpAssistanceAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OtpAssistanceRequest_appointmentId_idx" ON "OtpAssistanceRequest"("appointmentId");
CREATE INDEX "OtpAssistanceRequest_employeeId_idx" ON "OtpAssistanceRequest"("employeeId");
CREATE INDEX "OtpAssistanceRequest_status_idx" ON "OtpAssistanceRequest"("status");
CREATE INDEX "OtpAssistanceRequest_requestedAt_idx" ON "OtpAssistanceRequest"("requestedAt");
CREATE INDEX "OtpAssistanceAuditLog_requestId_idx" ON "OtpAssistanceAuditLog"("requestId");
CREATE INDEX "OtpAssistanceAuditLog_appointmentId_idx" ON "OtpAssistanceAuditLog"("appointmentId");
CREATE INDEX "OtpAssistanceAuditLog_createdAt_idx" ON "OtpAssistanceAuditLog"("createdAt");

ALTER TABLE "OtpAssistanceRequest" ADD CONSTRAINT "OtpAssistanceRequest_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OtpAssistanceRequest" ADD CONSTRAINT "OtpAssistanceRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OtpAssistanceRequest" ADD CONSTRAINT "OtpAssistanceRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OtpAssistanceRequest" ADD CONSTRAINT "OtpAssistanceRequest_bookingOwnerId_fkey" FOREIGN KEY ("bookingOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OtpAssistanceRequest" ADD CONSTRAINT "OtpAssistanceRequest_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OtpAssistanceAuditLog" ADD CONSTRAINT "OtpAssistanceAuditLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "OtpAssistanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
