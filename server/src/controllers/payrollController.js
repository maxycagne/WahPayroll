import {
  getPayrollByEmployee,
  getPayrollForBulk,
} from "./employeeController.js";
import emailService from "../services/emailService.js";
import pool from "../config/db.js";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

// --- GLOBAL CACHE ---
// Read images once into memory to avoid disk I/O latency
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

const LOGO_MAIN = getBase64Image("wah-logo.png");
const LOGO_TOP = getBase64Image("wah-top-logo.png");

const PUPPETEER_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage", // This is the most important flag for Render
  "--disable-gpu",
];

// --- HELPERS ---

const processSinglePayslip = async (payrollRecord, period, browser) => {
  const fmtPeso = (n) =>
    `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const payPeriodLabel = new Date(
    payrollRecord.period_start || `${period}-01`,
  ).toLocaleString("default", { month: "long", year: "numeric" });

  let deductionItems = payrollRecord.deduction_reasons
    ? String(payrollRecord.deduction_reasons)
        .split(" | ")
        .map((line) => {
          const [label, amount] = line.split("=").map((p) => p?.trim());
          return { label: label || line, amount: amount || "" };
        })
    : [];

  if (Number(payrollRecord.absence_deductions) > 0) {
    deductionItems.unshift({
      label: "Absences / Undertime",
      amount: fmtPeso(payrollRecord.absence_deductions),
    });
  }

  const incentiveLines = payrollRecord.incentive_reasons
    ? String(payrollRecord.incentive_reasons)
        .split(" | ")
        .filter(Boolean)
        .join(", ")
    : "Incentives";

  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(60000);
  // Optimization: Use domcontentloaded instead of networkidle0 for speed
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
        ${LOGO_MAIN ? `<img src="${LOGO_MAIN}" class="watermark" />` : ""}
        <div class="content-layer">
          <div class="header">
            ${LOGO_TOP ? `<img src="${LOGO_TOP}" style="width: 120px;" />` : ""}
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
              ${deductionItems.length > 0 ? deductionItems.map((i) => `<div class="line-item"><span>${i.label}</span><span>${i.amount}</span></div>`).join("") : `<div class="line-item"><span>None</span><span>₱0.00</span></div>`}
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

  await page.setContent(pdfHtmlContent, { waitUntil: "domcontentloaded" });
  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
  await page.close();

  return await emailService.send({
    to: payrollRecord.email,
    subject: `Payslip for ${payPeriodLabel}`,
    html: `<p>Good day! Attached is your payslip for ${payPeriodLabel}.</p>`, // Keep HTML short for speed
    attachments: [
      {
        filename: `Payslip_${payrollRecord.last_name}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
};

// --- EXPORTED CONTROLLERS ---

export const sendBulkPayslips = async (req, res) => {
  let browser;
  try {
    const { period } = req.body;
    const payrolls = await getPayrollForBulk(pool, period);
    if (!payrolls?.length)
      return res.status(404).json({ message: "No records found." });

    browser = await puppeteer.launch({
      args: PUPPETEER_ARGS,
      headless: true, // or "shell" for newer versions
      // REMOVED: executablePath (Puppeteer finds its own)
      // REMOVED: defaultViewport (Puppeteer uses its own default)
    });

    // Process in small parallel chunks (faster than sequential, safer than all-at-once)
    const chunkSize = 3;
    let successCount = 0;
    for (let i = 0; i < payrolls.length; i += chunkSize) {
      const chunk = payrolls.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (record) => {
          if (record.email) {
            const success = await processSinglePayslip(record, period, browser);
            if (success) successCount++;
          }
        }),
      );
    }

    res
      .status(200)
      .json({ success: true, message: `Sent ${successCount} payslips.` });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  } finally {
    if (browser) await browser.close();
  }
};

export const sendPayslip = async (req, res) => {
  let browser;
  try {
    const { emp_id } = req.params;
    const { period } = req.body;
    const payrollRecord = await getPayrollByEmployee(pool, emp_id, period);

    if (!payrollRecord?.email)
      return res.status(404).json({ message: "Not found" });

    browser = await puppeteer.launch({
      args: PUPPETEER_ARGS,
      headless: true, // or "shell" for newer versions
      // REMOVED: executablePath (Puppeteer finds its own)
      // REMOVED: defaultViewport (Puppeteer uses its own default)
    });

    await processSinglePayslip(payrollRecord, period, browser);
    res.status(200).json({ success: true, message: "Sent." });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  } finally {
    if (browser) await browser.close();
  }
};
