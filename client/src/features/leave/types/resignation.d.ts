interface CurrentUserLike {
  emp_id?: string | number | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  position?: string | null;
  designation?: string | null;
  hired_date?: string | null;
}

interface ResignationWizardState {
  resignation_letter: string;
  request_date: string;
  recipient_name: string;
  recipient_emp_id: string;
  employee_name: string;
  position: string;
  designation: string;
  hired_date: string;
  resignation_date: string;
  last_working_day: string;
  immediate_resignation: boolean;
  leaving_reasons: string[];
  leaving_reason_other: string;
  interview_answers: string[];
  endorsement_file_key: string;
  endorsement_file_name: string;
}

interface ResignationRecipient {
  request_date?: string;
  recipient_name?: string;
  recipient_emp_id?: string;
}

interface ResignationDraftData {
  payload?: Partial<ResignationWizardState>;
  step?: number | string;
  interviewPart?: number | string;
}

interface SaveResignationDraftVariables {
  payload: ResignationWizardState;
  step: number;
  interviewPart: number;
}

interface UploadedFileMeta {
  key: string;
  fileName?: string;
}

interface SubmitResignationPayload {
  emp_id?: string | number | null;
  resignation_type: string;
  effective_date: string;
  reason: string;
  resignation_letter: string;
  recipient_name: string;
  recipient_emp_id: string | null;
  resignation_date: string;
  immediate_resignation?: boolean;
  last_working_day: string | null;
  leaving_reasons: string[];
  leaving_reason_other: string;
  exit_interview_answers: string[];
  endorsement_file_key: string;
}

interface FileResignationMutationLike {
  mutate?: (
    payload: SubmitResignationPayload,
    options?: {
      onSuccess?: () => void;
      onError?: (error: unknown) => void;
    },
  ) => void;
  mutateAsync?: (payload: SubmitResignationPayload) => Promise<unknown>;
  isPending?: boolean;
}

interface ResignationFormProps {
  setApplicationModalOpen: (open: boolean) => void;
  fileResignationMutation?: FileResignationMutationLike;
  currentUser?: CurrentUserLike | null;
}
type ResignationForm = {
  resignation_letter: string;

  request_date: string;

  recipient_name: string;
  recipient_emp_id: string;

  employee_name: string;
  position: string;
  designation: string;

  hired_date: string;
  resignation_date: string;
  last_working_day: string;
  immediate_resignation: boolean;

  leaving_reasons: string[];
  leaving_reason_other: string;

  interview_answers: string[];

  endorsement_file_key: string;
  endorsement_file_name: string;
};
