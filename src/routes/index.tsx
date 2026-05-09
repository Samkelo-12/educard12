import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { GraduationCap } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { getCurrentProfile } from "@/lib/auth-store";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => {
      const p = getCurrentProfile();
      navigate({ to: p ? "/dashboard" : "/login" });
    }, 1400);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <PhoneFrame>
      <div className="relative flex h-full w-full flex-col items-center justify-center bg-gradient-card text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 30% 20%, white 0, transparent 40%), radial-gradient(circle at 70% 80%, white 0, transparent 35%)" }} />
        <div className="relative z-10 flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-700">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-md ring-1 ring-white/30 shadow-glow">
            <GraduationCap className="h-12 w-12" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">EduCard</h1>
            <p className="mt-2 text-sm text-primary-foreground/80">Your digital student card</p>
          </div>
          <div className="mt-10 flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white/80 animate-pulse" />
            <span className="h-2 w-2 rounded-full bg-white/60 animate-pulse [animation-delay:150ms]" />
            <span className="h-2 w-2 rounded-full bg-white/40 animate-pulse [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
