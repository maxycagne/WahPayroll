import {
  getPayrollByEmployee,
  getPayrollForBulk,
} from "./employeeController.js";
import emailService from "../services/emailService.js";
import pool from "../config/db.js";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

// --- OPTIMIZATION 1: CACHE IMAGES GLOBALLY ---
// Read from disk once on server startup, not on every request
const getBase64Image = (fileName) => {
  try {
    const filePath = path.join(process.cwd(), "public", "images", fileName);
    const bitmap = fs.readFileSync(filePath);
    return `data:image/png;base64,${bitmap.toString("base64")}`;
  } catch (error) {
    console.error(`Error loading image ${fileName}:`, error);
    return "";
  }
};

const cachedLogos = {
  main: getBase64Image("wah-logo.png"),
  top: getBase64Image("wah-top-logo.png"),
};

// --- OPTIMIZATION 2: GLOBAL BROWSER SINGLETON ---
// Keeps Chrome running in the background to eliminate startup delays
let globalBrowser = null;

const getBrowserInstance = async () => {
  // If no browser exists, or if it crashed/disconnected, launch a new one
  if (!globalBrowser || !globalBrowser.isConnected()) {
    console.log("Launching global Puppeteer browser...");
    globalBrowser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
  }
  return globalBrowser;
};

/**
 * Shared logic to generate PDF and send Email
 * Reused by both single and bulk functions
 */
