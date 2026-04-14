import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import NDADocument from '../components/pdfTemps/NDADocument.jsx';
import ResignationFormDocument from '../components/pdfTemps/ResignationFormDoc.jsx';
import ExitClearanceFormDocument from '../components/pdfTemps/ExitClearanceForm.jsx';
import ExitInterviewFormDocument from '../components/pdfTemps/ExitInterviewForm.jsx';

const FileManagement = () => {
  // Sample data for NDA Document
  const sampleNDAData = {
    employeeName: 'Filson John L. Bequibel',
    employeeId: 'EMP-001',
    employeeAddress: '123 Main Street, Tarlac City, Philippines',
    signatureDay: '08',
    signatureMonth: 'April',
    signatureYear: '2026',
    signatureCity: 'Tarlac City',
    dpoName: 'Kevin Greg Alvarado',
    dpoTitle: 'Data Protection Officer',
    witness1Name: 'Ms. Jhuvy C. Dizon',
    witness1Title: 'Admin & Operations Officer',
    witness2Name: 'Robert Michael Martinez',
    witness2Title: 'Supervising Partner for Network and System',
    firstPartyName: 'WIRELESS ACCESS FOR HEALTH INITIATIVE, INC. (WAH-NGO)',
    firstPartyAddress: '2nd Floor, Room 2, Diwa ng Tarlac, Romulo Blvd, San Vicente, Tarlac City, Philippines',
    firstPartyRepName: 'Robert Michael Martinez',
    firstPartyRepTitle: 'Supervising Partner for Network and System Partner',
    partnerInstitution: 'Tarlac State University'
  };

  // Sample data for Resignation Form
  const sampleResignationData = {
    name: 'Jane Smith',
    position: 'Senior Healthcare Specialist',
    department: 'IT Services',
    dateOfJoining: '2021-03-15',
    resignationDate: '2026-04-01',
    lastWorkingDay: '2026-04-15',
    checkedReasons: [1, 3], // Array of indices: 1 = "Better career opportunity", 3 = "Poor Health/Physical Disability"
    otherReason: 'Pursuing further education in healthcare management',
    employeeSignDate: '2026-04-07',
    employeeSignName: 'Jane Smith',
    supervisorSignDate: '2026-04-08',
    supervisorSignName: 'John Manager'
  };

  // Sample data for Exit Clearance Form
  const sampleClearanceData = {
    employeeNumber: 'EMP-001234',
    employeeName: 'Jane Smith',
    supervisorName: 'John Manager',
    department: 'IT Services',
    dateOfHire: '2021-03-15',
    lastWorkingDay: '2026-04-15',
    effectivityDate: '2026-04-16',
    clearanceData: [
      {
        dep: 'Training - Trainer (HIPP-Supervisor)',
        items: ['Modules', 'Others'],
        signature: true,
        comments: 'Cleared'
      },
      {
        dep: 'Modules (Platform & Innovation Supervisor)',
        items: [
          'Laptop / Desktop',
          'Charger',
          'Mouse, USB',
          'Tablet/Modem',
          'Others'
        ],
        signature: true,
        comments: 'Cleared'
      },
      {
        dep: 'IT Services',
        items: [
          'Email',
          'WAH Account',
          'Foldex/Induction, EHR',
        ],
        signature: true,
        comments: 'Cleared'
      },
      {
        dep: 'Facilities',
        items: ['Keys', 'ID Card', 'Table/Chair', 'Others'],
        signature: true,
        comments: 'Cleared'
      },
      {
        dep: 'Financial Services',
        items: ['Company Loan', 'Others'],
        signature: true,
        comments: 'Not Cleared - Outstanding Loan'
      },
      {
        dep: 'Human Resources',
        items: [
          'Separation Document',
          'WAH ID'
        ],
        signature: true,
        comments: 'Cleared'
      }
    ]
  };

  // Sample answers for Exit Interview Form
  const sampleAnswers = [
    'Better career opportunities and growth potential in a larger organization.',
    'I decided to pursue a role that aligns more closely with my career goals and long-term objectives.',
    'It was a combination of factors - career growth, compensation, and work-life balance.',
    'The new company offers a more competitive salary, better benefits package, and opportunities for professional development.',
    'I valued the supportive team environment and the company mission to improve healthcare access.',
    'Limited opportunities for advancement and the lack of clear career progression paths.',
    'My manager was supportive and provided good guidance, though communication could have been more frequent.',
    'More regular one-on-one meetings and clearer feedback on performance expectations.',
    'Working with a diverse team and knowing that my work directly impacted patient care.',
    'Repetitive tasks and limited exposure to new technologies and methodologies.',
    'Yes, I had the resources needed, though more training opportunities would have been beneficial.',
    'Yes, I understood my role and the expected outcomes clearly.',
    'Yes, I received constructive feedback during quarterly reviews and in our one-on-ones.',
    'Yes, I understood the company mission and felt proud to be part of the organization.',
    'Consider offering more professional development programs and tuition reimbursement for certifications.',
    'The company has great potential and I would recommend it to friends and family looking for meaningful work.'
  ];

  return (
    <div>
      <h1>File Management</h1>
      
      <PDFDownloadLink
        document={
          <NDADocument
            employeeName={sampleNDAData.employeeName}
            employeeId={sampleNDAData.employeeId}
            employeeAddress={sampleNDAData.employeeAddress}
            signatureDay={sampleNDAData.signatureDay}
            signatureMonth={sampleNDAData.signatureMonth}
            signatureYear={sampleNDAData.signatureYear}
            signatureCity={sampleNDAData.signatureCity}
            dpoName={sampleNDAData.dpoName}
            dpoTitle={sampleNDAData.dpoTitle}
            witness1Name={sampleNDAData.witness1Name}
            witness1Title={sampleNDAData.witness1Title}
            witness2Name={sampleNDAData.witness2Name}
            witness2Title={sampleNDAData.witness2Title}
            firstPartyName={sampleNDAData.firstPartyName}
            firstPartyAddress={sampleNDAData.firstPartyAddress}
            firstPartyRepName={sampleNDAData.firstPartyRepName}
            firstPartyRepTitle={sampleNDAData.firstPartyRepTitle}
            partnerInstitution={sampleNDAData.partnerInstitution}
          />
        }
        fileName="nda-legal-size.pdf"
        style={{
          textDecoration: "none",
          padding: "8px 18px",
          color: "#fff",
          background: "#007bff",
          border: "none",
          borderRadius: "4px",
          marginRight: "10px",
          marginBottom: "10px",
          display: "inline-block"
        }}
      >
        {({ blob, url, loading, error }) =>
          loading ? 'Preparing document...' : 'Download NDA (Legal size)'
        }
      </PDFDownloadLink>

      <PDFDownloadLink
        document={
          <ResignationFormDocument 
            name={sampleResignationData.name}
            position={sampleResignationData.position}
            department={sampleResignationData.department}
            dateOfJoining={sampleResignationData.dateOfJoining}
            resignationDate={sampleResignationData.resignationDate}
            lastWorkingDay={sampleResignationData.lastWorkingDay}
            checkedReasons={sampleResignationData.checkedReasons}
            otherReason={sampleResignationData.otherReason}
            employeeSignDate={sampleResignationData.employeeSignDate}
            employeeSignName={sampleResignationData.employeeSignName}
            supervisorSignDate={sampleResignationData.supervisorSignDate}
            supervisorSignName={sampleResignationData.supervisorSignName}
          />
        }
        fileName="resignation-form.pdf"
        style={{
          textDecoration: "none",
          padding: "8px 18px",
          color: "#fff",
          background: "#007bff",
          border: "none",
          borderRadius: "4px",
          marginRight: "10px",
          marginBottom: "10px",
          display: "inline-block"
        }}
      >
        {({ blob, url, loading, error }) =>
          loading ? 'Preparing document...' : 'Download Resignation Form'
        }
      </PDFDownloadLink>

      <PDFDownloadLink
        document={
          <ExitClearanceFormDocument 
            employeeNumber={sampleClearanceData.employeeNumber}
            employeeName={sampleClearanceData.employeeName}
            supervisorName={sampleClearanceData.supervisorName}
            department={sampleClearanceData.department}
            dateOfHire={sampleClearanceData.dateOfHire}
            lastWorkingDay={sampleClearanceData.lastWorkingDay}
            effectivityDate={sampleClearanceData.effectivityDate}
            clearanceData={sampleClearanceData.clearanceData}
          />
        }
        fileName="exit-clearance-form.pdf"
        style={{
          textDecoration: "none",
          padding: "8px 18px",
          color: "#fff",
          background: "#007bff",
          border: "none",
          borderRadius: "4px",
          marginRight: "10px",
          marginBottom: "10px",
          display: "inline-block"
        }}
      >
        {({ blob, url, loading, error }) =>
          loading ? 'Preparing document...' : 'Download Exit Clearance Form'
        }
      </PDFDownloadLink>

      <PDFDownloadLink
        document={
          <ExitInterviewFormDocument 
            answers={sampleAnswers}
            name="Jane Smith"
            position="Senior Healthcare Specialist"
            date="2026-04-07"
          />
        }
        fileName="exit-interview-form.pdf"
        style={{
          textDecoration: "none",
          padding: "8px 18px",
          color: "#fff",
          background: "#007bff",
          border: "none",
          borderRadius: "4px",
          marginRight: "10px",
          marginBottom: "10px",
          display: "inline-block"
        }}
      >
        {({ blob, url, loading, error }) =>
          loading ? 'Preparing document...' : 'Download Exit Interview Form'
        }
      </PDFDownloadLink>
    </div>
  )
}

export default FileManagement