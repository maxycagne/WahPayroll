import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL
  pool: true,
  // FORCING IPV4 HERE:
  connectionTimeout: 10000, // 10 seconds timeout
  greetingTimeout: 10000,
  socketTimeout: 10000,
  dnsV6Order: false, // Prefer IPv4
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const emailService = {
  send: async ({ to, subject, html, attachments }) => {
    try {
      const info = await transporter.sendMail({
        from: `"Finance WAH" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        attachments: attachments || [],
      });
      console.log("Email sent: %s", info.messageId);
      return true;
    } catch (error) {
      // Improved error logging to see exactly what's failing
      console.error("SMTP Error Details:", {
        code: error.code,
        message: error.message,
        command: error.command,
      });
      return false;
    }
  },
};

export default emailService;
