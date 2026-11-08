"use client";

import { useEffect } from "react";

const buttonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  padding: "10px 18px",
  fontSize: 14,
  fontWeight: 500,
  textDecoration: "none",
  cursor: "pointer",
} as const;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] global error", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: "#faf7f3",
          color: "#191310",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <main style={{ maxWidth: 440, textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#7c6f65",
            }}
          >
            Airbnb Concierge
          </p>
          <h1 style={{ margin: "14px 0 8px", fontSize: 26, lineHeight: 1.2 }}>
            The app hit an unexpected error.
          </h1>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#4b4038" }}>
            Reload to continue. If it keeps happening, go back to the home page.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 8,
              marginTop: 24,
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                ...buttonStyle,
                border: "1px solid #e22b4f",
                background: "#e22b4f",
                color: "#fff",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                ...buttonStyle,
                border: "1px solid #e7ded4",
                background: "#fff",
                color: "#191310",
              }}
            >
              Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
