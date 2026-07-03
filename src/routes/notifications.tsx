import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bell, Bus, CreditCard, ScanLine, Info } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";

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

type Notification = {
  id: string;
  title: string;
  body: string;
  time: string;
  icon: typeof Bell;
  unread?: boolean;
};

const notifications: Notification[] = [
  {
    id: "1",
    title: "Transport application approved",
    body: "Your shuttle pass is now active. Tap to view details.",
    time: "2m ago",
    icon: Bus,
    unread: true,
  },
  {
    id: "2",
    title: "New card scan",
    body: "Your card was scanned at Main Gate at 09:14.",
    time: "1h ago",
    icon: ScanLine,
    unread: true,
  },
  {
    id: "3",
    title: "Digital card updated",
    body: "Your student card details were refreshed successfully.",
    time: "Yesterday",
    icon: CreditCard,
  },
  {
    id: "4",
    title: "Welcome to WSU Digital Card",
    body: "Explore your dashboard to get started.",
    time: "2 days ago",
    icon: Info,
  },
];

function NotificationsPage() {
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
        {notifications.map((n) => {
          const Icon = n.icon;
          return (
            <div
              key={n.id}
              className="flex gap-3 rounded-2xl bg-card p-4 shadow-soft"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{n.title}</p>
                  {n.unread && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-destructive" />
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {n.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
