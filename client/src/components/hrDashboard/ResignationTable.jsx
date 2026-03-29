import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ResignationTable({ resignations, mutation }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm mb-8">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Pending Resignation Approval
        </h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {[
                "Date",
                "Employee",
                "Resignation Type",
                "Status",
                "Actions",
              ].map((h) => (
                <TableHead
                  key={h}
                  className="text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!resignations || resignations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-gray-500 font-medium py-6"
                >
                  No pending resignations.
                </TableCell>
              </TableRow>
            ) : (
              resignations.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-gray-900">
                    {new Date(r.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-gray-900">
                      {r.first_name} {r.last_name}
                    </div>
                    <div className="text-xs text-gray-500">ID: {r.emp_id}</div>
                  </TableCell>
                  <TableCell>
                    <div>{r.resignation_type}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Effective:{" "}
                      {new Date(r.effective_date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 text-yellow-800 border-yellow-200"
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.status === "Pending Approval" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            mutation.mutate({ id: r.id, status: "Approved" })
                          }
                          disabled={mutation.isPending}
                          className="px-3 py-1 rounded-md bg-green-100 text-green-700 text-xs font-bold hover:bg-green-200 border-0 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            mutation.mutate({ id: r.id, status: "Denied" })
                          }
                          disabled={mutation.isPending}
                          className="px-3 py-1 rounded-md bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200 border-0 disabled:opacity-50"
                        >
                          Deny
                        </button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
