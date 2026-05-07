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

  const minH = compact ? "min-h-[210px]" : "min-h-[330px]";

  return (
    <div className={`perspective-1000 ${minH}`}>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={`relative preserve-3d w-full h-full transition-transform duration-700 ease-out text-left ${minH} ${flipped ? "rotate-y-180" : ""}`}
        aria-label="Flip card"
      >
        {/* FRONT — WSU template (replica) */}
        <div className={`absolute inset-0 backface-hidden overflow-hidden rounded-2xl bg-white text-black shadow-card ${compact ? "p-3" : "p-4"}`}>
          {/* Top-right curved black WSU panel */}
          <div className="absolute top-0 right-0 h-[58%] w-[62%] bg-black rounded-bl-[60%] rounded-tr-2xl flex flex-col items-center justify-center text-white pl-6 pr-3">
            <div className="flex items-center gap-1 leading-none">
              <span className="flex flex-col gap-[3px]">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              <span className={`${compact ? "text-4xl" : "text-6xl"} font-black tracking-tight`}>WSU</span>
            </div>
            <div className={`${compact ? "text-[8px]" : "text-[10px]"} mt-1 px-1 ring-1 ring-white/80 rounded-sm tracking-wide`}>
              Walter Sisulu University
            </div>
            <div className={`${compact ? "text-[8px]" : "text-[10px]"} mt-1 italic opacity-90`}>
              In pursuit of excellence
            </div>
          </div>

          {/* Photo top-left */}
          <div className="relative z-10 flex gap-3">
            {editablePhoto ? (
              <label
                onClick={(e) => e.stopPropagation()}
                className={`relative cursor-pointer ${compact ? "h-20 w-16" : "h-28 w-24"} bg-neutral-200 ring-1 ring-black/30 flex items-center justify-center text-lg font-bold overflow-hidden shrink-0`}
              >
                {profile.photo ? (
                  <img src={profile.photo} alt="" className="h-full w-full object-cover" />
                ) : initials}
                <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-black text-white ring-2 ring-white">
                  <Camera className="h-2.5 w-2.5" />
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
            ) : (
              <div className={`${compact ? "h-20 w-16" : "h-28 w-24"} bg-neutral-200 ring-1 ring-black/30 flex items-center justify-center text-lg font-bold overflow-hidden shrink-0`}>
                {profile.photo ? (
                  <img src={profile.photo} alt="" className="h-full w-full object-cover" />
                ) : initials}
              </div>
            )}

            {/* Vertical year next to photo */}
            <div className="[writing-mode:vertical-rl] rotate-180 font-black text-black tracking-tight self-start mt-1 text-2xl">
              {profile.year || "2026"}
            </div>
          </div>

          {/* Student number under photo */}
          <p className={`${compact ? "text-[10px]" : "text-xs"} font-mono mt-1 tracking-wider`}>
            {profile.studentNumber}
          </p>

          {/* Name / course / campus */}
          <div className={`relative z-10 mt-1 ${compact ? "ml-16" : "ml-24"} space-y-0.5`}>
            <p className={`${compact ? "text-xs" : "text-sm"} font-bold uppercase truncate`}>
              MR {profile.fullName}
            </p>
            <p className={`${compact ? "text-[11px]" : "text-sm"} truncate`}>{profile.course}</p>
            <p className={`${compact ? "text-[10px]" : "text-xs"} font-semibold truncate`}>{profile.campus}</p>
          </div>

          {/* Bottom barcode */}
          <div className="absolute bottom-2 left-2 right-2 bg-neutral-300/60 rounded-sm px-1 py-0.5">
            <Barcode value={profile.studentNumber} width={compact ? 240 : 360} height={compact ? 32 : 44} />
          </div>

          <span className="sr-only">Tap to flip</span>
        </div>

        {/* BACK */}
        <div className={`absolute inset-0 rotate-y-180 backface-hidden overflow-hidden rounded-3xl bg-gradient-card text-primary-foreground shadow-card ${compact ? "p-5" : "p-6"} flex flex-col`}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-white" />

          {/* Magstripe */}
          <div className="-mx-6 mt-2 h-8 bg-black/80" />

          <div className="mt-5 flex items-center justify-between">
            <p className="text-[9px] uppercase tracking-[0.2em] font-semibold">Educard</p>
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
                This card remains the property of Educard. If found, please return to the nearest campus office. Tampering invalidates the transport sticker.
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
