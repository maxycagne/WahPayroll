import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDailyAttendance } from "../api";
import { designationMap } from "../utils";

export const useDateDetails = (date: string | null) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [designation, setDesignation] = useState("All");
  const [position, setPosition] = useState("All");
  const [status, setStatus] = useState("All");

  const query = useQuery({
    queryKey: ["attendance-daily", date],
    queryFn: () => getDailyAttendance(date!),
    enabled: !!date && isOpen,
  });

  const filteredDaily = (query.data || []).filter((emp) => {
    const matchesSearch = `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(search.toLowerCase());
    const matchesDesignation = designation === "All" || emp.designation === designation;
    const matchesPosition = position === "All" || emp.position === position;
    
    let matchesStatus = true;
    if (status !== "All") {
      const primary = emp.attendance_status || "";
      const secondary = emp.status2 || "";
      if (status === "No Status") {
        matchesStatus = !primary && !secondary;
      } else {
        matchesStatus = primary === status || secondary === status;
      }
    }

    return matchesSearch && matchesDesignation && matchesPosition && matchesStatus;
  });

  return {
    isOpen, setIsOpen,
    search, setSearch,
    designation, setDesignation,
    position, setPosition,
    status, setStatus,
    loading: query.isLoading,
    filteredDaily
  };
};
