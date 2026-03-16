const sampleSlip = {
  employee: 'Jaline Latoga',
  id: 'WAH-006',
  designation: 'Admin & HR Partner',
  position: 'Operations',
  period: 'March 2026',
  basicPay: 28000,
  incentives: 500,
  unusedLeave: 0,
  bonus: 0,
  grossPay: 28500,
  absenceDeduction: 1500,
  totalDeductions: 1500,
  netPay: 27000,
}

const fmt = (n) => '₱' + n.toLocaleString()

export default function Payslips() {
  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h1 className="m-0 text-[1.4rem] font-bold text-gray-900">Payslip Generation</h1>
        <button className="px-[22px] py-2.5 rounded-[10px] border-0 text-white text-[0.95rem] font-semibold cursor-pointer bg-gradient-to-r from-wah-primary to-wah-lighter hover:opacity-90">⬇ Download PDF</button>
      </div>

      <div className="bg-white rounded-xl p-8 border border-wah-border max-w-[800px]">
        <div className="flex items-center gap-4 pb-4 border-b-2 border-wah-primary mb-5">
          <img src="/images/wah-logo.png" alt="WAH" className="w-14 h-14 object-contain" />
          <div>
            <h2 className="m-0 text-wah-dark text-[1.3rem]">WAH Payroll System</h2>
            <p className="mt-0.5 mb-0 text-[0.9rem] text-gray-500">Pay Period: {sampleSlip.period}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6 text-[0.92rem]">
          <div><strong>Employee:</strong> {sampleSlip.employee}</div>
          <div><strong>ID:</strong> {sampleSlip.id}</div>
          <div><strong>Designation:</strong> {sampleSlip.designation}</div>
          <div><strong>Position:</strong> {sampleSlip.position}</div>
        </div>

        <div className="grid grid-cols-2 gap-7 mb-6">
          <div>
            <h4 className="m-0 mb-3 text-wah-dark border-b border-gray-200 pb-2">Earnings</h4>
            <div className="flex justify-between py-1.5 text-[0.9rem] text-gray-600"><span>Basic Pay</span><span>{fmt(sampleSlip.basicPay)}</span></div>
            <div className="flex justify-between py-1.5 text-[0.9rem] text-gray-600"><span>Incentives</span><span>{fmt(sampleSlip.incentives)}</span></div>
            <div className="flex justify-between py-1.5 text-[0.9rem] text-gray-600"><span>Unused Leave</span><span>{fmt(sampleSlip.unusedLeave)}</span></div>
            <div className="flex justify-between py-1.5 text-[0.9rem] text-gray-600"><span>Bonus</span><span>{fmt(sampleSlip.bonus)}</span></div>
            <div className="flex justify-between border-t border-gray-300 mt-2 pt-2.5 font-bold text-wah-text"><span>Gross Pay</span><span>{fmt(sampleSlip.grossPay)}</span></div>
          </div>
          <div>
            <h4 className="m-0 mb-3 text-wah-dark border-b border-gray-200 pb-2">Deductions</h4>
            <div className="flex justify-between py-1.5 text-[0.9rem] text-gray-600"><span>Absences</span><span className="text-wah-red">{fmt(sampleSlip.absenceDeduction)}</span></div>
            <div className="flex justify-between border-t border-gray-300 mt-2 pt-2.5 font-bold text-wah-text"><span>Total Deductions</span><span className="text-wah-red">{fmt(sampleSlip.totalDeductions)}</span></div>
          </div>
        </div>

        <div className="flex justify-between px-5 py-4 rounded-[10px] bg-gradient-to-r from-wah-primary to-wah-lighter text-white text-[1.3rem] font-bold">
          <span>Net Pay</span>
          <span>{fmt(sampleSlip.netPay)}</span>
        </div>
      </div>
    </div>
  )
}