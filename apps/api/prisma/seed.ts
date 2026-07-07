import { config } from "dotenv";
import { resolve } from "node:path";

import { PrismaClient } from "@prisma/client";

config({
  path: resolve(process.cwd(), "../../.env")
});

const prisma = new PrismaClient();

const sampleTests = [
  {
    slug: "cbc",
    name: "Complete Blood Count (CBC)",
    description:
      "A Complete Blood Count (CBC) is one of the most common blood tests. It evaluates your overall health and detects a wide range of disorders, including anaemia, infection, and leukaemia. The test measures several components of your blood — red blood cells that carry oxygen, white blood cells that fight infection, haemoglobin (the oxygen-carrying protein in red blood cells), haematocrit (the proportion of red blood cells to the fluid component), and platelets that help blood clot.",
    price: 399,
    discountPrice: 199,
    category: "Blood Tests",
    sampleType: "Blood",
    preparationInstructions: "No fasting required. Stay hydrated before the test.",
    parameters: ["Haemoglobin", "RBC Count", "WBC Count", "Platelet Count", "Haematocrit", "MCV", "MCH", "MCHC"],
    turnaroundHours: 12,
    isActive: true,
  },
  {
    slug: "hba1c",
    name: "HbA1c (Glycated Hemoglobin)",
    description:
      "The HbA1c test measures the average blood sugar (glucose) levels over the past 2–3 months. Unlike a normal blood sugar test, it is not affected by daily fluctuations or what you ate before the test. It is the gold standard for diagnosing and monitoring Type 1 and Type 2 diabetes. An HbA1c below 5.7% is considered normal, 5.7–6.4% is prediabetes, and 6.5% or above indicates diabetes.",
    price: 599,
    discountPrice: 349,
    category: "Diabetes",
    sampleType: "Blood",
    preparationInstructions: "Fasting for 8–12 hours recommended for best results.",
    parameters: ["HbA1c Percentage", "Estimated Average Glucose (eAG)"],
    turnaroundHours: 12,
    isActive: true,
  },
  {
    slug: "lipid-profile",
    name: "Lipid Profile",
    description:
      "A Lipid Profile is a group of blood tests that measures the amount of cholesterol and other fats in your blood. High levels of certain lipids increase your risk of heart disease and stroke. This panel measures Total Cholesterol, LDL ('bad') cholesterol which can clog arteries, HDL ('good') cholesterol which helps remove other forms of cholesterol from your bloodstream, and Triglycerides — a type of fat found in your blood.",
    price: 699,
    discountPrice: 349,
    category: "Heart Health",
    sampleType: "Blood",
    preparationInstructions: "Fasting for 9–12 hours is required. Avoid alcohol for 24 hours before the test.",
    parameters: ["Total Cholesterol", "LDL Cholesterol", "HDL Cholesterol", "VLDL Cholesterol", "Triglycerides", "LDL/HDL Ratio"],
    turnaroundHours: 12,
    isActive: true,
  },
  {
    slug: "thyroid-tsh",
    name: "Thyroid Stimulating Hormone (TSH)",
    description:
      "TSH is produced by the pituitary gland and regulates how much hormone the thyroid gland produces. A TSH test is used to check for thyroid disorders such as hypothyroidism (underactive thyroid) and hyperthyroidism (overactive thyroid). It is often the first test ordered when thyroid symptoms are present — including fatigue, weight changes, hair loss, or mood disturbances. Normal TSH levels range from 0.4 to 4.0 mIU/L.",
    price: 499,
    discountPrice: 249,
    category: "Thyroid",
    sampleType: "Blood",
    preparationInstructions: "No fasting required. Avoid biotin supplements for 48 hours before the test.",
    parameters: ["TSH (Thyroid Stimulating Hormone)"],
    turnaroundHours: 24,
    isActive: true,
  },
  {
    slug: "thyroid-profile-total",
    name: "Thyroid Profile Total (T3, T4, TSH)",
    description:
      "A comprehensive thyroid function panel measuring three key hormones. T3 (Triiodothyronine) and T4 (Thyroxine) are produced directly by the thyroid gland and control how the body uses energy. TSH regulates their production. This panel together gives a complete picture of your thyroid health, helpful for diagnosing hypothyroidism, hyperthyroidism, Hashimoto's thyroiditis, and Graves' disease.",
    price: 799,
    discountPrice: 399,
    category: "Thyroid",
    sampleType: "Blood",
    preparationInstructions: "No fasting required. Collect the sample in the morning for best results.",
    parameters: ["Total T3", "Total T4", "TSH"],
    turnaroundHours: 24,
    isActive: true,
  },
  {
    slug: "liver-function-test",
    name: "Liver Function Test (LFT)",
    description:
      "A Liver Function Test (LFT) is a panel of blood tests that check how well your liver is working. The liver performs hundreds of vital functions including filtering toxins from the blood, producing proteins for blood clotting, and producing bile for digestion. This panel detects liver inflammation, damage, or diseases such as hepatitis, cirrhosis, and fatty liver disease early, often before symptoms appear.",
    price: 799,
    discountPrice: 449,
    category: "Liver",
    sampleType: "Blood",
    preparationInstructions: "Fasting for 8–10 hours is recommended. Avoid alcohol for at least 24 hours before the test.",
    parameters: ["SGOT (AST)", "SGPT (ALT)", "Alkaline Phosphatase", "Total Bilirubin", "Direct Bilirubin", "Indirect Bilirubin", "Total Protein", "Albumin", "Globulin"],
    turnaroundHours: 12,
    isActive: true,
  },
  {
    slug: "kidney-function-test",
    name: "Kidney Function Test (KFT)",
    description:
      "A Kidney Function Test (KFT) evaluates how well your kidneys are filtering waste from your blood. The kidneys filter about 200 litres of blood daily, removing waste products and extra water as urine. This panel helps detect kidney disease in its early stages, even before symptoms like swelling, fatigue, or decreased urination appear. It is recommended for people with diabetes, high blood pressure, or a family history of kidney disease.",
    price: 699,
    discountPrice: 399,
    category: "Kidney",
    sampleType: "Blood",
    preparationInstructions: "Fasting for 8–10 hours is required. Stay well-hydrated the day before.",
    parameters: ["Blood Urea Nitrogen (BUN)", "Serum Creatinine", "Uric Acid", "eGFR", "Sodium", "Potassium", "Chloride"],
    turnaroundHours: 12,
    isActive: true,
  },
  {
    slug: "vitamin-d-total",
    name: "Vitamin D Total (25-OH)",
    description:
      "Vitamin D is essential for strong bones, a healthy immune system, and muscle function. The 25-hydroxyvitamin D test is the best way to measure how much vitamin D is in your body. A deficiency is extremely common in India, especially in urban populations due to limited sun exposure. Low Vitamin D is linked to bone weakness (osteoporosis), frequent infections, fatigue, depression, and increased risk of chronic diseases.",
    price: 999,
    discountPrice: 599,
    category: "Vitamins & Minerals",
    sampleType: "Blood",
    preparationInstructions: "No fasting required.",
    parameters: ["25-OH Vitamin D Total"],
    turnaroundHours: 24,
    isActive: true,
  },
  {
    slug: "vitamin-b12",
    name: "Vitamin B12",
    description:
      "Vitamin B12 (Cobalamin) is a water-soluble vitamin critical for red blood cell formation, neurological function, and DNA synthesis. It is primarily found in animal-based foods, making vegetarians and vegans especially prone to deficiency. Symptoms of deficiency include extreme tiredness, muscle weakness, numbness or tingling in the hands and feet, mood disturbances, memory problems, and in severe cases, irreversible nerve damage.",
    price: 599,
    discountPrice: 349,
    category: "Vitamins & Minerals",
    sampleType: "Blood",
    preparationInstructions: "No fasting required. Avoid taking B12 supplements for 48 hours before the test.",
    parameters: ["Vitamin B12 (Cobalamin)"],
    turnaroundHours: 24,
    isActive: true,
  },
  {
    slug: "iron-studies",
    name: "Iron Studies (Serum Iron & TIBC)",
    description:
      "Iron Studies measure the amount of iron in your blood and how well your body stores and uses it. Iron is essential for making haemoglobin, the protein in red blood cells that carries oxygen throughout your body. This panel helps diagnose iron deficiency anaemia (the most common nutritional deficiency worldwide) as well as iron overload conditions like haemochromatosis. It is especially useful for women of reproductive age, pregnant women, and frequent blood donors.",
    price: 799,
    discountPrice: 499,
    category: "Blood Tests",
    sampleType: "Blood",
    preparationInstructions: "Fasting for 8 hours is recommended. Avoid iron supplements for 24 hours before the test.",
    parameters: ["Serum Iron", "Total Iron Binding Capacity (TIBC)", "Transferrin Saturation", "Serum Ferritin"],
    turnaroundHours: 24,
    isActive: true,
  },
];

