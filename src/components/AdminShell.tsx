import { ReactNode } from "react";

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
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
