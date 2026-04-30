export default function OffsetBalanceCard({ offsetBalance }) {
  return (
    <div className="overflow-hidden rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50 dark:bg-indigo-900/10 shadow-sm">
      <div className="border-b border-indigo-200 dark:border-indigo-900/30 px-4 py-3">
        <h3 className="m-0 text-sm font-bold text-indigo-900 dark:text-indigo-400">
          Monthly Offset Balance
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 text-sm md:grid-cols-4">
        <div className="rounded-lg border border-indigo-50 dark:border-indigo-900/20 bg-white dark:bg-gray-800 p-2.5 text-center shadow-sm">
          <p className="mb-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Working Days
          </p>
          <p className="text-lg font-black text-indigo-900 dark:text-indigo-100">
            {Number(offsetBalance.workingDaysCompleted || 0).toFixed(1)}
          </p>
        </div>
        <div className="rounded-lg border border-indigo-50 dark:border-indigo-900/20 bg-white dark:bg-gray-800 p-2.5 text-center shadow-sm">
          <p className="mb-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Baseline
          </p>
          <p className="text-lg font-black text-indigo-900 dark:text-indigo-100">
            {offsetBalance.baselineDays || 22}
          </p>
        </div>
        <div className="rounded-lg border border-indigo-50 dark:border-indigo-900/20 bg-white dark:bg-gray-800 p-2.5 text-center shadow-sm">
          <p className="mb-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-green-600 dark:text-green-500">
            Earned Offsets
          </p>
          <p className="text-lg font-black text-green-700 dark:text-green-400">
            +{Number(offsetBalance.offsetEarned || 0).toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-indigo-50 dark:border-indigo-900/20 bg-white dark:bg-gray-800 p-2.5 text-center shadow-sm">
          <p className="mb-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            End Balance
          </p>
          <p className="text-lg font-black text-purple-700 dark:text-purple-300">
            {Number(offsetBalance.finalBalance || 0).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
