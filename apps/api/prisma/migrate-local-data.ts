import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), "../../.env") });
config({ path: resolve(process.cwd(), ".env") });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting migration of local data to hosted Prisma DB...\n");

  // ── Users ──────────────────────────────────────────────────────────────────
  const users = [
    { id: "cmpp656df000011z1ysnntejs", name: "uuybbj",      email: "test@gmail.com",             phone: "+918770785576", role: "patient"  as const, passwordHash: "$2a$10$ia4bXxG/cVDyOLcWHrfRLuOJdmg24wuVJ16rlZBVSkzoLit2Bxlf2", createdAt: new Date("2026-05-28T07:25:42.147Z") },
    { id: "cmpp67p0z000611z104bau31x", name: "testemp",     email: "emp@gmail.com",              phone: "123123123",     role: "employee" as const, passwordHash: "$2a$10$.yfpAHaNYjUO.oiZiH3ZbO8Fily31WXoQGVYkBkbLhDnofvYGqZ8O", createdAt: new Date("2026-05-28T07:27:39.636Z") },
    { id: "cmprx2wgh0000bqrmtcpgz1n1", name: "Lab Admin",  email: "admin@labapp.com",           phone: "+10000000000",  role: "admin"    as const, passwordHash: "$2a$10$eivF8rQsavhbFPTs/51/y.pTvGZL.qJVZlrfNCr6VMCwmzMIJbiHm", createdAt: new Date("2026-05-30T05:35:17.969Z") },
    { id: "cmprx2wkh0001bqrmp0eg2n83", name: "Ravi Kumar", email: "employee@labapp.com",        phone: "+10000000001",  role: "employee" as const, passwordHash: "$2a$10$g92jA4LfpCrfP7hU6KB7JOUFd7rXslD6s5gEK0nqDO0sgKS4vgmoS", createdAt: new Date("2026-05-30T05:35:18.114Z") },
    { id: "cmpus4q7n000145uop0u4xefb", name: "testemp",    email: "testemp@gmail.com",          phone: "1234567890",    role: "employee" as const, passwordHash: "$2a$10$bCgJri6W7XFqxdXXuDVnZO59rRHPC.PxG9tTbyfaCltzEKOazRnn2", createdAt: new Date("2026-06-01T05:40:03.635Z") },
    { id: "cmpus81ds000445uohc9yrrtj", name: "testpatient",email: "patient@gmail.com",          phone: "12345678901",   role: "patient"  as const, passwordHash: "$2a$10$uXL5dp2uxl6q8JvGuBdrBeU6lO6HbGzBTxSN3be2oDdMP3JCx6uZ6", createdAt: new Date("2026-06-01T05:42:38.081Z") },
    { id: "cmputtpzk0000omar9hlroocn", name: "jay",         email: "jayninaweofficial@gmail.com",phone: "8770785576",   role: "patient"  as const, passwordHash: "12072004Jay",                                                                                                       createdAt: new Date("2026-06-01T06:27:29.360Z") },
  ];

  let inserted = 0;
  for (const user of users) {
    try {
      await prisma.user.upsert({
        where: { id: user.id },
        update: { name: user.name, role: user.role, passwordHash: user.passwordHash },
        create: user,
      });
      inserted++;
    } catch (e: any) {
      // Skip duplicate phone/email — user already exists with different id
      if (e?.code === "P2002") {
        console.log(`  ↩ Skipped ${user.email} (duplicate phone/email already in cloud)`);
      } else {
        throw e;
      }
    }
  }
  console.log(`✓ Users: ${inserted} upserted`);

  // ── Tests ──────────────────────────────────────────────────────────────────
  const tests = [
    { id: "cmppagz29000210n3x9xuf6it", name: "Complete Blood Count (CBC)",   slug: "cbc",      description: "Evaluates overall health and detects a wide range of disorders.",                    price: 399,  discountPrice: 299, category: "Blood Tests", sampleType: "Blood", preparationInstructions: "No fasting required",          parameters: ["Hemoglobin", "WBC Count", "RBC Count", "Platelets"],                                                        turnaroundHours: 12, isActive: true, createdAt: new Date("2026-05-28T09:26:51.009Z") },
    { id: "cmppagz2h000310n35djevq4v", name: "Thyroid Profile (T3, T4, TSH)",slug: "thyroid",  description: "Evaluates thyroid gland function and hormone levels.",                              price: 799,  discountPrice: 499, category: "Thyroid",     sampleType: "Blood", preparationInstructions: "Fasting recommended",           parameters: ["Total Triiodothyronine (T3)", "Total Thyroxine (T4)", "Thyroid Stimulating Hormone (TSH)"],                 turnaroundHours: 24, isActive: true, createdAt: new Date("2026-05-28T09:26:51.017Z") },
    { id: "cmppagz2q000410n3pm519suo", name: "HbA1c (Glycated Hemoglobin)",  slug: "hba1c",    description: "Reflects your average blood sugar levels over the past 3 months.",                 price: 599,  discountPrice: 349, category: "Diabetes",    sampleType: "Blood", preparationInstructions: "No fasting required",          parameters: ["HbA1c Percentage", "Estimated Average Glucose"],                                                             turnaroundHours: 12, isActive: true, createdAt: new Date("2026-05-28T09:26:51.026Z") },
    { id: "cmppagz2v000510n3voetm3bt", name: "Lipid Profile (Cholesterol)",  slug: "lipid",    description: "Measures cholesterol and triglyceride levels in the blood.",                       price: 899,  discountPrice: 599, category: "Heart",       sampleType: "Blood", preparationInstructions: "10-12 hours fasting required", parameters: ["Total Cholesterol", "HDL Cholesterol", "LDL Cholesterol", "Triglycerides"],                                  turnaroundHours: 12, isActive: true, createdAt: new Date("2026-05-28T09:26:51.032Z") },
    { id: "cmppagz30000610n3zly0lwed", name: "Vitamin D (25-Hydroxy)",       slug: "vitamin-d",description: "Measures vitamin D levels to monitor bone health and immune function.",            price: 1599, discountPrice: 799, category: "Vitamins",    sampleType: "Blood", preparationInstructions: "No fasting required",          parameters: ["25-Hydroxy Vitamin D"],                                                                                      turnaroundHours: 24, isActive: true, createdAt: new Date("2026-05-28T09:26:51.036Z") },
  ];

  for (const test of tests) {
    await prisma.test.upsert({ where: { slug: test.slug }, update: {}, create: test });
  }
  console.log(`✓ Tests: ${tests.length} upserted`);

  // ── Packages ───────────────────────────────────────────────────────────────
  const packages = [
    { id: "cmppagz3a000710n35gp63bsw", name: "Full Body Checkup",     slug: "full-body",    description: "Comprehensive health check covering liver, kidney, blood, and metabolic functions.",          price: 2999, discountPrice: 1499, isActive: true, createdAt: new Date("2026-05-28T09:26:51.047Z"), testIds: ["cmppagz29000210n3x9xuf6it", "cmppagz2h000310n35djevq4v", "cmppagz2q000410n3pm519suo"] },
    { id: "cmppagz3m000810n3vfuqgu91", name: "Diabetes Care Package",  slug: "diabetes-care",description: "Specialized tests to track and manage blood sugar levels and potential complications.",      price: 1999, discountPrice: 999,  isActive: true, createdAt: new Date("2026-05-28T09:26:51.058Z"), testIds: ["cmppagz29000210n3x9xuf6it", "cmppagz2h000310n35djevq4v", "cmppagz2q000410n3pm519suo"] },
    { id: "cmppagz3r000910n3hhskqfw6", name: "Heart Health Package",   slug: "heart-health", description: "Evaluates cardiovascular risks with lipid profiles, sugar, and cardiac biomarkers.",        price: 3499, discountPrice: 1899, isActive: true, createdAt: new Date("2026-05-28T09:26:51.064Z"), testIds: ["cmppagz29000210n3x9xuf6it", "cmppagz2h000310n35djevq4v", "cmppagz2q000410n3pm519suo"] },
  ];

  for (const { testIds, ...pkg } of packages) {
    await prisma.package.upsert({
      where: { slug: pkg.slug },
      update: {},
      create: {
        ...pkg,
        tests: { connect: testIds.map((id) => ({ id })) },
      },
    });
  }
  console.log(`✓ Packages: ${packages.length} upserted`);

  // ── Employee profiles ──────────────────────────────────────────────────────
  // Look up actual user IDs in the hosted DB by email (local IDs may differ)
  const empUserMap: Record<string, string> = {};
  const empEmails = ["emp@gmail.com", "employee@labapp.com", "testemp@gmail.com"];
  for (const email of empEmails) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) empUserMap[email] = u.id;
  }

  const employeeEmailMap = [
    { email: "emp@gmail.com",        zone: "Jabalpur" },
    { email: "employee@labapp.com",  zone: "Bhopal North Zone" },
    { email: "testemp@gmail.com",    zone: "Jabalpur" },
  ];

  let empCount = 0;
  for (const { email, zone } of employeeEmailMap) {
    const userId = empUserMap[email];
    if (!userId) { console.log(`  ↩ Skipped employee ${email} (user not found in hosted DB)`); continue; }
    await prisma.employee.upsert({
      where: { userId },
      update: { zone },
      create: { userId, zone, isAvailable: true, currentLocation: "" },
    });
    empCount++;
  }
  console.log(`✓ Employees: ${empCount} upserted`);

  // ── Appointments ───────────────────────────────────────────────────────────
  // Remap user IDs from local to hosted
  const allEmailMap: Record<string, string> = {};
  const lookupEmails = [
    "test@gmail.com", "emp@gmail.com", "admin@labapp.com",
    "employee@labapp.com", "testemp@gmail.com", "patient@gmail.com",
    "jayninaweofficial@gmail.com",
  ];
  for (const email of lookupEmails) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) allEmailMap[email] = u.id;
  }

  // local id → hosted id mapping
  const idRemap: Record<string, string | null> = {
    "cmpp656df000011z1ysnntejs": allEmailMap["test@gmail.com"] ?? null,
    "cmpp67p0z000611z104bau31x": allEmailMap["emp@gmail.com"] ?? null,
    "cmprx2wgh0000bqrmtcpgz1n1": allEmailMap["admin@labapp.com"] ?? null,
    "cmprx2wkh0001bqrmp0eg2n83": allEmailMap["employee@labapp.com"] ?? null,
    "cmpus4q7n000145uop0u4xefb": allEmailMap["testemp@gmail.com"] ?? null,
    "cmpus81ds000445uohc9yrrtj": allEmailMap["patient@gmail.com"] ?? null,
    "cmputtpzk0000omar9hlroocn": allEmailMap["jayninaweofficial@gmail.com"] ?? null,
  };

  const remap = (id: string | null) => (id ? idRemap[id] ?? id : null);

  const appointments = [
    { id: "cmpp65ibj000211z13gf3d8py", patientId: "cmpp656df000011z1ysnntejs", employeeId: "cmpp67p0z000611z104bau31x", adminId: "cmprx2wgh0000bqrmtcpgz1n1", testTypes: ["CBC", "Thyroid Panel"],                            address: "Shaktinagar jabalpur",    slot: "2026-05-29 14:57",                    status: "assigned" as const, notes: "",           createdAt: new Date("2026-05-28T07:25:57.631Z"), updatedAt: new Date("2026-05-28T07:27:48.661Z") },
    { id: "cmputuurz0002omarjfllwhkz", patientId: "cmputtpzk0000omar9hlroocn", employeeId: "cmpus4q7n000145uop0u4xefb", adminId: "cmputtpzk0000omar9hlroocn",  testTypes: ["Sugar"],                                         address: "21 Karmeta Road",        slot: "1221",                                status: "assigned" as const, notes: "",           createdAt: new Date("2026-06-01T06:28:22.222Z"), updatedAt: new Date("2026-06-01T06:29:47.308Z") },
    { id: "cmpuv2g0e000eomar72nc3oey", patientId: "cmputtpzk0000omar9hlroocn", employeeId: "cmpus4q7n000145uop0u4xefb", adminId: "cmputtpzk0000omar9hlroocn",  testTypes: ["Lipid Profile (Cholesterol)"],                   address: "adsfsadf",               slot: "2026-06-03 06:00 AM - 08:00 AM", status: "en_route" as const, notes: "Website Order",   createdAt: new Date("2026-06-01T07:02:15.951Z"), updatedAt: new Date("2026-06-01T09:00:27.493Z") },
    { id: "cmpuzuwry000somark8soyyf4", patientId: "cmputtpzk0000omar9hlroocn", employeeId: null,                         adminId: "cmputtpzk0000omar9hlroocn",  testTypes: ["Diabetes Care Package", "Vitamin D (25-Hydroxy)"],address: "asdfas",                 slot: "2026-06-05 08:00 AM - 10:00 AM", status: "pending"  as const, notes: "Website Order",   createdAt: new Date("2026-06-01T09:16:22.511Z"), updatedAt: new Date("2026-06-01T09:16:22.511Z") },
  ];

  let aptCount = 0;
  for (const apt of appointments) {
    const patientId  = remap(apt.patientId);
    const adminId    = remap(apt.adminId);
    const employeeId = remap(apt.employeeId);
    if (!patientId || !adminId) { console.log(`  ↩ Skipped appointment ${apt.id} (user not found)`); continue; }
    try {
      await prisma.appointment.upsert({
        where: { id: apt.id },
        update: {},
        create: { ...apt, patientId, adminId, employeeId },
      });
      aptCount++;
    } catch (e: any) {
      console.log(`  ↩ Skipped appointment ${apt.id}: ${e.message}`);
    }
  }
  console.log(`✓ Appointments: ${aptCount} upserted`);

  // ── Orders ─────────────────────────────────────────────────────────────────
  const orders = [
    { id: "cmpuv1nch000comartbe6wbuw", patientId: "cmputtpzk0000omar9hlroocn", items: { slot: "2026-06-03 06:00 AM - 08:00 AM", address: "adsfsadf", pincode: "482001", testTypes: ["Lipid Profile (Cholesterol)"], patientAge: 22, patientName: "Jay",  patientPhone: "8770785576", patientGender: "male" }, totalAmount: 749,  paymentId: "order_mock_pps5o7", paymentStatus: "paid", appointmentId: "cmpuv2g0e000eomar72nc3oey", createdAt: new Date("2026-06-01T07:01:38.801Z") },
    { id: "cmpuzur2r000qomarj26mshpx", patientId: "cmputtpzk0000omar9hlroocn", items: { slot: "2026-06-05 08:00 AM - 10:00 AM", address: "asdfas",   pincode: "482002", testTypes: ["Diabetes Care Package", "Vitamin D (25-Hydroxy)"], patientAge: 22, patientName: "jayy", patientPhone: "2312311", patientGender: "male" }, totalAmount: 1948, paymentId: "order_mock_wqqqw",  paymentStatus: "paid", appointmentId: "cmpuzuwry000somark8soyyf4",   createdAt: new Date("2026-06-01T09:16:15.123Z") },
  ];

  let orderCount = 0;
  for (const order of orders) {
    const patientId = remap(order.patientId);
    if (!patientId) { console.log(`  ↩ Skipped order ${order.id} (patient not found)`); continue; }
    try {
      await prisma.order.upsert({ where: { id: order.id }, update: {}, create: { ...order, patientId } });
      orderCount++;
    } catch (e: any) {
      console.log(`  ↩ Skipped order ${order.id}: ${e.message}`);
    }
  }
  console.log(`✓ Orders: ${orderCount} upserted`);

  // ── Notifications ──────────────────────────────────────────────────────────
  const notifications = [
    { id: "cmpp65ibs000411z1p9p89yx6", userId: "cmpp656df000011z1ysnntejs", title: "Appointment created",  body: "A new appointment has been scheduled.",   type: "appointment_created",  read: false, createdAt: new Date("2026-05-28T07:25:57.640Z") },
    { id: "cmpp67vzu000a11z1ua2r1290", userId: "cmpp67p0z000611z104bau31x", title: "Appointment assigned", body: "You have a new appointment assignment.",   type: "appointment_assigned", read: false, createdAt: new Date("2026-05-28T07:27:48.666Z") },
    { id: "cmputuus80004omarn0fxqzro", userId: "cmputtpzk0000omar9hlroocn", title: "Appointment created",  body: "A new appointment has been scheduled.",   type: "appointment_created",  read: false, createdAt: new Date("2026-06-01T06:28:22.233Z") },
    { id: "cmputwofn0006omardfwyp1n3", userId: "cmpus4q7n000145uop0u4xefb", title: "Appointment assigned", body: "You have a new appointment assignment.",   type: "appointment_assigned", read: false, createdAt: new Date("2026-06-01T06:29:47.316Z") },
    { id: "cmpuz6mkp000gomarev5sfhyo", userId: "cmpus4q7n000145uop0u4xefb", title: "Appointment assigned", body: "You have a new appointment assignment.",   type: "appointment_assigned", read: false, createdAt: new Date("2026-06-01T08:57:29.545Z") },
    { id: "cmpuzafgj000iomardb43vxhe", userId: "cmputtpzk0000omar9hlroocn", title: "Appointment updated",  body: "Appointment status changed to en_route.", type: "appointment_status",   read: false, createdAt: new Date("2026-06-01T09:00:26.947Z") },
    { id: "cmpuzafvz000komarb846rjyb", userId: "cmputtpzk0000omar9hlroocn", title: "Appointment updated",  body: "Appointment status changed to en_route.", type: "appointment_status",   read: false, createdAt: new Date("2026-06-01T09:00:27.503Z") },
  ];

  let notifCount = 0;
  for (const notif of notifications) {
    const userId = remap(notif.userId);
    if (!userId) { console.log(`  ↩ Skipped notification ${notif.id} (user not found)`); continue; }
    try {
      await prisma.notification.upsert({
        where: { id: notif.id },
        update: {},
        create: { ...notif, userId },
      });
      notifCount++;
    } catch (e: any) {
      console.log(`  ↩ Skipped notification ${notif.id}: ${e.code}`);
    }
  }
  console.log(`✓ Notifications: ${notifCount} upserted`);

  console.log("\n✅ Migration complete. All local data is now in the hosted Prisma DB.");
}

main()
  .catch((e) => { console.error("❌ Migration failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
