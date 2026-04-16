export default function TopLoadingBar({ show }) {
  if (!show) return null;

  return (
    <>
      <div className="fixed top-0 left-0 z-50 h-[3px] w-full overflow-hidden bg-transparent">
        <div className="loader-bar" />
      </div>

      <style>{`
        .loader-bar {
          height: 100%;
          width: 40%;
          background: linear-gradient(
            90deg,
            #3e0d75,
            #4d128f,
            #5a1ea2,
            #7c3aed
          );
          position: absolute;
          left: -40%;
          border-radius: 9999px;
          animation: loadingMove 1.2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
          box-shadow: 0 0 8px rgba(124, 58, 237, 0.7);
        }

        @keyframes loadingMove {
          0% {
            left: -40%;
            width: 40%;
          }
          50% {
            width: 60%;
          }
          100% {
            left: 100%;
            width: 30%;
          }
        }
      `}</style>
    </>
  );
}
