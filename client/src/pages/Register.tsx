import { RegisterForm } from "@/features/Register";
import { Link } from "react-router-dom";
import React, { useEffect } from "react";
import { useThemeStore } from "@/store/useThemeStore";

const Register = () => {
  const { theme } = useThemeStore();

  useEffect(() => {
    // Force light mode on register page
    const html = document.documentElement;
    const wasDark = html.classList.contains("dark");
    html.classList.remove("dark");

    return () => {
      // Restore previous theme state when leaving
      if (wasDark || theme === "dark") {
        html.classList.add("dark");
      }
    };
  }, [theme]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.12),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6">
        <div className="w-full max-w-xl text-center">
          <img
            className="mx-auto h-16 w-auto sm:h-20"
            src="/images/wah-logo.png"
            alt="WAH Logo"
          />
          <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Join the WAH Team
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-violet-700 transition-colors hover:text-violet-600"
            >
              Log in here
            </Link>
          </p>
        </div>

        <div className="w-full">
          <RegisterForm />
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Wireless Access for Health. All rights
        reserved.
      </div>
    </div>
  );
};

export default Register;
