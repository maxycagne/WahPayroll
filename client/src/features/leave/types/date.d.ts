type DateDiffInclusive = {
  start: DateInput;
  end: DateInput;
};
type IsInRange = {
  date: DateInput;
  from: DateInput;
  to: DateInput;
};

type DateInput = string | Date | null | undefined;
