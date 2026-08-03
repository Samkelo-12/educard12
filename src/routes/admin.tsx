import { createFileRoute, Link } from "@tanstack/react-router";
import { Bus, LogOut, ScanLine, ShieldCheck, Users } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";
import { useAuth, signOut } from "@/lib/auth-store";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — EduCard WSU" },
      { name: "description", content: "Verify student cards, review transport applications and manage EduCard student records." },
      { property: "og:title", content: "Admin Console — EduCard WSU" },
      { property: "og:description", content: "Verify student cards, review transport applications and manage EduCard student records." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PhoneFrame>
      <AppShell hideNav>
        <Admin />
      </AppShell>
    </PhoneFrame>
  ),
});

function Admin() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  if (!profile) return null;

  return (
    <div className="px-5 pt-12 pb-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Admin console</p>
          <h1 className="text-2xl font-bold">{profile.fullName.split(" ")[0]}</h1>
        </div>
        <button
          onClick={async () => {
            await signOut();
            navigate({ to: "/login" });
          }}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-soft"
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      <div className="rounded-3xl bg-gradient-card p-5 text-primary-foreground shadow-card">
        <ShieldCheck className="h-7 w-7" />
        <p className="mt-3 text-sm text-primary-foreground/80">Staff access</p>
        <p className="text-lg font-bold">Walter Sisulu University</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tools</h2>
        <Tool to="/scan" icon={ScanLine} title="Verify a card" desc="Scan a student barcode to confirm identity" />
        <Tool to="/transport" icon={Bus} title="Transport applications" desc="Review shuttle access requests" />
        <Tool to="/profile" icon={Users} title="Student records" desc="View and update student details" />
      </section>
    </div>
  );
}

function Tool({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: typeof Users;
  title: string;
  desc: string;
}) {
  return (
    <Link to={to} className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-soft">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
    </Link>
  );
}
