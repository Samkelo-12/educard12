import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Bell, Moon, Globe, Wifi, Trash2, ChevronRight } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: () => (
    <PhoneFrame>
      <AppShell>
        <SettingsPage />
      </AppShell>
    </PhoneFrame>
  ),
});

function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [offline, setOffline] = useState(true);

  return (
    <div className="pb-6">
      <header className="bg-gradient-card px-5 pt-12 pb-16 text-primary-foreground">
        <div className="flex items-center justify-between">
          <Link to="/profile" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-semibold">App settings</h1>
          <div className="w-10" />
        </div>
        <p className="mt-4 text-xs text-primary-foreground/80">Customize how the app looks and behaves.</p>
      </header>

      <div className="-mt-10 px-5 space-y-5">
        <section className="rounded-2xl bg-card shadow-soft divide-y divide-border">
          <ToggleRow icon={Bell} label="Push notifications" description="Alerts about transport & card updates" value={notifications} onChange={setNotifications} />
          <ToggleRow icon={Moon} label="Dark mode" description="Use a darker color palette" value={darkMode} onChange={setDarkMode} />
          <ToggleRow icon={Wifi} label="Offline card access" description="Store card for offline scanning" value={offline} onChange={setOffline} />
        </section>

        <section className="rounded-2xl bg-card shadow-soft divide-y divide-border">
          <LinkRow icon={Globe} label="Language" value="English (South Africa)" />
          <LinkRow icon={Globe} label="Region" value="Eastern Cape" />
        </section>

        <Button
          variant="outline"
          className="w-full h-12 gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={() => toast.success("Cache cleared")}
        >
          <Trash2 className="h-4 w-4" /> Clear cached data
        </Button>

        <p className="text-center text-[10px] text-muted-foreground">App version 1.0.0</p>
      </div>
    </div>
  );
}

function ToggleRow({ icon: Icon, label, description, value, onChange }: { icon: typeof Bell; label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Icon className="h-5 w-5 text-primary" />
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function LinkRow({ icon: Icon, label, value }: { icon: typeof Globe; label: string; value: string }) {
  return (
    <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
      <Icon className="h-5 w-5 text-primary" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{value}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
