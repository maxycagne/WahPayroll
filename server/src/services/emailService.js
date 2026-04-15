import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // ADD THESE SETTINGS TO PREVENT TIMEOUTS
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 15000,
  debug: true, // This will show more details in Render logs if it fails
  logger: true,
});

const emailService = {
  send: async ({ to, subject, html, attachments }) => {
    try {
      const info = await transporter.sendMail({
        // Ensure this matches your EMAIL_USER if Gmail blocks spoofing
        from: `"Finance WAH" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        attachments: attachments || [],
      });
      console.log("Email sent: %s", info.messageId);
      return true;
    } catch (error) {
      console.error("Email Service Error Detail:", error);
      // If you see "Invalid Login", it's 100% the App Password
      return false;
    }
  },
};

export default emailService;
