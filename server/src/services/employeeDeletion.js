const TABLES_TO_DELETE_BY_EMP_ID = [
  "leave_requests",
  "offset_applications",
  "resignations",
  "resignation_drafts",
  "offset_ledger",
  "notifications",
  "attendance",
  "payroll",
  "salary_history",
  "leave_balances",
];

const TABLES_TO_DISASSOCIATE = [
  {
    table: "employees",
    column: "reviewed_by",
  },
  {
    table: "resignations",
    column: "reviewed_by",
  },
  {
    table: "resignations",
    column: "recipient_emp_id",
  },
  {
    table: "offset_applications",
    column: "supervisor_emp_id",
  },
  {
    table: "offset_ledger",
    column: "supervisor_emp_id",
  },
];

const isMissingTableOrColumnError = (error) =>
  error?.code === "ER_NO_SUCH_TABLE" || error?.code === "ER_BAD_FIELD_ERROR";

const deleteFromTableByEmpId = async (connection, table, empId) => {
  try {
    await connection.query(`DELETE FROM ${table} WHERE emp_id = ?`, [empId]);
  } catch (error) {
    if (!isMissingTableOrColumnError(error)) {
      throw error;
    }
  }
};

const disassociateEmpIdReference = async (connection, table, column, empId) => {
  try {
    await connection.query(`UPDATE ${table} SET ${column} = NULL WHERE ${column} = ?`, [empId]);
  } catch (error) {
    if (!isMissingTableOrColumnError(error)) {
      throw error;
    }
  }
};

export const purgeEmployeeRelatedRecords = async (connection, empId) => {
  for (const table of TABLES_TO_DELETE_BY_EMP_ID) {
    await deleteFromTableByEmpId(connection, table, empId);
  }

  for (const reference of TABLES_TO_DISASSOCIATE) {
    await disassociateEmpIdReference(
      connection,
      reference.table,
      reference.column,
      empId,
    );
  }
};