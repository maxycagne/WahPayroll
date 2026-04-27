import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const LOGO_URL = "/images/wah-top-logo.png";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 28,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingBottom: 10,
  },
  logo: {
    width: 52,
    height: 52,
    objectFit: "contain",
    marginRight: 10,
  },
  headingWrap: {
    flexGrow: 1,
  },
  orgTitle: {
    fontSize: 11,
    fontWeight: 700,
  },
  reportTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginTop: 2,
  },
  reportMeta: {
    fontSize: 8,
    color: "#4b5563",
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  tableRow: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  colName: {
    width: "26%",
    padding: 6,
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 8.5,
  },
  colBasic: {
    width: "12%",
    padding: 6,
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 8.5,
    textAlign: "right",
  },
  colGross: {
    width: "14%",
    padding: 6,
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 8.5,
    textAlign: "right",
  },
  colDeduction: {
    width: "18%",
    padding: 6,
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 8,
  },
  colIncentive: {
    width: "16%",
    padding: 6,
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 8,
  },
  colNet: {
    width: "14%",
    padding: 6,
    fontSize: 8.5,
    textAlign: "right",
  },
  headText: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  typeText: {
    marginTop: 2,
    fontSize: 7,
    color: "#4b5563",
  },
  rowStrong: {
    fontWeight: 700,
    fontSize: 8.5,
  },
  footer: {
    position: "absolute",
    bottom: 14,
    left: 28,
    right: 28,
    textAlign: "right",
    fontSize: 8,
    color: "#6b7280",
  },
});

const money = (value) => {
  const amount = Number(value || 0);
  if (Number.isNaN(amount)) return "0.00";
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatTextDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
};

const formatDatePeriod = (period) => {
  const match = String(period || "").match(/^(\d{4})-(\d{2})$/);
  if (!match) return formatTextDate(period);

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const startDate = new Date(year, monthIndex, 1);
  const endDate = new Date(year, monthIndex + 1, 0);

  return `${formatTextDate(startDate)} - ${formatTextDate(endDate)}`;
};

const parseReasonAmountPair = (rawLine) => {
  const line = String(rawLine || "").trim();
  if (!line) return { label: "", amount: null };

  const parts = line.split("=");
  if (parts.length >= 2) {
    const label = parts.shift()?.trim() || "";
    const rawAmount = parts
      .join("=")
      .trim()
      .replace(/^₱/, "")
      .replace(/,/g, "");
    const numericAmount = Number(rawAmount);
    return {
      label,
      amount: Number.isFinite(numericAmount) ? numericAmount : null,
    };
  }

  return { label: line, amount: null };
};

const parseReasonLines = (rawValue) => {
  if (!rawValue) return [];

  return String(rawValue)
    .split(" | ")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => parseReasonAmountPair(item))
    .filter((item) => item.label);
};

