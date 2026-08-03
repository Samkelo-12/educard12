import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bus, CreditCard, LogOut, ShieldCheck } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";
import { StaffGate } from "@/components/StaffGate";
import { useAuth, useRoles, signOut } from "@/lib/auth-store";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Console — EduCard WSU" },
      { name: "description", content: "Staff console for EduCard: manage student cards and shuttle transport access at Walter Sisulu University." },
      { property: "og:title", content: "Admin Console — EduCard WSU" },
      { property: "og:description", content: "Staff console for EduCard: manage student cards and shuttle transport access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PhoneFrame>
      <AppShell hideNav>
        <StaffGate>
          <Admin />
        </StaffGate>
      </AppShell>
    </PhoneFrame>
  ),
});

function Admin() {
  const { profile } = useAuth();
  const { canManageCards, canManageTransport, roles } = useRoles();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 px-5 pb-6 pt-12">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Admin console</p>
          <h1 className="text-2xl font-bold">{profile?.fullName.split(" ")[0] ?? "Staff"}</h1>
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
        <p className="mt-3 text-sm text-primary-foreground/80">Verified staff access</p>
        <p className="text-lg font-bold">Walter Sisulu University</p>
        <p className="mt-2 text-xs text-primary-foreground/70">
          Roles: {roles.length ? roles.join(", ").replace(/_/g, " ") : "none"}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Departments</h2>

        <Section
          to="/admin/cards"
          icon={CreditCard}
          title="Student cards management"
          desc="Verify cards, look up and update student records"
          enabled={canManageCards}
        />
        <Section
          to="/admin/transport"
          icon={Bus}
          title="Transport management"
          desc="Review shuttle access and transport applications"
          enabled={canManageTransport}
        />
      </section>
    </div>
  );
}

function Section({
  to,
  icon: Icon,
  title,
  desc,
  enabled,
}: {
  to: string;
  icon: typeof Bus;
  title: string;
  desc: string;
  enabled: boolean;
}) {
  const body = (
    <>
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">
          {enabled ? desc : "Not assigned to your account"}
        </span>
      </span>
    </>
  );

  if (!enabled) {
    return (
      <div className="flex items-center gap-4 rounded-2xl bg-card p-4 opacity-50 shadow-soft">{body}</div>
    );
  }

  return (
    <Link to={to} className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-soft">
      {body}
    </Link>
  );
}
