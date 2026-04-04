export default function ControlCenterLoading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: "24px",
        color: "var(--text)",
      }}
    >
      {/* Hourglass SVG with CSS animation */}
      <div style={{ width: "64px", height: "64px" }}>
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "64px", height: "64px" }}
        >
          <style>{`
            @keyframes sand-top {
              0% { transform: scaleY(1); }
              50% { transform: scaleY(0); }
              50.1% { transform: scaleY(1); }
              100% { transform: scaleY(1); }
            }
            @keyframes sand-bottom {
              0% { transform: scaleY(0); }
              50% { transform: scaleY(1); }
              50.1% { transform: scaleY(0); }
              100% { transform: scaleY(0); }
            }
            @keyframes sand-stream {
              0% { opacity: 1; }
              49% { opacity: 1; }
              50% { opacity: 0; }
              100% { opacity: 0; }
            }
            @keyframes hourglass-rotate {
              0% { transform: rotate(0deg); }
              50% { transform: rotate(0deg); }
              55% { transform: rotate(180deg); }
              100% { transform: rotate(180deg); }
            }
            .hourglass-body { animation: hourglass-rotate 3s ease-in-out infinite; transform-origin: 32px 32px; }
            .sand-top { animation: sand-top 3s ease-in-out infinite; transform-origin: center bottom; }
            .sand-bottom { animation: sand-bottom 3s ease-in-out infinite; transform-origin: center bottom; }
            .sand-stream { animation: sand-stream 3s ease-in-out infinite; }
          `}</style>
          <g className="hourglass-body">
            {/* Glass frame */}
            <rect x="12" y="8" width="40" height="4" rx="2" fill="var(--gold)" opacity="0.8" />
            <rect x="12" y="52" width="40" height="4" rx="2" fill="var(--gold)" opacity="0.8" />
            {/* Glass walls */}
            <path
              d="M16 12 L16 24 L30 32 L16 40 L16 52 L48 52 L48 40 L34 32 L48 24 L48 12 Z"
              stroke="var(--border)"
              strokeWidth="1.5"
              fill="var(--surf)"
              opacity="0.5"
            />
            {/* Top sand */}
            <g className="sand-top">
              <path
                d="M20 14 L20 22 L30 30 L34 30 L44 22 L44 14 Z"
                fill="var(--gold)"
                opacity="0.6"
              />
            </g>
            {/* Bottom sand */}
            <g className="sand-bottom">
              <path
                d="M20 50 L20 42 L30 34 L34 34 L44 42 L44 50 Z"
                fill="var(--gold)"
                opacity="0.6"
              />
            </g>
            {/* Falling sand stream */}
            <rect
              className="sand-stream"
              x="31"
              y="30"
              width="2"
              height="6"
              rx="1"
              fill="var(--gold)"
              opacity="0.8"
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
            animation: "pulse 2s ease-in-out infinite",
          }}
        >
          Loading radar data…
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
