import React from "react";
import { AttendanceView } from "@/features/attendance/views/AttendanceView";

export default function Attendance({ shortcutMode = false }) {
  return <AttendanceView shortcutMode={shortcutMode} />;
}
