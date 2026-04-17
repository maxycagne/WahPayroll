import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  dashboardAttendanceSummaryQueryOptions,
  dashboardEmployeeLeavesQueryOptions,
  dashboardEmployeesQueryOptions,
  dashboardMyAttendanceQueryOptions,
  dashboardOffsetApplicationsQueryOptions,
  dashboardPayrollQueryOptions,
  dashboardResignationsQueryOptions,
  dashboardSummaryQueryOptions,
  dashboardSupervisorLeavesQueryOptions,
} from "@/features/dashboard/hooks/queryOptions";
import React from "react";

type AppUser = {
  role?: string;
  emp_id?: string | number;
} | null;

type PostLoginLoadingProps = {
  user?: AppUser;
};

const normalizeRole = (role?: string) => {
  if (role === "RankedAndFile") return "RankAndFile";
  return role;
};

export default function PostLoginLoading({ user }: PostLoginLoadingProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasStartedRef = useRef(false);
  const [error, setError] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);

  const role = normalizeRole(user?.role);
  const period = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [year, month] = useMemo(
    () => period.split("-").map(Number) as [number, number],
    [period],
  );
  const loadingPhrases = useMemo(
    () => [
      "juWHAN is running as fast as he can!",
      "Brewing your workspace experience...",
      "Warming up charts, cards, and clever bits...",
      "Synchronizing your role-specific dashboard...",
    ],
    [],
  );

  const targetPath = role === "HR" ? "/hr-dashboard" : "/dashboard";

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    const runPrefetch = async () => {
      try {
        const prefetches: Promise<unknown>[] = [];

        if (role === "Admin") {
          prefetches.push(
            queryClient.prefetchQuery(dashboardSummaryQueryOptions()),
            queryClient.prefetchQuery(dashboardEmployeesQueryOptions()),
            queryClient.prefetchQuery(dashboardPayrollQueryOptions(period)),
            queryClient.prefetchQuery(
              dashboardAttendanceSummaryQueryOptions(year, month),
            ),
          );
        } else if (role === "Supervisor") {
          prefetches.push(
            queryClient.prefetchQuery(dashboardSummaryQueryOptions()),
            queryClient.prefetchQuery(
              dashboardMyAttendanceQueryOptions(user?.emp_id),
            ),
            queryClient.prefetchQuery(dashboardSupervisorLeavesQueryOptions()),
            queryClient.prefetchQuery(
              dashboardOffsetApplicationsQueryOptions(),
            ),
            queryClient.prefetchQuery(dashboardResignationsQueryOptions()),
          );
        } else if (role === "RankAndFile") {
          prefetches.push(
            queryClient.prefetchQuery(dashboardSummaryQueryOptions()),
            queryClient.prefetchQuery(
              dashboardMyAttendanceQueryOptions(user?.emp_id),
            ),
            queryClient.prefetchQuery(dashboardEmployeeLeavesQueryOptions()),
            queryClient.prefetchQuery(
              dashboardOffsetApplicationsQueryOptions(),
            ),
          );
        }

        await Promise.all(prefetches);
        navigate(targetPath, { replace: true });
      } catch (_prefetchError: unknown) {
        setError("Warm-up failed. Redirecting to dashboard...");
        setTimeout(() => navigate(targetPath, { replace: true }), 1200);
      }
    };

    runPrefetch();
  }, [month, navigate, period, queryClient, role, targetPath, user, year]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % loadingPhrases.length);
    }, 1500);

    return () => window.clearInterval(timer);
  }, [loadingPhrases.length]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#3d0d74] via-[#50109a] to-[#6c2eb9] p-6">
      <div className="pointer-events-none absolute -left-24 -top-20 h-72 w-72 rounded-full bg-[#7b3fd6]/35 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-[#9b6bf0]/30 blur-3xl animate-pulse [animation-delay:350ms]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />

      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-7 text-white shadow-[0_20px_80px_-20px_rgba(120,77,255,0.55)] backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-violet-300 to-transparent" />

        <div className="mb-5 flex items-center justify-between">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/90">
            Booting {role || "User"} session
          </span>
          <span className="text-xs font-medium tracking-[0.18em] text-white/60">
            juWHAN
          </span>
        </div>

        <h1 className="m-0 text-2xl font-semibold leading-tight sm:text-3xl">
          {loadingPhrases[phraseIndex]}
        </h1>
        <p className="m-0 mt-3 max-w-lg text-sm text-white/75">
          Preloading your dashboard data, attendance context, and role actions
          before handoff.
        </p>

        <div className="mt-6 space-y-2.5">
          <div className="h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-violet-200 via-violet-300 to-violet-400 animate-pulse" />
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-violet-200/80 via-violet-300/80 to-transparent animate-pulse [animation-delay:250ms]" />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-violet-200 animate-bounce" />
          <span className="h-2.5 w-2.5 rounded-full bg-violet-300 animate-bounce [animation-delay:150ms]" />
          <span className="h-2.5 w-2.5 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
          <span className="ml-2 text-xs tracking-wide text-white/70">
            Initializing modules...
          </span>
        </div>

        {error && (
          <p className="m-0 mt-5 rounded-xl border border-amber-300/40 bg-amber-200/15 px-3 py-2 text-xs font-semibold text-amber-100">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
