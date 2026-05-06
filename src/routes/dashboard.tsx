import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, BookOpen, CreditCard, ScanLine, Bus, Calendar, ChevronRight } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-store";
import { CardPreview } from "@/components/CardPreview";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <PhoneFrame>
      <AppShell>
        <Dashboard />
      </AppShell>
    </PhoneFrame>
  ),
});

function Dashboard() {
  const { profile } = useAuth();
  if (!profile) return null;
  const firstName = profile.fullName.split(" ")[0];

  return (
    <div className="px-5 pt-12 pb-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Hello,</p>
          <h1 className="text-2xl font-bold">{firstName} 👋</h1>
        </div>
        <button className="relative flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-soft">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-destructive" />
        </button>
      </header>

      <Link to="/card" className="block">
        <CardPreview profile={profile} compact />
      </Link>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quick actions</h2>
        <div className="grid grid-cols-4 gap-3">
          <Quick to="/card" icon={CreditCard} label="ID Card" />
          <Quick to="/scan" icon={ScanLine} label="Scan" />
          <Quick to="/transport" icon={Bus} label="Transport" />
          <Quick to="/profile" icon={Calendar} label="Schedule" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Campus services</h2>
        <div className="space-y-3">
          <ServiceRow icon={BookOpen} title="Library" subtitle="3 books due in 5 days" tone="primary" />
          <ServiceRow icon={Coffee} title="Cafeteria" subtitle="Balance: R 245.50" tone="accent" />
          <ServiceRow icon={Calendar} title="Event check-in" subtitle="Orientation Week — Tomorrow" tone="warning" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Announcements</h2>
        <div className="rounded-2xl bg-card p-4 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">!</div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Library hours extended</p>
              <p className="text-xs text-muted-foreground mt-0.5">Open until midnight during exam week. Bring your ID.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Quick({ to, icon: Icon, label }: { to: string; icon: typeof Bell; label: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-2">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-soft">
        <Icon className="h-6 w-6 text-primary" />
      </span>
      <span className="text-[11px] font-medium">{label}</span>
    </Link>
  );
}

function ServiceRow({ icon: Icon, title, subtitle, tone }: { icon: typeof Bell; title: string; subtitle: string; tone: "primary" | "accent" | "warning" }) {
  const toneClass =
    tone === "primary" ? "bg-primary/10 text-primary" :
    tone === "accent" ? "bg-accent/15 text-accent-foreground" :
    "bg-warning/20 text-warning-foreground";
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-soft">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
