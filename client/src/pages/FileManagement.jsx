import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import NDADocument from '../components/pdfTemps/NDADocument.jsx';
import ResignationFormDocument from '../components/pdfTemps/ResignationFormDoc.jsx';
import ExitClearanceFormDocument from '../components/pdfTemps/ExitClearanceForm.jsx';
import ExitInterviewFormDocument from '../components/pdfTemps/ExitInterviewForm.jsx';

const FileManagement = () => {
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
      <PDFDownloadLink
        document={<NDADocument /* pass any props you want here */ />}
        fileName="nda-legal-size.pdf"
        style={{
          textDecoration: "none",
          padding: "8px 18px",
          color: "#fff",
          background: "#007bff",
          border: "none",
          borderRadius: "4px"
        }}
      >
        {({ blob, url, loading, error }) =>
          loading ? 'Preparing document...' : 'Download NDA (Legal size)'
        }
      </PDFDownloadLink>

      <PDFDownloadLink
        document={<ResignationFormDocument /* pass any props you want here */ />}
        fileName="resignation-form.pdf"
        style={{
          textDecoration: "none",
          padding: "8px 18px",
          color: "#fff",
          background: "#007bff",
          border: "none",
          borderRadius: "4px"
        }}
      >
        {({ blob, url, loading, error }) =>
          loading ? 'Preparing document...' : 'Download Resignation Form'
        }
      </PDFDownloadLink>

      <PDFDownloadLink
        document={<ExitClearanceFormDocument /* pass any props you want here */ />}
        fileName="exit-clearance-form.pdf"
        style={{
          textDecoration: "none",
          padding: "8px 18px",
          color: "#fff",
          background: "#007bff",
          border: "none",
          borderRadius: "4px"
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
            name="John Doe"
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
          borderRadius: "4px"
        }}
      >
        {({ blob, url, loading, error }) =>
          loading ? 'Preparing document...' : 'Download Exit Interview Form'
        }
      </PDFDownloadLink>

      <h1>File Management</h1>
    </div>
  )
}

export default FileManagement