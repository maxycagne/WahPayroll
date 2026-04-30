import React from "react";
import { Search, Users, RefreshCw, Shield, Archive } from "lucide-react";

interface FileManagementHeaderProps {
  role: string;
  roleLabels: Record<string, string>;
  stats: { label: string; value: number | string }[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  designationFilter: string;
  setDesignationFilter: (value: string) => void;
  designationOptions: { value: string; label: string }[];
  onRefresh: () => void;
  onOpenTemplates: () => void;
  showArchived: boolean;
  setShowArchived: (value: boolean) => void;
  counts: { active: number; archived: number };
  canArchive: boolean;
}

export const FileManagementHeader: React.FC<FileManagementHeaderProps> = ({
  role,
  roleLabels,
  stats,
  searchTerm,
  setSearchTerm,
  designationFilter,
  setDesignationFilter,
  designationOptions,
  onRefresh,
  onOpenTemplates,
  showArchived,
  setShowArchived,
  counts,
  canArchive,
}) => {
  const visibleStats = stats.filter(s => canArchive || s.label !== "Archived Files");

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <>
        <div className={`transition-colors duration-500 ${
          showArchived 
            ? "bg-gradient-to-r from-amber-950 via-amber-900 to-amber-800" 
            : "bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800"
        } px-4 py-4 text-white md:px-5`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="m-0 text-[11px] font-bold uppercase tracking-[0.28em] text-white/55">
                {showArchived ? "Archive Page" : "File Management"}
              </p>
              <h1 className="m-0 mt-1 text-xl font-bold tracking-tight md:text-2xl">
                {showArchived ? "Archived Documents" : (roleLabels[role] || "File Portal")}
              </h1>
              <p className="m-0 mt-1 max-w-xl text-xs text-white/70 md:text-sm">
                Manage resignation document groups per application, including
                generated forms and uploaded files, with quick preview,
                download, and status tracking.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {visibleStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 backdrop-blur"
                >
                  <p className="m-0 text-[10px] font-semibold uppercase tracking-wider text-white/55">
                    {stat.label}
                  </p>
                  <p className="m-0 mt-1 text-lg font-bold text-white md:text-xl">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex border-b border-white/10">
            {[
              { label: "Active Files", value: false, count: counts.active },
              { label: "Archive", value: true, count: counts.archived },
            ].filter(tab => canArchive || !tab.value).map((tab) => (
              <button
                key={tab.label}
                onClick={() => setShowArchived(tab.value)}
                className={`relative flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors ${
                  showArchived === tab.value
                    ? "text-white"
                    : "text-white/40 hover:text-white/60"
                } ${
                  showArchived === tab.value
                    ? (tab.value ? "bg-amber-500/10" : "bg-sky-500/10")
                    : ""
                } rounded-t-xl`}
              >
                {tab.label}
                <span
                  className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black leading-none text-white ${
                    tab.value ? "bg-amber-500" : "bg-sky-500"
                  }`}
                >
                  {tab.count}
                </span>
                {showArchived === tab.value && (
                  <div
                    className={`absolute bottom-0 left-0 h-1 w-full rounded-t-full ${
                      tab.value ? "bg-amber-400" : "bg-sky-400"
                    }`}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="border-b border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 md:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 px-3 py-2">
                <Search className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={role === "RankAndFile" ? "Search file name..." : "Search employee, position, designation, or file name"}
                  className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-gray-200"
                />
              </div>

              {(role === "Admin" || role === "HR") && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
                  <Users className="h-4 w-4 shrink-0 text-slate-400 dark:text-gray-500" />
                  <div className="flex flex-wrap gap-2">
                    {designationOptions.map((option) => {
                      const isActive = designationFilter === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setDesignationFilter(option.value)}
                          aria-pressed={isActive}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                            isActive
                              ? "bg-slate-900 dark:bg-gray-100 text-white dark:text-gray-900"
                              : "bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-700"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                type="button"
                onClick={onOpenTemplates}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-gray-100 px-3 py-2 text-xs font-semibold text-white dark:text-gray-900 hover:bg-slate-800 dark:hover:bg-gray-200 cursor-pointer"
              >
                <Shield className="h-4 w-4" />
                Templates
              </button>
            </div>
          </div>
        </div>
      </>
    </div>
  );
};
