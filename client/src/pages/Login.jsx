import { useState } from "react";

export default function Login({ role, onRoleChange, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const handleConfirmLogin = () => {
    setShowConfirmation(false);
    onLogin({ username, password });
  };

  return (
    <div className="min-h-screen grid place-items-center p-7 bg-gradient-to-br from-[#50109a] to-wah-accent">
      <div className="w-full max-w-[500px] bg-wah-card rounded-[14px] overflow-hidden shadow-lg">
        <section className="px-12 py-16 flex flex-col items-center">
          <img
            className="w-[150px] h-[150px] object-contain mb-6"
            src="/images/wah-logo.png"
            alt="WAH logo"
          />

          <h1 className="m-0 max-w-[320px] text-center text-[clamp(1.6rem,2vw,1.8rem)] leading-[1.15] text-wah-text">
            Welcome to Wireless Access For Health Payroll System
          </h1>

          <form
            className="mt-[34px] w-full max-w-[340px] grid gap-3"
            onSubmit={handleSubmit}
          >
            <div className="relative w-full h-14">
              <input
                required
                id="username"
                type="text"
                name="username"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.replace(/\s+/g, ""))
                }
                autoComplete="off"
                className="peer w-full h-full border-[1.8px] border-wah-light rounded-[14px] bg-white px-4 pt-3 text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid invalid:border-wah-light"
              />
              <label
                htmlFor="username"
                className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-focus:text-wah-mid peer-valid:-translate-y-[160%] peer-valid:scale-[0.82] peer-valid:bg-wah-card peer-valid:text-wah-mid"
              >
                Username
              </label>
            </div>

            <div className="relative w-full h-14">
              <input
                required
                id="password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                className="peer w-full h-full border-[1.8px] border-wah-light rounded-[14px] bg-white px-4 pt-3 text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid"
              />
              <label
                htmlFor="password"
                className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-focus:text-wah-mid peer-valid:-translate-y-[160%] peer-valid:scale-[0.82] peer-valid:bg-wah-card peer-valid:text-wah-mid"
              >
                Password
              </label>
              <span
                aria-hidden="true"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-wah-mid text-sm"
              >
                ◉
              </span>
            </div>

            <label className="mt-1 flex items-center gap-2 text-wah-text">
              <input type="checkbox" className="w-4 h-4" />
              Remember me
            </label>

            <div className="relative w-full h-14 border-[1.8px] border-wah-light rounded-[14px] bg-white">
              <select
                value={role}
                onChange={(e) => onRoleChange(e.target.value)}
                className="w-full h-full px-4 text-base text-[#1e2430] outline-none bg-transparent cursor-pointer"
              >
                <option value="Admin">Admin</option>
                <option value="HR">HR</option>
              </select>
            </div>

            <div className="mt-2.5 grid grid-cols-1 gap-2.5">
              <button
                type="submit"
                className="h-12 rounded-xl border-0 text-white text-xl font-semibold cursor-pointer bg-gradient-to-r from-wah-primary to-wah-lighter"
              >
                Log in
              </button>
            </div>
          </form>
        </section>
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
