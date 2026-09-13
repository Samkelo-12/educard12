import { ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-store";
import { BottomNav } from "./BottomNav";

export function AppShell({ children, hideNav }: { children: ReactNode; hideNav?: boolean }) {
  const { profile, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !profile) navigate({ to: "/login" });
  }, [ready, profile, navigate]);

  // While the auth state is still loading, render the child route so it can
  // show its own contextual loading state. Only block once we know for sure
  // there is no profile, while the redirect effect runs.
  if (ready && !profile) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1 pb-24">{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
