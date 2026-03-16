import { useState } from "react";

const sampleEmployees = [
  {
    id: "WAH-002",
    name: "Rose Ann Biag",
    designation: "Manager",
    position: "Manager",
    status: "Permanent",
    email: "roseann@wah.org",
    dob: "1990-07-22",
    hired: "2019-03-01",
  },
  {
    id: "WAH-003",
    name: "Jhuvy Bondoc",
    designation: "Supervising Partner",
    position: "Finance and Operations",
    status: "Permanent",
    email: "jhuvy@wah.org",
    dob: "1992-11-05",
    hired: "2020-06-10",
  },
  {
    id: "WAH-004",
    name: "Anna Katrina Yturralde",
    designation: "Supervising Partner",
    position: "Health Program",
    status: "Permanent",
    email: "anna@wah.org",
    dob: "1991-02-18",
    hired: "2020-06-10",
  },
  {
    id: "WAH-005",
    name: "Meryll Jen Lee",
    designation: "Assistant Partner",
    position: "Finance & Operations",
    status: "Casual",
    email: "meryll@wah.org",
    dob: "1996-09-30",
    hired: "2021-01-12",
  },
  {
    id: "WAH-006",
    name: "Jaline Latoga",
    designation: "Admin & HR Partner",
    position: "Operations",
    status: "Permanent",
    email: "jaline@wah.org",
    dob: "1994-03-14",
    hired: "2021-01-12",
  },
  {
    id: "WAH-007",
    name: "Dominic Domantay",
    designation: "Health Program Partner",
    position: "Health Program",
    status: "PGT Employee",
    email: "dominic@wah.org",
    dob: "1997-08-25",
    hired: "2022-02-01",
  },
  {
    id: "WAH-008",
    name: "Carla Shey Aguinaldo",
    designation: "Health Program Partner",
    position: "Health Program",
    status: "PGT Employee",
    email: "carla@wah.org",
    dob: "1998-12-01",
    hired: "2022-02-01",
  },
  {
    id: "WAH-009",
    name: "Robert Michael Martinez",
    designation: "Supervising Partner",
    position: "Network & Systems",
    status: "Permanent",
    email: "robert@wah.org",
    dob: "1993-06-20",
    hired: "2020-08-15",
  },
  {
    id: "WAH-010",
    name: "John Vincent Antonio",
    designation: "Senior Partner",
    position: "Platform Innovation",
    status: "Permanent",
    email: "john@wah.org",
    dob: "1995-01-10",
    hired: "2021-05-20",
  },
];

const positions = [
  "Operations",
  "Finance and Operations",
  "Health Program",
  "Platform Innovation",
  "Network & Systems",
];

function getNextId(employees) {
  const maxNum = employees.reduce((max, e) => {
    const n = parseInt(e.id.replace("WAH-", ""), 10);
    return n > max ? n : max;
  }, 0);
  return "WAH-" + String(maxNum + 1).padStart(3, "0");
}

const statusClasses = {
  Permanent: "bg-green-100 text-green-800",
  Casual: "bg-blue-100 text-blue-900",
  "PGT Employee": "bg-yellow-100 text-yellow-800",
  "Job Order": "bg-gray-200 text-gray-700",
};

