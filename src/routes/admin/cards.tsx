import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CreditCard, ScanLine, Search } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";
import { StaffGate } from "@/components/StaffGate";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/cards")({
  head: () => ({
    meta: [
      { title: "Student Cards Management — EduCard WSU" },
      { name: "description", content: "Staff tools to verify EduCard student cards and review student records at Walter Sisulu University." },
      { property: "og:title", content: "Student Cards Management — EduCard WSU" },
      { property: "og:description", content: "Verify EduCard student cards and review student records." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PhoneFrame>
      <AppShell hideNav>
        <StaffGate require={["admin", "card_staff"]}>
          <Cards />
        </StaffGate>
      </AppShell>
    </PhoneFrame>
  ),
});

type Row = {
  id: string;
  full_name: string;
  student_number: string;
  course: string;
  campus: string;
  photo: string | null;
};

function Cards() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, student_number, course, campus, photo")
        .order("full_name");
      setRows((data as Row[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const term = q.trim().toLowerCase();
  const filtered = term
    ? rows.filter(
        (r) =>
          r.full_name.toLowerCase().includes(term) ||
          r.student_number.toLowerCase().includes(term),
      )
    : rows;

  return (
    <div className="space-y-5 px-5 pb-6 pt-12">
      <header className="flex items-center gap-3">
        <Link to="/admin" className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Department</p>
          <h1 className="text-xl font-bold">Student cards</h1>
        </div>
      </header>

      <Link to="/scan" className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-soft">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ScanLine className="h-5 w-5" />
        </span>
        <span>
          <span className="block font-semibold">Verify a card</span>
          <span className="block text-xs text-muted-foreground">Scan a student barcode to confirm identity</span>
        </span>
      </Link>

      <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-soft">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or student number"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Student records {loading ? "" : `(${filtered.length})`}
        </h2>
        {loading && <p className="text-sm text-muted-foreground">Loading records…</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No matching student records.</p>
        )}
        {filtered.map((r) => (
          <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft">
            {r.photo ? (
              <img src={r.photo} alt={`${r.full_name} card photo`} className="h-11 w-11 rounded-xl object-cover" />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <CreditCard className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold">{r.full_name || "Unnamed student"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {r.student_number || "No number"} · {r.course || "No course"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{r.campus}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
