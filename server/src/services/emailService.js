import nodemailer from "nodemailer";
import dns from "dns";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use Implicit TLS (port 465) instead of STARTTLS (port 587)
  family: 4, // CRITICAL FIX FOR RAILWAY/RENDER: Force IPv4 to prevent ENETUNREACH IPv6 errors
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
      console.log(`Attempting to send email to: ${to} using Brevo API (HTTP)`);

      // Convert Nodemailer attachments to Brevo API format
      const brevoAttachments = attachments ? attachments.map(att => {
        // Handle case where Buffer was serialized to JSON { type: "Buffer", data: [...] }
        const rawContent = (att.content && att.content.type === "Buffer" && Array.isArray(att.content.data)) 
            ? att.content.data 
            : att.content;
            
        const b64String = Buffer.from(rawContent).toString('base64');
        console.log(`Attachment [${att.filename}]: converted to base64, length = ${b64String.length}, preview = ${b64String.substring(0, 50)}`);
        
        return {
          name: att.filename,
          content: b64String
        };
      }) : [];

      // Use BREVO_SENDER_EMAIL if set (must be a verified sender in Brevo),
      // otherwise fall back to EMAIL_USER. These can differ!
      const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || "finance@wah.ph";
      console.log(`[Brevo] Using sender: ${senderEmail}`);

      const payload = {
        sender: { name: "Finance WAH", email: senderEmail },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
      };

      if (brevoAttachments.length > 0) {
        payload.attachment = brevoAttachments;
      }

      // Use native fetch to bypass SMTP port blocking entirely
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },
        body: JSON.stringify(payload),
      });

      // Always read the response body for diagnosis
      const responseBody = await response.json();
      console.log(`[Brevo] Response status: ${response.status}, body: ${JSON.stringify(responseBody)}`);

      if (!response.ok) {
        throw new Error(`Brevo API Error (${response.status}): ${JSON.stringify(responseBody)}`);
      }

      console.log(`Email sent successfully to ${to} via Brevo HTTP API (messageId: ${responseBody.messageId})`);
      return true;
    } catch (error) {
      console.error(`Email Service Error for ${to}:`, error.stack || error.message);
      // It is often better to THROW the error here so your controller knows exactly why it failed
      throw error;
    }
  },
};

export default emailService;
