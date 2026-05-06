import { ReactNode } from "react";

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-0 sm:p-6">
      <div className="relative w-full sm:w-[420px] sm:h-[860px] sm:rounded-[2.75rem] sm:border-8 sm:border-foreground/90 sm:shadow-2xl overflow-hidden bg-background">
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 z-50 h-7 w-32 rounded-b-2xl bg-foreground/90" />
        <div className="relative h-screen sm:h-full w-full overflow-y-auto scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  );
}
