import fetch from "node-fetch";

async function run() {
  const BREVO_API_KEY = "xsmtpsib-..."; // I'll just use a mock or see if it validates format

  const payload = {
    sender: { name: "Test", email: "finance@wah.ph" },
    to: [{ email: "test@example.com" }],
    subject: "Test",
    htmlContent: "<p>Test</p>",
    attachment: [
      {
        name: "test.pdf",
        content: Buffer.from("dummy pdf content").toString("base64")
      }
    ]
  };

  console.log("Payload attachment:", payload.attachment);
}
run();
