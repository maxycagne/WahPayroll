import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function testEmail() {
  console.log("Using credentials:");
  console.log("User:", process.env.EMAIL_USER);
  console.log("Pass:", process.env.EMAIL_PASS ? "****" : "MISSING");

  try {
    console.log("Verifying transporter...");
    await transporter.verify();
    console.log("Transporter verified!");

    console.log("Sending test email...");
    const info = await transporter.sendMail({
      from: `"Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "Test Email from WahPayroll",
      text: "If you see this, your email credentials are correct!",
    });
    console.log("Test email sent:", info.messageId);
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testEmail();
