import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  // --- BULK OPTIMIZATIONS ---
  pool: true, // Use pooled connections instead of creating a new one every time
  maxConnections: 5, // Do not open more than 5 connections at once (matches our Batch Size of 5!)
  maxMessages: 100, // Send up to 100 messages per connection before recycling
  // --------------------------
  auth: {
    user: process.env.EMAIL_USER,
    // Note: If using Gmail, this MUST be an App Password, not your normal password
    pass: process.env.EMAIL_PASS,
  },
});

const emailService = {
  send: async ({ to, subject, html, attachments }) => {
    try {
      const info = await transporter.sendMail({
        // TODO : CHANGE TO Finance email
        from: '"Finance WAH" <finance@wah.ph>',
        to,
        subject,
        html,
        attachments: attachments || [],
      });
      console.log(`Email sent to ${to}: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(`Email Service Error for ${to}:`, error.message);
      // It is often better to THROW the error here so your controller knows exactly why it failed
      throw error;
    }
  },
};

export default emailService;
