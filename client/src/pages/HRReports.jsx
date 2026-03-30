import { status } from "@/assets/constantData";
import { attendanceCount } from "@/components/queries/hrReports/queryHrReports";
import MonthYearPicker from "@/components/Reusables/MonthlyYearPicker";
import Select from "@/components/Reusables/Select";
import { useQuery } from "@tanstack/react-query";

import { useState } from "react";

export default function HRReports() {
  const [reportType, setReportType] = useState(undefined); // placeholder will show
  const [dateRange, setDateRange] = useState("month");
  const [selectedDate, setSelectedDate] = useState({
    year: 2025,
    month: 0,
  });

  const aCount = useQuery(attendanceCount);

  return (
    <div className="max-w-full">
      <div className="flex flex-row justify-between">
        <h1 className="m-0 text-[1.4rem] font-bold text-black mb-6">
          HR Reports
        </h1>
        <div className="flex flec-row gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Report Type
            </label>
            <Select
              value={reportType}
              setValue={setReportType}
              toMap={status}
            ></Select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Date Range
            </label>

            <MonthYearPicker
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            ></MonthYearPicker>
          </div>
        </div>
      </div>
    </div>
  );
}
