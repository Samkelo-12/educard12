import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Bell, Moon, Globe, Wifi, Trash2 } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePreferences } from "@/lib/preferences";

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
  const { prefs, ready, update } = usePreferences();
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  const setDark = async (v: boolean) => {
    setSaving(true);
    try {
      await update({ darkMode: v });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const clearCache = async () => {
    setClearing(true);
    try {
      if (typeof caches !== "undefined") {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      Object.keys(localStorage)
        .filter((k) => !k.startsWith("sb-"))
        .forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
      toast.success("Cached data cleared");
    } catch {
      toast.error("Could not clear cached data.");
    } finally {
      setClearing(false);
    }
  };

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
          <ToggleRow
            icon={Moon}
            label="Dark mode"
            description="Use a darker colour palette"
            value={prefs.darkMode}
            disabled={!ready || saving}
            onChange={(v) => void setDark(v)}
          />
          <ToggleRow
            icon={Bell}
            label="Push notifications"
            description="Device alerts arrive in a future release"
            value={false}
            disabled
            badge="Coming soon"
            onChange={() => {}}
          />
          <ToggleRow
            icon={Wifi}
            label="Offline card access"
            description="Offline storage arrives in a future release"
            value={false}
            disabled
            badge="Coming soon"
            onChange={() => {}}
          />
        </section>

        <section className="rounded-2xl bg-card shadow-soft divide-y divide-border">
          <InfoRow icon={Globe} label="Language" value="English (South Africa)" />
          <InfoRow icon={Globe} label="Region" value="Eastern Cape" />
        </section>

        <Button
          variant="outline"
          disabled={clearing}
          className="w-full h-12 gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={() => void clearCache()}
        >
          <Trash2 className="h-4 w-4" /> {clearing ? "Clearing…" : "Clear cached data"}
        </Button>

        <p className="text-center text-[10px] text-muted-foreground">App version 1.0.0</p>
      </div>
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  description,
  value,
  onChange,
  disabled,
  badge,
}: {
  icon: typeof Bell;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${badge ? "opacity-60" : ""}`}>
      <Icon className="h-5 w-5 text-primary" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{label}</p>
          {badge && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <Switch checked={value} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Globe; label: string; value: string }) {
  return (
    <div className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
      <Icon className="h-5 w-5 text-primary" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{value}</span>
    </div>
  );
}
