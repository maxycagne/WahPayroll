import nodemailer from "nodemailer";
import dns from "dns";

// This forces Node to resolve 'smtp.gmail.com' to IPv4 only
dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  pool: true,
  // Force IPv4 at the socket level
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Extra socket settings to prevent Render from killing the connection
  socketTimeout: 30000,
  connectionTimeout: 30000,
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
      console.error("SMTP Error Details:", {
        code: error.code,
        message: error.message,
        // If this still shows an IPv6 address, the host's DNS is forced
        address: error.address,
        stack: error.stack,
      });
      return false;
    }
  },
};

export default emailService;
