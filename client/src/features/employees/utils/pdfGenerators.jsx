import NDADocument from "../../../components/pdfTemps/NDADocument.jsx";
import ResignationFormDocument from "../../../components/pdfTemps/ResignationFormDoc.jsx";
import ExitClearanceFormDocument from "../../../components/pdfTemps/ExitClearanceForm.jsx";
import ExitInterviewFormDocument from "../../../components/pdfTemps/ExitInterviewForm.jsx";
import ResignationLetterDoc from "../../../components/pdfTemps/ResignationLetterDoc.jsx";

const RESIGNATION_REASON_OPTIONS = [
  "Family and/or personal reasons",
  "Better career opportunity",
  "Pregnancy",
  "Poor Health/Physical Disability",
  "Relocation to another City/Country",
  "Termination",
  "Dissatisfaction with salary/allowances",
  "Dissatisfaction with the type of work",
  "Conflict with other employees/Supervisor/Manager",
];

function normalizeString(value) {
  return String(value || "").trim().toLowerCase();
}

function formatDocDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function getDisplayName(employee) {
  const firstName = String(employee?.first_name || "").trim();
  const lastName = String(employee?.last_name || "").trim();
  return `${firstName} ${lastName}`.trim() || employee?.emp_id || "Employee";
}

export function buildGeneratedDocument(file) {
  const data = file.document_data || {};
  const employeeName =
    String(data.employee_name || "").trim() || file.employee_name || "Employee";
  const interviewAnswers = Array.isArray(data.exit_interview_answers)
    ? data.exit_interview_answers
    : [];
  const checkedReasons = (Array.isArray(data.leaving_reasons) ? data.leaving_reasons : [])
    .map((reason) =>
      RESIGNATION_REASON_OPTIONS.findIndex(
        (option) => normalizeString(option) === normalizeString(reason),
      ),
    )
    .filter((index) => index >= 0);

  switch (file.template_type) {
    case "resignation_letter":
      return (
        <ResignationLetterDoc
          employeeName={employeeName}
          recipientName={data.recipient_name || ""}
          resignationDate={data.resignation_date || data.generated_at || ""}
          lastWorkingDay={data.last_working_day || ""}
          letterBody={data.resignation_letter || ""}
          position={data.position || ""}
        />
      );
    case "resignation_form":
      return (
        <ResignationFormDocument
          name={employeeName}
          position={data.position || ""}
          department={data.designation || ""}
          dateOfJoining={formatDocDate(data.hired_date)}
          resignationDate={formatDocDate(data.resignation_date)}
          lastWorkingDay={formatDocDate(data.last_working_day)}
          checkedReasons={checkedReasons}
          otherReason={data.leaving_reason_other || ""}
          employeeSignDate={formatDocDate(data.resignation_date)}
          employeeSignName={employeeName}
          supervisorSignDate=""
          supervisorSignName={data.recipient_name || ""}
        />
      );
    case "exit_interview":
      return (
        <ExitInterviewFormDocument
          answers={interviewAnswers}
          name={employeeName}
          position={data.position || ""}
          date={formatDocDate(data.resignation_date)}
        />
      );
    case "exit_clearance":
      return (
        <ExitClearanceFormDocument
          employeeNumber={data.emp_id || file.emp_id || ""}
          employeeName={employeeName}
          supervisorName={data.recipient_name || ""}
          department={data.designation || ""}
          dateOfHire={formatDocDate(data.hired_date)}
          lastWorkingDay={formatDocDate(data.last_working_day)}
          effectivityDate={formatDocDate(data.effective_date)}
        />
      );
    case "nda":
      return (
        <NDADocument
          employeeName={employeeName}
          employeeId={data.emp_id || file.emp_id || ""}
          employeeAddress={data.employee_address || ""}
          witness1Name="Ms. Jhuvy C. Dizon"
          witness1Title="Admin & Operations Officer"
          witness2Name="Robert Michael Martinez"
          witness2Title="Supervising Partner for Network and System"
        />
      );
    default:
      return null;
  }
}
