import { create } from "zustand";

import { persist, createJSONStorage } from "zustand/middleware";
import { EmptyResigationField } from "@/assets/constantData.js";

type UseFieldStoreType = {
  resignationForm: ResignationForm;
  setField: <T extends keyof ResignationForm>(
    key: T,
    value: ResignationForm[T],
  ) => void;

  setArrayField: <T extends "leaving_reasons" | "interview_answers">(
    key: T,
    value: string,
    index?: number,
  ) => void;
  resetForm: () => void;
};

export const useFieldStore = create<UseFieldStoreType>()(
  persist(
    (set) => ({
      resignationForm: EmptyResigationField,
      setField: (key, value) =>
        set((state) => {
          return {
            resignationForm: {
              ...state.resignationForm,
              [key]: value,
            },
          };
        }),
      setArrayField: (key, value, index) =>
        set((state) => {
          switch (key) {
            case "interview_answers": {
              const updatedInterviewAnswer = [
                ...state.resignationForm.interview_answers,
              ];
              updatedInterviewAnswer[index!] = value as string;
              return {
                resignationForm: {
                  ...state.resignationForm,
                  interview_answers: updatedInterviewAnswer,
                },
              };
            }
            case "leaving_reasons": {
              const exist =
                state.resignationForm.leaving_reasons.includes(value);

              const updatedLeavingReasons = exist
                ? state.resignationForm.leaving_reasons.filter(
                    (item) => item !== value,
                  )
                : [...state.resignationForm.leaving_reasons, value];

              return {
                resignationForm: {
                  ...state.resignationForm,
                  leaving_reasons: updatedLeavingReasons,
                },
              };
            }
            default: {
              return {
                resignationForm: { ...state.resignationForm },
              };
            }
          }
        }),

      resetForm: () =>
        set({
          resignationForm: {
            ...EmptyResigationField,
            interview_answers: Array(16).fill(""),
            leaving_reasons: [],
          },
        }),
    }),

    {
      name: "resignation-form",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
