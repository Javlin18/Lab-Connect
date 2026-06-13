ALTER TABLE "Order" ADD COLUMN "paymentType" TEXT NOT NULL DEFAULT 'online_prepaid';
ALTER TABLE "Order" ADD COLUMN "razorpayOrderId" TEXT;
ALTER TABLE "Order" ADD COLUMN "razorpayPaymentId" TEXT;
ALTER TABLE "Order" ADD COLUMN "razorpaySignature" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentLinkId" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentLinkUrl" TEXT;
ALTER TABLE "Order" ADD COLUMN "paidAt" TIMESTAMP(3);
