import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Bus, MapPin } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";
import { StaffGate } from "@/components/StaffGate";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/transport")({
  head: () => ({
    meta: [
      { title: "Transport Management — EduCard WSU" },
      { name: "description", content: "Staff tools to review shuttle transport access and applications for Walter Sisulu University students." },
      { property: "og:title", content: "Transport Management — EduCard WSU" },
      { property: "og:description", content: "Review shuttle transport access and applications for WSU students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PhoneFrame>
      <AppShell hideNav>
        <StaffGate require={["admin", "transport_staff"]}>
          <Transport />
        </StaffGate>
      </AppShell>
    </PhoneFrame>
  ),
});

type Row = {
  id: string;
  full_name: string;
  student_number: string;
  campus: string;
};

function Transport() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, student_number, campus")
        .order("campus");
      setRows((data as Row[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const byCampus = rows.reduce<Record<string, Row[]>>((acc, r) => {
    const key = r.campus || "Unassigned campus";
    (acc[key] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-5 px-5 pb-6 pt-12">
      <header className="flex items-center gap-3">
        <Link to="/admin" className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Department</p>
          <h1 className="text-xl font-bold">Transport</h1>
        </div>
      </header>

      <div className="rounded-3xl bg-gradient-card p-5 text-primary-foreground shadow-card">
        <Bus className="h-7 w-7" />
        <p className="mt-3 text-sm text-primary-foreground/80">Shuttle access overview</p>
        <p className="text-2xl font-bold">{loading ? "…" : rows.length} students</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">By campus route</h2>
        {loading && <p className="text-sm text-muted-foreground">Loading students…</p>}
        {!loading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No students registered yet.</p>
        )}
        {Object.entries(byCampus).map(([campus, list]) => (
          <div key={campus} className="rounded-2xl bg-card p-4 shadow-soft">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <p className="font-semibold">{campus}</p>
              <span className="ml-auto text-xs text-muted-foreground">{list.length}</span>
            </div>
            <ul className="mt-3 space-y-2">
              {list.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{r.full_name || "Unnamed student"}</span>
                  <span className="ml-3 shrink-0 font-mono text-xs text-muted-foreground">
                    {r.student_number || "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
