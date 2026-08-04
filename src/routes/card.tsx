import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";
import { CardPreview } from "@/components/CardPreview";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/card")({
  component: () => (
    <PhoneFrame>
      <AppShell>
        <CardPage />
      </AppShell>
    </PhoneFrame>
  ),
});

function CardPage() {
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <div className="px-5 pt-12 pb-6 space-y-6">
      <header className="flex items-center justify-between">
        <Link to="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-base font-semibold">Digital Student Card</h1>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft">
          <Share2 className="h-4 w-4" />
        </button>
      </header>

      <div className="pt-2">
        <CardPreview profile={profile} editablePhoto />
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-soft space-y-3">
        <h3 className="text-sm font-semibold">Verification</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Show this QR code to staff or scan it at access points. The code refreshes automatically every 60 seconds for security.
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="font-medium">Secure session active</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-12">Add to Wallet</Button>
        <Button className="h-12 bg-gradient-primary">Report lost</Button>
      </div>
    </div>
  );
}
