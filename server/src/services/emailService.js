import nodemailer from "nodemailer";
import dns from "dns";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL/TLS
  // --- CRITICAL FIX FOR RENDER: Force IPv4 via custom lookup ---
  lookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4 }, callback);
  },
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // Extra security for hostname verification
    servername: "smtp.gmail.com",
    rejectUnauthorized: true,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  connectionTimeout: 20000,
  greetingTimeout: 20000,
});

const emailService = {
  send: async ({ to, subject, html, attachments }) => {
    try {
      console.log(`Attempting to send email to: ${to}`);
      const info = await transporter.sendMail({
        // TODO : CHANGE TO Finance email
        from: '"Finance WAH" <finance@wah.ph>',
        to,
        subject,
        html,
        attachments: attachments || [],
      });
      console.log(`Email sent successfully to ${to}: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(`Email Service Error for ${to}:`, error.stack || error.message);
      // It is often better to THROW the error here so your controller knows exactly why it failed
      throw error;
    }
  },
};

export default emailService;
