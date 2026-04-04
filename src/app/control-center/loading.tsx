export default function ControlCenterLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[92rem] px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          minHeight: "60vh",
          gap: "24px",
          color: "var(--text)",
        }}
      >
        <div style={{ width: "64px", height: "64px" }}>
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "64px", height: "64px" }}
          >
            <style>{`
              @keyframes argus-sand-top { 0% { transform: scaleY(1); } 50% { transform: scaleY(0); } 50.1% { transform: scaleY(1); } 100% { transform: scaleY(1); } }
              @keyframes argus-sand-bottom { 0% { transform: scaleY(0); } 50% { transform: scaleY(1); } 50.1% { transform: scaleY(0); } 100% { transform: scaleY(0); } }
              @keyframes argus-sand-stream { 0% { opacity: 1; } 49% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 0; } }
              @keyframes argus-rotate { 0% { transform: rotate(0deg); } 50% { transform: rotate(0deg); } 55% { transform: rotate(180deg); } 100% { transform: rotate(180deg); } }
              @keyframes argus-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
              .argus-hg-body { animation: argus-rotate 3s ease-in-out infinite; transform-origin: 32px 32px; }
              .argus-hg-sand-t { animation: argus-sand-top 3s ease-in-out infinite; transform-origin: center bottom; }
              .argus-hg-sand-b { animation: argus-sand-bottom 3s ease-in-out infinite; transform-origin: center bottom; }
              .argus-hg-stream { animation: argus-sand-stream 3s ease-in-out infinite; }
            `}</style>
            <g className="argus-hg-body">
              <rect x="12" y="8" width="40" height="4" rx="2" fill="var(--gold)" opacity="0.8" />
              <rect x="12" y="52" width="40" height="4" rx="2" fill="var(--gold)" opacity="0.8" />
              <path
                d="M16 12 L16 24 L30 32 L16 40 L16 52 L48 52 L48 40 L34 32 L48 24 L48 12 Z"
                stroke="var(--border)"
                strokeWidth="1.5"
                fill="var(--surf)"
                opacity="0.5"
              />
              <g className="argus-hg-sand-t">
                <path d="M20 14 L20 22 L30 30 L34 30 L44 22 L44 14 Z" fill="var(--gold)" opacity="0.6" />
              </g>
              <g className="argus-hg-sand-b">
                <path d="M20 50 L20 42 L30 34 L34 34 L44 42 L44 50 Z" fill="var(--gold)" opacity="0.6" />
              </g>
              <rect
                className="argus-hg-stream"
                x="31" y="30" width="2" height="6" rx="1"
                fill="var(--gold)" opacity="0.8"
              />
            </g>
          </svg>
        </div>

        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: "6px",
              letterSpacing: "-0.01em",
            }}
          >
            Argus Control Center
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "var(--dim)",
              animation: "argus-pulse 2s ease-in-out infinite",
            }}
          >
            Loading…
          </p>
        </div>
      </div>
    </div>
  );
}
