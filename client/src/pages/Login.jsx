import { useState } from "react";
import axiosInterceptor from "../hooks/interceptor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";

const STORAGE_TOKEN_KEY = "wah_token";
const STORAGE_USER_KEY = "wah_user";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleLocalLogin = (token, nextUser) => {
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser));
  };

  const login = useMutation({
    mutationFn: async ({ username, password }) => {
      const res = await axiosInterceptor.post("/api/auth/login", {
        username,
        password,
      });
      const data = res.data;
      handleLocalLogin(data.token, data.user);
      window.location.href =
        data.user.role === "HR" ? "/hr-dashboard" : "/dashboard";
    },
  });

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl grid-cols-1 gap-5 md:min-h-[calc(100vh-3rem)] md:grid-cols-5">
        <Card className="relative col-span-2 overflow-hidden border-0 bg-linear-to-br from-[#50109a] via-[#6d28d9] to-wah-accent shadow-2xl hidden md:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.18),transparent_35%)]" />
          <div className="relative flex h-full flex-col justify-between p-8 text-white md:p-10">
            <div>
              <div className="mb-10 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
                  <img
                    src="/images/wah-logo.png"
                    alt="WAH logo"
                    className="h-9 w-9 object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/60">
                    WAH Payroll
                  </p>
                  <h2 className="text-lg font-semibold text-white">
                    Wireless Access For Health
                  </h2>
                </div>
              </div>
              <div className="space-y-4">
                <h1 className="max-w-sm text-3xl font-bold leading-tight md:text-4xl">
                  Payroll and employee management, all in one workspace.
                </h1>
                <p className="max-w-md text-sm leading-7 text-white/75 md:text-base">
                  Access employee records, attendance, payroll, leave requests,
                  and HR tools securely through a unified internal platform.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="col-span-3 flex items-center justify-center">
          <div className="w-full max-w-2xl border-0">
            <CardHeader className="space-y-2 px-8 pt-8 md:px-10 md:pt-10">
              <CardTitle className="text-3xl font-bold text-slate-900">
                Login to your account
              </CardTitle>
              <CardDescription className="text-sm text-slate-500 md:text-base">
                Enter your credentials below to continue to your account.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8 md:px-10 md:pb-10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  login.mutate({ username, password });
                }}
              >
                <FieldGroup className="space-y-6">
                  <Field className="space-y-2">
                    <FieldLabel
                      htmlFor="username"
                      className="text-sm font-medium text-slate-700"
                    >
                      Username
                    </FieldLabel>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) =>
                        setUsername(e.target.value.replace(/\s+/g, ""))
                      }
                      required
                      className="h-12 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-2 focus-visible:ring-violet-500"
                    />
                  </Field>

                  <Field className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <FieldLabel
                        htmlFor="password"
                        className="text-sm font-medium text-slate-700"
                      >
                        Password
                      </FieldLabel>
                      <a
                        href="#"
                        className="text-sm font-medium text-violet-700 underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-2 focus-visible:ring-violet-500"
                    />
                  </Field>

                  {login.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {login.error?.response?.data?.message ||
                        login.error?.message ||
                        "Invalid username or password."}
                    </div>
                  )}

                  <Field className="space-y-3 pt-2">
                    <Button
                      type="submit"
                      disabled={login.isPending}
                      className="h-12 w-full rounded-xl bg-linear-to-r  text-base font-semibold text-white shadow-lg hover:opacity-95"
                    >
                      {login.isPending ? "Signing in..." : "Login"}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-900/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-0 w-full max-w-[400px] overflow-hidden">
            <div className="flex items-center justify-between bg-gradient-to-r from-wah-primary to-wah-lighter px-6 py-4">
              <h2 className="m-0 text-lg font-semibold text-white">
                Confirm Login
              </h2>
              <button
                onClick={() => setShowConfirmation(false)}
                className="bg-transparent border-0 text-2xl cursor-pointer text-white/80 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="m-0 text-gray-700">
                Are you sure you want to log in as <strong>{role}</strong> with
                username <strong>{username}</strong>?
              </p>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold cursor-pointer hover:bg-gray-200 transition-colors border-0"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLogin}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-wah-primary to-wah-lighter text-white font-semibold cursor-pointer hover:shadow-md transition-all border-0"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
