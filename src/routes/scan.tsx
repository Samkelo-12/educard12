import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Camera, CheckCircle2, Zap } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/scan")({
  component: () => (
    <PhoneFrame>
      <AppShell>
        <Scan />
      </AppShell>
    </PhoneFrame>
  ),
});

function Scan() {
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSuccess(true), 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative min-h-full bg-foreground text-primary-foreground">
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-12 pb-4">
        <Link to="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-sm font-semibold">Scan & Verify</h1>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur">
          <Zap className="h-4 w-4" />
        </button>
      </header>

      <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center px-6">
        <div className="relative w-full max-w-xs aspect-square">
          <div className="absolute inset-0 rounded-3xl border-2 border-white/15" />
          {/* Corner brackets */}
          {["top-0 left-0 border-l-4 border-t-4 rounded-tl-3xl",
            "top-0 right-0 border-r-4 border-t-4 rounded-tr-3xl",
            "bottom-0 left-0 border-l-4 border-b-4 rounded-bl-3xl",
            "bottom-0 right-0 border-r-4 border-b-4 rounded-br-3xl"].map((cls, i) => (
            <div key={i} className={`absolute h-12 w-12 border-accent ${cls}`} />
          ))}

          {!success ? (
            <div className="absolute inset-x-6 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_20px_oklch(0.7_0.17_155)] animate-pulse" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-success/15 backdrop-blur-sm rounded-3xl animate-in zoom-in-95 fade-in duration-500">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success text-success-foreground shadow-glow">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <p className="mt-4 text-lg font-bold">Verified</p>
              <p className="text-xs text-white/80">Library — Main Entrance</p>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-28 left-0 right-0 px-8 text-center">
        <p className="text-sm text-white/80">
          {success ? "Access granted. Welcome in!" : "Align the QR code within the frame"}
        </p>
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-white/60">
          <Camera className="h-4 w-4" />
          <span>Demo scanner — no camera access required</span>
        </div>
      </div>
    </div>
  );
}
