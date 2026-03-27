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
    <section className="mb-6 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 md:py-2.5">
        <h3 className="text-base font-semibold text-slate-900">
          Missing Requirements Tracker
        </h3>
        <button
          onClick={onOpenModal}
          className="rounded-md border-0 bg-[#5a1ea2] px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#4b1788] md:px-2.5 md:py-1"
        >
          Update Documents
        </button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              {[
                "Employee Name",
                "Designation",
                "Date Hired",
                "Missing Documents",
                "Last Updated",
              ].map((h) => (
                <TableHead
                  key={h}
                  className="h-9 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700 md:h-8"
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
                  className="py-5 text-center text-sm font-medium text-slate-500"
                >
                  All employees have submitted their complete requirements! 🎉
                </TableCell>
              </TableRow>
            ) : (
              missingDocs.map((doc) => (
                <TableRow key={doc.emp_id} className="hover:bg-slate-50/80">
                  <TableCell className="px-3 py-2.5 text-sm font-bold text-slate-900 md:py-2">
                    {doc.first_name} {doc.last_name}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-sm text-slate-700 md:py-2">
                    {doc.designation || "N/A"}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-sm text-slate-700 md:py-2">
                    {doc.hired_date
                      ? new Date(doc.hired_date).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-sm font-medium text-red-600 md:py-2">
                    <ul className="list-disc pl-4 space-y-0.5">
                      {doc.missing_docs.split(", ").map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-[11px] text-slate-500 md:py-2">
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