async function main() {
  const email = "labconnect.work@gmail.com";
  const password = "Admin@123";
  const phone = "+10000000000";

  // Seed admin — skip if phone conflict (already exists with different phone)
  try {
    await prisma.user.upsert({
      where: { email },
      update: { name: "Lab Admin", role: "admin", passwordHash: password },
      create: { name: "Lab Admin", email, phone, role: "admin", passwordHash: password }
    });
    console.log("Admin seeded:", email);
  } catch {
    console.log("Admin already exists, skipping.");
  }

  // Seed employee — skip if phone conflict
  const empEmail = "employee@labapp.com";
  const empPassword = "employee123";
  const empPhone = "+10000000001";

  try {
    const employee = await prisma.user.upsert({
      where: { email: empEmail },
      update: { name: "Ravi Kumar", role: "employee", passwordHash: empPassword },
      create: { name: "Ravi Kumar", email: empEmail, phone: empPhone, role: "employee", passwordHash: empPassword }
    });
    await prisma.employee.upsert({
      where: { userId: employee.id },
      update: { zone: "Bhopal North Zone", isAvailable: true },
      create: { userId: employee.id, zone: "Bhopal North Zone", isAvailable: true }
    });
    console.log("Employee seeded:", empEmail);
  } catch {
    console.log("Employee already exists, skipping.");
  }

  // Always seed sample tests
  for (const test of sampleTests) {
    await prisma.test.upsert({
      where: { slug: test.slug },
      update: test,
      create: test,
    });
  }

  console.log(`Seeded ${sampleTests.length} tests successfully.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
