import { Link, useLocation } from "@tanstack/react-router";
import { Home, CreditCard, ScanLine, Bus, User } from "lucide-react";

type NavItem = {
  to: "/dashboard" | "/card" | "/scan" | "/transport" | "/profile";
  label: string;
  icon: typeof Home;
  primary?: boolean;
};

const items: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/card", label: "Card", icon: CreditCard },
  { to: "/scan", label: "Scan", icon: ScanLine, primary: true },
  { to: "/transport", label: "Transport", icon: Bus },
  { to: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const loc = useLocation();
  return (
    <nav className="sticky bottom-0 left-0 right-0 z-40 glass border-t border-border">
      <div className="grid grid-cols-5 px-2 py-2">
        {items.map(({ to, label, icon: Icon, primary }) => {
          const active = loc.pathname === to;
          if (primary) {
            return (
              <Link key={to} to={to} className="flex flex-col items-center justify-center -mt-6">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="mt-1 text-[10px] font-medium text-muted-foreground">{label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
