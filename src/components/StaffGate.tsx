import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useRoles, type AppRole } from "@/lib/auth-store";

/**
 * Backend-enforced staff gate. Roles live in the `user_roles` table and are
 * protected by RLS — the login-screen toggle cannot grant access on its own.
 */
export function StaffGate({
  children,
  require: required = "staff",
}: {
  children: ReactNode;
  require?: "staff" | AppRole[];
}) {
  const { rolesReady, roles, isStaff } = useRoles();

  if (!rolesReady) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Checking access…
      </div>
    );
  }

  const allowed =
    required === "staff" ? isStaff : required.some((r) => roles.includes(r));

  if (!allowed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-lg font-bold">Staff access only</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account is not authorised for the admin console. Contact the
            university ICT desk if you believe this is a mistake.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Back to my card
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
