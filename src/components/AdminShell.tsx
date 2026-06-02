import { Link, useRouterState } from "@tanstack/react-router";
import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

const NAV = [
  { to: "/admin", label: "Home" },
  { to: "/admin/seniors", label: "Seniors" },
  { to: "/admin/guardians", label: "Guardians" },
  { to: "/admin/messages", label: "Messages" },
  { to: "/admin/sos", label: "SOS" },
  { to: "/admin/audit", label: "Audit" },
];

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const { signOut } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b" style={{ background: "var(--color-sky)" }}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex flex-wrap items-center gap-4 justify-between">
          <div className="font-bold text-lg">KinGuard Admin</div>
          <nav className="flex flex-wrap gap-2">
            {NAV.map((n) => {
              const active = path === n.to;
              return (
                <Link key={n.to} to={n.to}
                  className="px-3 py-1.5 rounded-md text-sm font-bold"
                  style={{
                    background: active ? "var(--color-tan)" : "transparent",
                    color: active ? "#fff" : "var(--color-brown)",
                  }}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex gap-3 items-center">
            <Link to="/dashboard" className="text-sm underline">← Back to KinGuard</Link>
            <button
              onClick={() => signOut()}
              className="btn-base"
              style={{ background: "var(--color-rose)", color: "#fff", minHeight: 44, padding: "8px 18px", fontSize: 16, fontWeight: 800 }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-5 py-6">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        {children}
      </main>
    </div>
  );
}

export function AdminTable<T>({ rows, columns, empty = "No rows." }: {
  rows: T[];
  columns: { key: string; label: string; render: (row: T) => ReactNode }[];
  empty?: string;
}) {
  if (rows.length === 0) return <p className="text-sm opacity-70">{empty}</p>;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead style={{ background: "var(--color-cream)" }}>
          <tr>{columns.map((c) => <th key={c.key} className="text-left px-3 py-2 font-bold">{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              {columns.map((c) => <td key={c.key} className="px-3 py-2 align-top">{c.render(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
