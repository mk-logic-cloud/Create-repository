"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="de">
      <body style={{ background: "#0b0b0d", color: "#eee", fontFamily: "system-ui", display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 20 }}>Ein unerwarteter Fehler ist aufgetreten.</h1>
          <button onClick={reset} style={{ marginTop: 16, padding: "8px 20px", borderRadius: 999, background: "#c9a45c", color: "#111", border: 0 }}>
            Neu laden
          </button>
        </div>
      </body>
    </html>
  );
}
