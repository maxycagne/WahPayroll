import { EmptyResigationField } from "@/assets/constantData";
import { useReducer } from "react";

type State = {
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

  leaving_reasons: string[];
  leaving_reason_other: string;

  interview_answers: string[];

  endorsement_file_key: string;
  endorsement_file_name: string;
};

type Action =
  | {
      type: "CHANGE_FIELD";
      field: keyof State;
      value: string | number;
    }
  | {
      type: "RESET_FORM";
    }
  | {
      type: "SET_LEAVING_REASONS";
      index: number;
      value: string;
    }
  | {
      type: "SET_INTERVIEW_ANSWER";
      index: number;
      value: string;
    };

const reducer = (state: State, action: Action): State => {
  const type = action.type;

  switch (type) {
    case "CHANGE_FIELD": {
      return {
        ...state,
        [action.field]: action.value,
      };
    }
    case "SET_LEAVING_REASONS": {
      const updatedLeavingReasons = [...state.leaving_reasons];
      updatedLeavingReasons[action.index] = action.value;
      return {
        ...state,
        leaving_reasons: updatedLeavingReasons,
      };
    }
    case "SET_INTERVIEW_ANSWER": {
      const updatedInterviewAnswer = [...state.interview_answers];
      updatedInterviewAnswer[action.index] = action.value;

      return {
        ...state,
        interview_answers: updatedInterviewAnswer,
      };
    }
    case "RESET_FORM": {
      return EmptyResigationField;
    }
    default: {
      return state;
    }
  }
};

const useResignationField = () => {
  const [state, dispatch] = useReducer(reducer, EmptyResigationField);

  return {
    state,
    dispatch,
  };
};

export default useResignationField;