const processSinglePayslip = async (payrollRecord, period, browser) => {
  const fmtPeso = (n) =>
    `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const payPeriodLabel = new Date(
    payrollRecord.period_start || `${period}-01`,
  ).toLocaleString("default", { month: "long", year: "numeric" });

  // Data Prep: Deductions
  let deductionItems = payrollRecord.deduction_reasons
    ? String(payrollRecord.deduction_reasons)
        .split(" | ")
        .map((line) => {
          const [label, amount] = line.split("=").map((p) => p?.trim());
          return { label: label || line, amount: amount || "" };
        })
    : [];

  const totalAbsenceVal = Number(payrollRecord.absence_deductions || 0);
  if (totalAbsenceVal > 0) {
    const alreadyListed = deductionItems.some(
      (item) =>
        item.label.toLowerCase().includes("absence") ||
        item.label.toLowerCase().includes("undertime"),
    );
    if (!alreadyListed) {
      deductionItems.unshift({
        label: "Absences / Undertime",
        amount: fmtPeso(totalAbsenceVal),
      });
    }
  }

  // Data Prep: Incentives
  const incentiveLines = payrollRecord.incentive_reasons
    ? String(payrollRecord.incentive_reasons)
        .split(" | ")
        .filter(Boolean)
        .join(", ")
    : "Incentives";

  // PDF Generation
  const page = await browser.newPage();
  const pdfHtmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @page { size: A4; margin: 0; }
            * { -webkit-print-color-adjust: exact; box-sizing: border-box; }
            body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 40px; background: white; color: #1e293b; }
            .print-container { width: 100%; border: 1.5px solid #334155; position: relative; min-height: 900px; }
            .header { display: flex; align-items: center; border-bottom: 1px solid #334155; padding: 15px; }
            .header-text { flex-grow: 1; text-align: center; font-size: 16px; font-weight: bold; }
            .info-section { border-bottom: 1px solid #334155; padding: 15px; font-size: 14px; }
            .grid-container { display: flex; width: 100%; border-bottom: 1px solid #334155; }
            .column { width: 50%; padding: 15px; }
            .column-left { border-right: 1px solid #334155; }
            .col-title { font-weight: bold; margin-bottom: 10px; display: flex; justify-content: space-between; font-size: 13px; }
            .line-item { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px; }
            .summary-section { padding: 30px 20px; }
            .summary-table { margin: 0 auto; width: 70%; }
            .summary-line { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .net-pay { margin-top: 15px; padding-top: 10px; border-top: 2px solid #334155; font-weight: bold; font-size: 18px; display: flex; justify-content: space-between; }
            .footer-note { text-align: center; font-size: 11px; padding: 15px; color: #64748b; position: absolute; bottom: 0; width: 100%; }
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.06; width: 450px; z-index: 0; }
            .content-layer { position: relative; z-index: 10; }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${cachedLogos.main ? `<img src="${cachedLogos.main}" class="watermark" />` : ""}
            <div class="content-layer">
              <div class="header">
                ${cachedLogos.top ? `<img src="${cachedLogos.top}" style="width: 120px;" />` : ""}
                <div class="header-text">Wireless for Health Initiative, Inc.</div>
              </div>
              <div class="info-section">
                <div><strong>PAYROLL PERIOD:</strong> ${payPeriodLabel}</div>
                <div><strong>EMPLOYEE NAME:</strong> ${payrollRecord.last_name}, ${payrollRecord.first_name}</div>
              </div>
              <div class="grid-container">
                <div class="column column-left">
                  <div class="col-title"><span>EARNINGS & ALLOWANCES</span><span>PHP</span></div>
                  <div class="line-item"><span>Basic Pay</span><span>${fmtPeso(payrollRecord.basic_pay)}</span></div>
                  ${Number(payrollRecord.incentives) > 0 ? `<div class="line-item"><span>${incentiveLines}</span><span>${fmtPeso(payrollRecord.incentives)}</span></div>` : ""}
                </div>
                <div class="column">
                  <div class="col-title"><span>DEDUCTIONS (IOU)</span><span>PHP</span></div>
                  ${
                    deductionItems.length > 0
                      ? deductionItems
                          .map(
                            (i) =>
                              `<div class="line-item"><span>${i.label}</span><span>${i.amount}</span></div>`,
                          )
                          .join("")
                      : `<div class="line-item"><span>None</span><span>₱0.00</span></div>`
                  }
                </div>
              </div>
              <div class="summary-section">
                <div class="summary-table">
                  <div class="summary-line" style="font-weight:bold;"><span>PAY SUMMARY</span><span>PHP</span></div>
                  <div class="summary-line"><span>Total Gross</span><span>${fmtPeso(payrollRecord.gross_pay)}</span></div>
                  <div class="summary-line"><span>Total Deductions</span><span>${fmtPeso(payrollRecord.absence_deductions)}</span></div>
                  <div class="net-pay"><span>NET SALARY & WAGES:</span><span>${fmtPeso(payrollRecord.net_pay)}</span></div>
                </div>
              </div>
              <div class="footer-note">*** WAH Confidential - Maximum Restrictions ***</div>
            </div>
          </div>
        </body>
        </html>
      `;

  await page.setContent(pdfHtmlContent, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

  // Close the page to free up memory, but keep the browser open!
  await page.close();

  // OPTIMIZATION 3: Minified Email HTML
  return await emailService.send({
    to: payrollRecord.email,
    subject: `Payslip for ${payPeriodLabel}`,
    html: `<div style="font-family:sans-serif;color:#333;line-height:1.5"><p>Good day!</p><p>Kindly see the attached <b>Payslip</b> for your reference.</p><p>You can also see the payslip in <b>WahPayroll.com</b></p><p>If you have any concerns, please don't hesitate to let me know.</p><p style="margin-bottom:0">--</p><div style="margin-top:5px"><strong style="color:#1a3a5f">Finance Team</strong><br><strong style="color:#2b78c5;font-size:1.1em">Wireless Access for Health Initiative Inc. (WAH)</strong></div><div style="margin-top:15px;font-size:.9em;color:#666">2nd Floor, Diwa ng Tarlac, Romulo Blvd.<br>San Vicente, Tarlac City 2300<br>Web: <a href="http://www.wah.ph" style="color:#2b78c5">www.wah.ph</a> | FB: <a href="http://www.facebook.com/wah.ph" style="color:#2b78c5">wah.ph</a> | LinkedIn: <a href="https://linkedin.com/company/wahteam" style="color:#2b78c5">wahteam</a><br>Telefax: +6345 985 5607<br>Mobile: +63917 529 7095 / +63998 565 1432</div><div style="margin-top:25px;font-size:.75em;color:#444;border-top:1px solid #eee;padding-top:10px;text-align:justify"><strong>CONFIDENTIALITY NOTICE:</strong> This email, including attachments, is for the intended recipient(s) and may contain confidential information. Unauthorized review, use, or distribution is prohibited. If you are not the intended recipient, please contact the sender and destroy all copies.</div></div>`,
    attachments: [
      {
        filename: `Payslip_${payrollRecord.last_name}_${period}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
};

// --- EXPORTED CONTROLLERS ---

export const sendBulkPayslips = async (req, res) => {
  try {
    const { period } = req.body;
    const payrolls = await getPayrollForBulk(pool, period);

    if (!payrolls || payrolls.length === 0) {
      return res
        .status(404)
        .json({ message: "No payroll records found for this period." });
    }

    // Reuse the global browser instance
    const browser = await getBrowserInstance();

    let successCount = 0;
    let failureCount = 0;

    // OPTIMIZATION 4: Concurrent Batch Processing (5 at a time)
    const BATCH_SIZE = 5;

    for (let i = 0; i < payrolls.length; i += BATCH_SIZE) {
      const batch = payrolls.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (record) => {
        if (!record.email) {
          failureCount++;
          return;
        }
        try {
          await processSinglePayslip(record, period, browser);
          successCount++;
        } catch (err) {
          console.error(`Failed to send to ${record.last_name}:`, err);
          failureCount++;
        }
      });

      // Wait for these 5 to finish before starting the next 5
      await Promise.all(batchPromises);
    }

    res.status(200).json({
      success: true,
      message: `Bulk processing complete.`,
      details: { sent: successCount, failed: failureCount },
    });
  } catch (error) {
    console.error("Bulk Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
  // Notice we DO NOT close the browser here anymore. We keep it alive.
};

export const sendPayslip = async (req, res) => {
  try {
    const { emp_id } = req.params;
    const { period } = req.body;

    const payrollRecord = await getPayrollByEmployee(pool, emp_id, period);

    if (!payrollRecord)
      return res.status(404).json({ message: "Payroll record not found" });
    if (!payrollRecord.email)
      return res.status(400).json({ message: "Employee email not found." });

    // OPTIMIZATION 5: Return Early (Fire and Forget)
    // Send success to frontend immediately
    res.status(200).json({
      success: true,
      message:
        "Payslip is being generated and sent. The employee will receive it shortly.",
    });

    // Run the heavy lifting in the background without making the user wait
    try {
      const browser = await getBrowserInstance();
      await processSinglePayslip(payrollRecord, period, browser);
      console.log(`Successfully sent single payslip to ${payrollRecord.email}`);
    } catch (bgError) {
      console.error("Background Single Send Error:", bgError);
    }
  } catch (error) {
    console.error("Single Endpoint Error:", error);
    // Only send a 500 error if the headers haven't already been sent
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};
