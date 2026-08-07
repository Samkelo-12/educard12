import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Bell, Bus, CreditCard, Info, Loader2 } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — WSU Student Card" },
      { name: "description", content: "Recent notifications and alerts." },
    ],
  }),
  component: () => (
    <PhoneFrame>
      <AppShell>
        <NotificationsPage />
      </AppShell>
    </PhoneFrame>
  ),
});

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
};

function iconFor(type: string) {
  switch (type) {
    case "transport":
      return Bus;
    case "card":
      return CreditCard;
    case "system":
      return Info;
    default:
      return Bell;
  }
}

function relativeTime(iso: string) {
  const then = new Date(iso);
  const diffMs = Date.now() - then.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString();
}

function NotificationsPage() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });
    setItems((data as NotificationRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("notifications-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          void load();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const openNotification = async (n: NotificationRow) => {
    setOpenId((prev) => (prev === n.id ? null : n.id));
    if (n.read) return;
    setItems((prev) =>
      prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)),
    );
    await supabase.from("notifications").update({ read: true }).eq("id", n.id);
  };


  return (
    <div className="pb-6">
      <header className="bg-gradient-card px-5 pt-12 pb-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-semibold">Notifications</h1>
          <div className="h-10 w-10" />
        </div>
      </header>

      <div className="px-5 -mt-3 space-y-3">
        {loading ? (
          <div className="flex justify-center rounded-2xl bg-card p-8 shadow-soft">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center shadow-soft">
            <Bell className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium">No notifications yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              We'll let you know when something happens.
            </p>
          </div>
        ) : (
          items.map((n) => {
            const Icon = iconFor(n.type);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => void markRead(n)}
                className="flex w-full gap-3 rounded-2xl bg-card p-4 text-left shadow-soft"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{n.title}</p>
                    {!n.read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-destructive" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {n.message}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {relativeTime(n.created_at)}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
