import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Bell, CreditCard, ScanLine, Bus } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-store";
import { CardPreview } from "@/components/CardPreview";
import { supabase } from "@/integrations/supabase/client";


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
  const [unread, setUnread] = useState(0);

  const loadUnread = useCallback(async () => {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("read", false);
    setUnread(count ?? 0);
  }, []);

  useEffect(() => {
    void loadUnread();
    const channel = supabase
      .channel("dashboard-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          void loadUnread();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadUnread]);

  if (!profile) return null;
  const firstName = profile.fullName.split(" ")[0];

  return (
    <div className="px-5 pt-12 pb-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Hello,</p>
          <h1 className="text-2xl font-bold">{firstName} 👋</h1>
        </div>
        <Link to="/notifications" className="relative flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-soft">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-destructive" />
          )}
        </Link>

      </header>

      <Link to="/card" className="block">
        <CardPreview profile={profile} compact />
      </Link>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quick actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <Quick to="/card" icon={CreditCard} label="ID Card" />
          <Quick to="/scan" icon={ScanLine} label="Scan" />
          <Quick to="/transport" icon={Bus} label="Transport" />
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

