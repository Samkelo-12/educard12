import { GraduationCap, ShieldCheck } from "lucide-react";
import type { StudentProfile } from "@/lib/auth-store";

// Pure CSS "QR" — decorative, fast, no dependency.
function FauxQR({ size = 120, seed = "x" }: { size?: number; seed?: string }) {
  const grid = 17;
  // Deterministic pseudo-random from seed
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const cells: boolean[] = [];
  for (let i = 0; i < grid * grid; i++) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    cells.push((h & 1) === 1);
  }
  const cs = size / grid;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg bg-white p-1.5">
      {cells.map((on, i) => {
        if (!on) return null;
        const r = Math.floor(i / grid);
        const c = i % grid;
        // Reserve corners for finder patterns
        if ((r < 4 && c < 4) || (r < 4 && c > grid - 5) || (r > grid - 5 && c < 4)) return null;
        return <rect key={i} x={c * cs} y={r * cs} width={cs} height={cs} fill="black" />;
      })}
      {[[0, 0], [grid - 4, 0], [0, grid - 4]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x * cs} y={y * cs} width={cs * 4} height={cs * 4} fill="black" />
          <rect x={(x + 0.5) * cs} y={(y + 0.5) * cs} width={cs * 3} height={cs * 3} fill="white" />
          <rect x={(x + 1) * cs} y={(y + 1) * cs} width={cs * 2} height={cs * 2} fill="black" />
        </g>
      ))}
    </svg>
  );
}

export function CardPreview({ profile, compact }: { profile: StudentProfile; compact?: boolean }) {
  const initials = profile.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-card text-primary-foreground shadow-card ${compact ? "p-5" : "p-6"}`}>
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 90% 10%, white 0, transparent 35%), radial-gradient(circle at 10% 90%, white 0, transparent 30%)" }} />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] uppercase tracking-widest text-primary-foreground/70">Student</p>
            <p className="text-xs font-semibold">{profile.campus || "Campus ID"}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-success/25 px-2.5 py-1 text-[10px] font-semibold text-white ring-1 ring-white/30">
          <ShieldCheck className="h-3 w-3" /> Active
        </span>
      </div>

      <div className="relative mt-5 flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-white/15 ring-2 ring-white/40 flex items-center justify-center text-xl font-bold overflow-hidden">
          {profile.photo ? (
            <img src={profile.photo} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold truncate">{profile.fullName}</p>
          <p className="text-xs text-primary-foreground/80 truncate">{profile.course}</p>
          <p className="text-[11px] text-primary-foreground/60 mt-0.5 font-mono tracking-wider">
            {profile.studentNumber}
          </p>
        </div>
      </div>

      {!compact && (
        <div className="relative mt-6 flex items-end justify-between">
          <div className="space-y-1">
            <Detail label="Faculty" value={profile.faculty} />
            <Detail label="Year" value={profile.year} />
          </div>
          <FauxQR size={110} seed={profile.studentNumber} />
        </div>
      )}

      {compact && (
        <p className="relative mt-5 text-[11px] text-primary-foreground/70">Tap to view full card →</p>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-primary-foreground/60">{label}</p>
      <p className="text-xs font-semibold">{value}</p>
    </div>
  );
}
