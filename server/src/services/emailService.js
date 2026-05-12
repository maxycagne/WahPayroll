import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use STARTTLS
  // THIS IS THE KEY: Force IPv4
  family: 4,
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Add a timeout to prevent hanging connections
  connectionTimeout: 20000,
  greetingTimeout: 20000,
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
      console.log(`Email sent successfully: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(`Email Service Error:`, error.message);
      // It is often better to THROW the error here so your controller knows exactly why it failed
      throw error;
    }
  },
};

export default emailService;