export default function PayrollSummaryDoc({
  rows = [],
  period = "",
  logoUrl = LOGO_URL,
}) {
  const generatedAt = formatTextDate(new Date());
  const datePeriod = formatDatePeriod(period);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.headerRow}>
          <Image src={logoUrl} style={styles.logo} />
          <View style={styles.headingWrap}>
            <Text style={styles.orgTitle}>Wireless Access for Health</Text>
            <Text style={styles.reportTitle}>Payroll Summary Report</Text>
            <Text style={styles.reportMeta}>Date Period: {datePeriod}</Text>
            <Text style={styles.reportMeta}>Generated: {generatedAt}</Text>
          </View>
        </View>

        <View style={styles.tableHeader} fixed>
          <View style={styles.colName}>
            <Text style={styles.headText}>Name</Text>
          </View>
          <View style={styles.colBasic}>
            <Text style={styles.headText}>Basic Pay</Text>
          </View>
          <View style={styles.colIncentive}>
            <Text style={styles.headText}>Incentives (Types)</Text>
          </View>
          <View style={styles.colGross}>
            <Text style={styles.headText}>Total Salary (Gross)</Text>
          </View>
          <View style={styles.colDeduction}>
            <Text style={styles.headText}>Deductions (Types)</Text>
          </View>
          <View style={styles.colNet}>
            <Text style={styles.headText}>Net Pay</Text>
          </View>
        </View>

        {rows.map((row, index) => {
          const employeeName =
            `${row.first_name || ""} ${row.last_name || ""}`.trim() ||
            "Employee";
          const deductionItems = parseReasonLines(row.deduction_reasons);
          const incentiveItems = parseReasonLines(row.incentive_reasons);

          return (
            <View
              key={`${row.emp_id || "emp"}-${index}`}
              style={styles.tableRow}
              wrap={false}
            >
              <View style={styles.colName}>
                <Text style={styles.rowStrong}>{employeeName}</Text>
              </View>

              <View style={styles.colBasic}>
                <Text>{money(row.basic_pay)}</Text>
              </View>

              <View style={styles.colIncentive}>
                <Text>{money(row.incentives)}</Text>
                {incentiveItems.length > 0 ? (
                  incentiveItems.map((item, itemIndex) => (
                    <Text
                      key={`incentive-${index}-${itemIndex}`}
                      style={styles.typeText}
                    >
                      {item.label} ={" "}
                      {item.amount == null ? "-" : money(item.amount)}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.typeText}>No incentive type</Text>
                )}
              </View>

              <View style={styles.colGross}>
                <Text style={styles.rowStrong}>
                  {money(
                    row.gross_pay ??
                      Number(row.basic_pay || 0) + Number(row.incentives || 0),
                  )}
                </Text>
              </View>

              <View style={styles.colDeduction}>
                <Text>{money(row.absence_deductions)}</Text>
                {deductionItems.length > 0 ? (
                  deductionItems.map((item, itemIndex) => (
                    <Text
                      key={`deduction-${index}-${itemIndex}`}
                      style={styles.typeText}
                    >
                      {item.label} ={" "}
                      {item.amount == null ? "-" : money(item.amount)}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.typeText}>No deduction type</Text>
                )}
              </View>

              <View style={styles.colNet}>
                <Text style={styles.rowStrong}>{money(row.net_pay)}</Text>
              </View>
            </View>
          );
        })}

        {/* Totals Row */}
        <View
          style={[
            styles.tableRow,
            {
              backgroundColor: "#f3f4f6",
              borderTopWidth: 2,
              borderTopColor: "#374151",
            },
          ]}
          wrap={false}
        >
          <View style={styles.colName}>
            <Text style={[styles.rowStrong, { fontSize: 9 }]}>
              TOTAL ({rows.length} employees)
            </Text>
          </View>
          <View style={styles.colBasic}>
            <Text style={styles.rowStrong}>
              {money(
                rows.reduce((sum, r) => sum + Number(r.basic_pay || 0), 0),
              )}
            </Text>
          </View>
          <View style={styles.colIncentive}>
            <Text style={styles.rowStrong}>
              {money(
                rows.reduce((sum, r) => sum + Number(r.incentives || 0), 0),
              )}
            </Text>
          </View>
          <View style={styles.colGross}>
            <Text style={styles.rowStrong}>
              {money(
                rows.reduce(
                  (sum, r) =>
                    sum +
                    Number(
                      r.gross_pay ??
                        Number(r.basic_pay || 0) + Number(r.incentives || 0),
                    ),
                  0,
                ),
              )}
            </Text>
          </View>
          <View style={styles.colDeduction}>
            <Text style={styles.rowStrong}>
              {money(
                rows.reduce(
                  (sum, r) => sum + Number(r.absence_deductions || 0),
                  0,
                ),
              )}
            </Text>
          </View>
          <View style={styles.colNet}>
            <Text style={[styles.rowStrong, { fontSize: 9 }]}>
              {money(rows.reduce((sum, r) => sum + Number(r.net_pay || 0), 0))}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
