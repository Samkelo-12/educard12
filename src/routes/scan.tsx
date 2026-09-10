import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Camera, CheckCircle2, RotateCcw, Zap } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { BarcodeScanner, BarcodeFormat } from "@capacitor-mlkit/barcode-scanning";
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

type ScanState = "idle" | "denied" | "scanned" | "unsupported";

function Scan() {
  const [state, setState] = useState<ScanState>("idle");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const scan = async () => {
    setError("");
    try {
      if (!Capacitor.isNativePlatform() || !(await BarcodeScanner.isSupported()).supported) {
        setState("unsupported");
        return;
      }
      const { camera } = await BarcodeScanner.requestPermissions();
      if (camera !== "granted" && camera !== "limited") {
        setState("denied");
        return;
      }
      const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] });
      if (barcodes.length > 0) {
        setContent(barcodes[0].displayValue ?? barcodes[0].rawValue ?? "");
        setState("scanned");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scanning failed");
      setState("unsupported");
    }
  };

  useEffect(() => {
    void scan();
  }, []);

  return (
    <div className="relative min-h-full bg-foreground text-primary-foreground">
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-12 pb-4">
        <Link to="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-sm font-semibold">Scan & Verify</h1>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur">
          <Zap className="h-4 w-4" />
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center px-6">
        <div className="relative w-full max-w-xs aspect-square">
          <div className="absolute inset-0 rounded-3xl border-2 border-white/15" />
          {["top-0 left-0 border-l-4 border-t-4 rounded-tl-3xl",
            "top-0 right-0 border-r-4 border-t-4 rounded-tr-3xl",
            "bottom-0 left-0 border-l-4 border-b-4 rounded-bl-3xl",
            "bottom-0 right-0 border-r-4 border-b-4 rounded-br-3xl"].map((cls, i) => (
            <div key={i} className={`absolute h-12 w-12 border-accent ${cls}`} />
          ))}

          {state === "idle" && (
            <div className="absolute inset-x-6 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_20px_oklch(0.7_0.17_155)] animate-pulse" />
          )}

          {state === "scanned" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-success/15 backdrop-blur-sm rounded-3xl animate-in zoom-in-95 fade-in duration-500 px-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success text-success-foreground shadow-glow">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <p className="mt-4 text-lg font-bold">Scanned</p>
              <p className="mt-1 text-xs text-white/80 text-center break-all line-clamp-3">{content}</p>
            </div>
          )}

          {(state === "denied" || state === "unsupported") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5 backdrop-blur-sm rounded-3xl px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                <Camera className="h-8 w-8" />
              </div>
              <p className="mt-4 text-sm font-semibold">
                {state === "denied" ? "Camera access required" : "Scanner unavailable"}
              </p>
              <p className="mt-2 text-xs text-white/70">
                {state === "denied"
                  ? "EduCard needs camera access to scan QR codes. Grant permission and try again."
                  : error || "QR scanning is only available in the installed EduCard app on your device."}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-28 left-0 right-0 px-8 text-center">
        <p className="text-sm text-white/80">
          {state === "scanned" ? "QR code captured" : "Align the QR code within the frame"}
        </p>
        {(state === "scanned" || state === "denied") && (
          <button
            onClick={() => { setState("idle"); void scan(); }}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            Scan again
          </button>
        )}
      </div>
    </div>
  );
}
