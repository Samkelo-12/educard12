import { useState } from "react";
import { GraduationCap, ShieldCheck, Camera, Bus } from "lucide-react";
import type { StudentProfile } from "@/lib/auth-store";
import { updateProfile } from "@/lib/auth-store";

// Deterministic barcode (Code128-style stripes) — decorative
function Barcode({ value, width = 220, height = 60 }: { value: string; width?: number; height?: number }) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 131 + value.charCodeAt(i)) | 0;
  const bars: { w: number; on: boolean }[] = [];
  let total = 0;
  for (let i = 0; i < 70; i++) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const w = 1 + (h % 4);
    bars.push({ w, on: i % 2 === 0 ? true : (h & 1) === 1 });
    total += w;
  }
  const unit = width / total;
  let x = 0;
  return (
    <div className="bg-white rounded-md p-2 inline-flex flex-col items-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {bars.map((b, i) => {
          const rect = b.on ? <rect key={i} x={x} y={0} width={b.w * unit} height={height} fill="black" /> : null;
          x += b.w * unit;
          return rect;
        })}
      </svg>
      <span className="font-mono text-[10px] tracking-[0.2em] text-black mt-0.5">{value}</span>
    </div>
  );
}

export function CardPreview({ profile, compact, editablePhoto }: { profile: StudentProfile; compact?: boolean; editablePhoto?: boolean }) {
  const [flipped, setFlipped] = useState(false);
  const initials = profile.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateProfile({ photo: reader.result as string });
    reader.readAsDataURL(file);
  };

  const minH = compact ? "min-h-[210px]" : "min-h-[440px]";

  return (
    <div className={`perspective-1000 ${minH}`}>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={`relative preserve-3d w-full h-full transition-transform duration-700 ease-out text-left ${minH} ${flipped ? "rotate-y-180" : ""}`}
        aria-label="Flip card"
      >
        {/* FRONT */}
        <div className={`absolute inset-0 backface-hidden overflow-hidden rounded-3xl bg-gradient-card text-primary-foreground shadow-card ${compact ? "p-5" : "p-6"}`}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-white" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black ring-2 ring-white/60">
                <GraduationCap className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div className="leading-tight">
                <p className="text-[9px] uppercase tracking-[0.1em] font-bold text-white leading-tight">Walter Sisulu<br />University</p>
                <p className="text-[10px] font-medium text-white/70">{profile.campus || "Student ID"}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white ring-1 ring-white/30">
              <ShieldCheck className="h-3 w-3" /> Active
            </span>
          </div>

          <div className="relative mt-5 flex items-center gap-4">
            {editablePhoto ? (
              <label
                onClick={(e) => e.stopPropagation()}
                className="relative cursor-pointer h-16 w-16 rounded-2xl bg-white/10 ring-2 ring-white/40 flex items-center justify-center text-xl font-bold overflow-hidden"
              >
                {profile.photo ? (
                  <img src={profile.photo} alt="" className="h-full w-full object-cover" />
                ) : initials}
                <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-white text-black ring-2 ring-black/40">
                  <Camera className="h-3 w-3" />
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-white/10 ring-2 ring-white/40 flex items-center justify-center text-xl font-bold overflow-hidden">
                {profile.photo ? (
                  <img src={profile.photo} alt="" className="h-full w-full object-cover" />
                ) : initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate text-base">{profile.fullName}</p>
              <p className="text-xs text-white/70 truncate">{profile.course}</p>
              <p className="text-[11px] text-white/50 mt-0.5 font-mono tracking-wider">{profile.studentNumber}</p>
            </div>
          </div>

          {!compact && (
            <div className="relative mt-6 space-y-4">
              <div className="flex items-end justify-between">
                <Detail label="Faculty" value={profile.faculty} />
                <Detail label="Year" value={profile.year} />
              </div>
              <div className="flex justify-center">
                <Barcode value={profile.studentNumber} />
              </div>
            </div>
          )}

          <p className="relative mt-5 text-[11px] text-white/60">
            {compact ? "Tap to flip →" : "Tap card to flip →"}
          </p>
        </div>

        {/* BACK */}
        <div className={`absolute inset-0 rotate-y-180 backface-hidden overflow-hidden rounded-3xl bg-gradient-card text-primary-foreground shadow-card ${compact ? "p-5" : "p-6"} flex flex-col`}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-white" />

          {/* Magstripe */}
          <div className="-mx-6 mt-2 h-8 bg-black/80" />

          <div className="mt-5 flex items-center justify-between">
            <p className="text-[9px] uppercase tracking-[0.1em] font-semibold leading-tight">Walter Sisulu<br />University</p>
            <span className="text-[9px] uppercase tracking-widest text-white/50">Back</span>
          </div>

          {/* Transport sticker */}
          <div className="mt-5 flex justify-center">
            <div className="relative w-44 h-44 rounded-full bg-white text-black flex flex-col items-center justify-center shadow-glow ring-4 ring-white/30">
              <div className="absolute inset-2 rounded-full border-2 border-dashed border-black/40" />
              <Bus className="h-10 w-10" strokeWidth={2.2} />
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] font-bold">Transport</p>
              <p className="text-[9px] font-mono tracking-wider">VALID 2026</p>
              <p className="mt-0.5 text-[8px] uppercase tracking-widest text-black/60">Zone A · B · C</p>
            </div>
          </div>

          {!compact && (
            <div className="mt-auto pt-4 border-t border-white/10">
              <p className="text-[9px] text-white/60 leading-relaxed">
                This card remains the property of Walter Sisulu University. If found, please return to the nearest campus office. Tampering invalidates the transport sticker.
              </p>
              <p className="mt-2 text-[9px] text-white/50 font-mono">SN {profile.studentNumber}</p>
            </div>
          )}

          <p className="mt-3 text-[11px] text-white/60 text-center">← Tap to flip back</p>
        </div>
      </button>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-white/50">{label}</p>
      <p className="text-xs font-semibold">{value}</p>
    </div>
  );
}
