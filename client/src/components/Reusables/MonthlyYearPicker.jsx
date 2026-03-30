import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import Select from "./Select";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function MonthYearPicker({ selectedDate, setSelectedDate }) {
  const today = new Date();

  const [open, setOpen] = useState(false);

  const years = Array.from(
    { length: 20 },
    (_, i) => today.getFullYear() - 10 + i,
  );

  const handleSelect = () => {
    setOpen(false);

    console.log("Selected:", selectedDate.month + 1, selectedDate.year);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {months[selectedDate.month]} {selectedDate.year}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 flex flex-col gap-2">
        <select
          value={selectedDate.month}
          onChange={(e) =>
            setSelectedDate({ ...selectedDate, month: Number(e.target.value) })
          }
          className="border rounded p-2"
        >
          {months.map((m, i) => (
            <option key={i} value={i}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={selectedDate.year}
          onChange={(e) =>
            setSelectedDate({ ...selectedDate, year: Number(e.target.value) })
          }
          className="border rounded p-2"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <Button variant="default" onClick={handleSelect}>
          Select
        </Button>
      </PopoverContent>
    </Popover>
  );
}
