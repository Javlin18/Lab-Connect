const nodemailer = require("nodemailer");
require("dotenv").config({ path: "apps/api/.env" });

async function test() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  
  if (!host || !user || !pass) {
    console.error("Missing SMTP credentials in .env");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: false, // TLS
    auth: { user, pass },
  });

  try {
    await transporter.verify();
    console.log("SMTP connection successful!");
  } catch (error) {
    console.error("SMTP connection failed:", error);
  }
}
test();
