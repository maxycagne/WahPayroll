import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Faster direct SSL
  pool: true, // Keeps the connection open for multiple emails
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
      console.error("Email Service Error:", error);
      return false;
    }
  },
};

export default emailService;