export default function Employees() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [firstName, setFirstName] = useState("");

  const nextId = getNextId(sampleEmployees);
  const autoPassword = nextId + firstName;

  const filtered = sampleEmployees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h1 className="m-0 text-[1.4rem] text-wah-dark">Employee Management</h1>
        <button
          className="px-[22px] py-2.5 rounded-[10px] border-0 text-white text-[0.95rem] font-semibold cursor-pointer bg-gradient-to-r from-wah-primary to-wah-lighter hover:opacity-90"
          onClick={() => setShowModal(true)}
        >
          + Add Employee
        </button>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/45 grid place-items-center z-50 p-6"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-wah-card rounded-[14px] p-8 w-full max-w-[900px] max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="m-0 mb-5 text-wah-dark text-[1.2rem]">
              Add New Employee
            </h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[0.85rem] text-gray-500 font-semibold">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={nextId}
                  disabled
                  className="px-3 py-2.5 rounded-[10px] border-[1.5px] border-gray-300 text-[0.92rem] outline-none font-[inherit] bg-gray-100 text-gray-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.85rem] text-gray-500 font-semibold">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Last Name"
                  className="px-3 py-2.5 rounded-[10px] border-[1.5px] border-gray-300 text-[0.92rem] outline-none font-[inherit] focus:border-wah-light"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.85rem] text-gray-500 font-semibold">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="px-3 py-2.5 rounded-[10px] border-[1.5px] border-gray-300 text-[0.92rem] outline-none font-[inherit] focus:border-wah-light"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.85rem] text-gray-500 font-semibold">
                  M.I.
                </label>
                <input
                  type="text"
                  placeholder="M.I."
                  className="px-3 py-2.5 rounded-[10px] border-[1.5px] border-gray-300 text-[0.92rem] outline-none font-[inherit] focus:border-wah-light"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.85rem] text-gray-500 font-semibold">
                  Designation
                </label>
                <input
                  type="text"
                  placeholder="Designation"
                  className="px-3 py-2.5 rounded-[10px] border-[1.5px] border-gray-300 text-[0.92rem] outline-none font-[inherit] focus:border-wah-light"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.85rem] text-gray-500 font-semibold">
                  Position
                </label>
                <select
                  defaultValue=""
                  className="px-3 py-2.5 rounded-[10px] border-[1.5px] border-gray-300 text-[0.92rem] outline-none font-[inherit] focus:border-wah-light"
                >
                  <option value="" disabled>
                    Select Position
                  </option>
                  {positions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.85rem] text-gray-500 font-semibold">
                  Employee Status
                </label>
                <select className="px-3 py-2.5 rounded-[10px] border-[1.5px] border-gray-300 text-[0.92rem] outline-none font-[inherit] focus:border-wah-light">
                  <option>PGT Employee</option>
                  <option>Permanent</option>
                  <option>Casual</option>
                  <option>Job Order</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.85rem] text-gray-500 font-semibold">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Email"
                  className="px-3 py-2.5 rounded-[10px] border-[1.5px] border-gray-300 text-[0.92rem] outline-none font-[inherit] focus:border-wah-light"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.85rem] text-gray-500 font-semibold">
                  Date of Birth
                </label>
                <input
                  type="date"
                  className="px-3 py-2.5 rounded-[10px] border-[1.5px] border-gray-300 text-[0.92rem] outline-none font-[inherit] focus:border-wah-light"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.85rem] text-gray-500 font-semibold">
                  Hired Date
                </label>
                <input
                  type="date"
                  className="px-3 py-2.5 rounded-[10px] border-[1.5px] border-gray-300 text-[0.92rem] outline-none font-[inherit] focus:border-wah-light"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.85rem] text-gray-500 font-semibold">
                  Password
                </label>
                <input
                  type="text"
                  value={autoPassword}
                  disabled
                  className="px-3 py-2.5 rounded-[10px] border-[1.5px] border-gray-300 text-[0.92rem] outline-none font-[inherit] bg-gray-100 text-gray-400"
                />
              </div>
            </div>
            <div className="mt-[18px] flex gap-2.5">
              <button className="px-[22px] py-2.5 rounded-[10px] border-0 text-white text-[0.95rem] font-semibold cursor-pointer bg-gradient-to-r from-wah-primary to-wah-lighter hover:opacity-90">
                Save Employee
              </button>
              <button
                className="px-[22px] py-2.5 rounded-[10px] border-[1.5px] border-wah-light bg-transparent text-wah-primary text-[0.95rem] font-semibold cursor-pointer"
                onClick={() => {
                  setShowModal(false);
                  setFirstName("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
                Designation
              </th>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">
                Position
              </th>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">
                Status
              </th>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">
                Email
              </th>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">
                Hired Date
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => (
              <tr key={emp.id} className="hover:bg-wah-table-hover">
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">
                  {emp.id}
                </td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">
                  {emp.name}
                </td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">
                  {emp.designation}
                </td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">
                  {emp.position}
                </td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">
                  <span
                    className={`px-3 py-0.5 rounded-full text-[0.78rem] font-semibold ${statusClasses[emp.status] || ""}`}
                  >
                    {emp.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">
                  {emp.email}
                </td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">
                  {emp.hired}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
