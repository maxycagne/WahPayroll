import { STANDARD_DOCUMENTS } from "@/assets/constantData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MissingDocsTracker({ missingDocs, onOpenModal }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm mb-8">
      <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Missing Requirements Tracker
        </h3>
        <button
          onClick={onOpenModal}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-all duration-200 hover:shadow-md border-0 shadow-sm"
        >
          Update Documents
        </button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {[
                "Employee Name",
                "Designation",
                "Date Hired",
                "Missing Documents",
                "Last Updated",
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
            {!missingDocs || missingDocs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-gray-500 font-medium py-6"
                >
                  All employees have submitted their complete requirements! 🎉
                </TableCell>
              </TableRow>
            ) : (
              missingDocs.map((doc) => (
                <TableRow key={doc.emp_id}>
                  <TableCell className="font-bold text-gray-900">
                    {doc.first_name} {doc.last_name}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {doc.designation || "N/A"}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {doc.hired_date
                      ? new Date(doc.hired_date).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-red-600 font-medium">
                    <ul className="list-disc pl-4 space-y-0.5">
                      {doc.missing_docs.split(", ").map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {new Date(doc.updated_at).toLocaleString()}
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
