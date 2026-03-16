import { useState } from "react";

const sampleAttendance = [
  {
    id: "WAH-002",
    name: "Rose Ann Biag",
    totalAbsences: 0,
    totalLeave: 3,
    status: "Present",
  },
  {
    id: "WAH-003",
    name: "Jhuvy Bondoc",
    totalAbsences: 2,
    totalLeave: 1,
    status: "Absent",
  },
  {
    id: "WAH-004",
    name: "Anna Katrina Yturralde",
    totalAbsences: 0,
    totalLeave: 0,
    status: "Present",
  },
  {
    id: "WAH-005",
    name: "Meryll Jen Lee",
    totalAbsences: 3,
    totalLeave: 4,
    status: "On Leave",
  },
  {
    id: "WAH-006",
    name: "Jaline Latoga",
    totalAbsences: 1,
    totalLeave: 2,
    status: "Present",
  },
  {
    id: "WAH-007",
    name: "Dominic Domantay",
    totalAbsences: 0,
    totalLeave: 1,
    status: "On Leave",
  },
  {
    id: "WAH-008",
    name: "Carla Shey Aguinaldo",
    totalAbsences: 1,
    totalLeave: 0,
    status: "Present",
  },
  {
    id: "WAH-009",
    name: "Robert Michael Martinez",
    totalAbsences: 0,
    totalLeave: 2,
    status: "Present",
  },
  {
    id: "WAH-010",
    name: "John Vincent Antonio",
    totalAbsences: 2,
    totalLeave: 1,
    status: "Present",
  },
];

const badgeClass = {
  Present: "bg-green-100 text-green-800",
  Absent: "bg-red-100 text-red-800",
  "On Leave": "bg-yellow-100 text-yellow-800",
};

export default function Attendance() {
  const [search, setSearch] = useState("");

  const filtered = sampleAttendance.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h1 className="m-0 text-[1.4rem] text-wah-dark">
          Attendance Management
        </h1>
      </div>

      <div className="mb-2.5">
        <input
          type="text"
          className="w-full max-w-[300px] px-3.5 py-2 rounded-[10px] border-[1.5px] border-gray-300 text-[0.95rem] outline-none focus:border-wah-light"
          placeholder="Search by name or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-xl overflow-hidden">
          <thead>
            <tr>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">
                Employee ID
              </th>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">
                Name
              </th>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">
                Total Absences
              </th>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">
                Total Leave
              </th>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">
                Today's Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-wah-table-hover">
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">
                  {a.id}
                </td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">
                  {a.name}
                </td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">
                  {a.totalAbsences}
                </td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">
                  {a.totalLeave}
                </td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">
                  <span
                    className={`px-3 py-0.5 rounded-full text-[0.78rem] font-semibold ${badgeClass[a.status] || ""}`}
                  >
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
