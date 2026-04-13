import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "cagnemaverick@gmail.com",
    pass: "",
  },
});

const emailService = {
  send: async ({ to, subject, html, attachments }) => {
    try {
      const info = await transporter.sendMail({
        from: '"WAHEMS Payroll" <cagnemaverick@gmail.com>',
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
