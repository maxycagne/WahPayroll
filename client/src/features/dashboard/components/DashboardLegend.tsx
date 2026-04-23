import React from "react";
import { Legend } from "recharts";

export const DashboardLegend = () => (
  <Legend
    iconType="circle"
    iconSize={8}
    wrapperStyle={{
      fontSize: "11px",
      fontWeight: 600,
      color: "#475569",
      paddingTop: "8px",
    }}
  />
);
