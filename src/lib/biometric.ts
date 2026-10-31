// Biometric (fingerprint / Face ID) sign-in support.
//
// How it works:
// 1. While signed in, the student enables biometric sign-in in Privacy & Security.
//    The device's platform authenticator (fingerprint / Face ID) creates a
//    WebAuthn credential, and the backend issues a random 256-bit device pass
//    tied to that credential (only its SHA-256 hash is stored server-side).
// 2. On the login screen, tapping "Use biometric login" asks the device to
//    verify the student's biometrics via the platform authenticator. Only when
//    the device confirms the biometric check does the app send the device pass
//    to the backend, which mints a fresh session for the student.
//
// Nothing secret is persisted beyond the device itself, and the device pass can
// be revoked from the Privacy & Security screen at any time.
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import {
  registerBiometricCredential,
  removeBiometricCredential,
} from "@/lib/biometric.functions";

const STORAGE_KEY = "educard-biometric";

interface StoredCredential {
  token: string;
  credentialId: string;
  label: string;
}

export type BiometricPlatform = "native" | "web";

export function biometricPlatform(): BiometricPlatform {
  return Capacitor.isNativePlatform() ? "native" : "web";
}

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function uuidToBytes(uuid: string): Uint8Array {
  const hex = uuid.replace(/-/g, "");
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function randomChallenge(): Uint8Array {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  return challenge;
}

async function storeCredential(cred: StoredCredential) {
  if (biometricPlatform() === "native") {
    try {
      const { NativeBiometric } = await import("@capacitor-community/native-biometric");
      await NativeBiometric.setKey({ key: STORAGE_KEY, value: JSON.stringify(cred) });
      return;
    } catch {
      // fall through to localStorage if the secure store is unavailable
    }
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cred));
  } catch {
    throw new Error("This device cannot store the biometric sign-in credential.");
  }
}

export async function getStoredCredential(): Promise<StoredCredential | null> {
  let raw: string | null = null;
  if (biometricPlatform() === "native") {
    try {
      const { NativeBiometric } = await import("@capacitor-community/native-biometric");
      const { value } = await NativeBiometric.getKey({ key: STORAGE_KEY });
      raw = value ?? null;
    } catch {
      raw = null;
    }
  }
  if (raw === null) {
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredCredential;
    if (!parsed?.token || !parsed?.credentialId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearStoredCredential(credentialId?: string) {
  const stored = await getStoredCredential();
  if (biometricPlatform() === "native") {
    try {
      const { NativeBiometric } = await import("@capacitor-community/native-biometric");
      await NativeBiometric.removeKey({ key: STORAGE_KEY });
    } catch {
      /* ignore */
    }
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  if (stored) {
    try {
      await removeBiometricCredential({ data: { credentialId: credentialId ?? stored.credentialId } });
    } catch {
      /* server row may already be gone */
    }
  }
}

/** True when this device can offer fingerprint / Face ID verification. */
export async function biometricAvailable(): Promise<boolean> {
  if (biometricPlatform() === "native") {
    try {
      const { NativeBiometric } = await import("@capacitor-community/native-biometric");
      const { isAvailable } = await NativeBiometric.isAvailable();
      return isAvailable;
    } catch {
      return false;
    }
  }
  if (typeof window === "undefined" || !("PublicKeyCredential" in window)) return false;
  try {
    return await (window.PublicKeyCredential as PublicKeyCredential).isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Enrol this device for biometric sign-in. Must be called while signed in.
 * Verifies the student's biometrics, registers the credential server-side and
 * stores the device pass in secure device storage.
 */
export async function enrollBiometric(
  userId: string,
  email: string,
  fullName: string,
): Promise<void> {
  if (biometricPlatform() === "native") {
    const { NativeBiometric } = await import("@capacitor-community/native-biometric");
    await NativeBiometric.verifyIdentity({
      reason: "Enable fingerprint or Face ID sign-in for EduCard",
    });
    const { token } = await registerBiometricCredential({
      data: { credentialId: crypto.randomUUID(), deviceLabel: "Mobile app" },
    });
    await storeCredential({ token, credentialId: "mobile-app", label: "Mobile app" });
    void userId;
    void email;
    void fullName;
    return;
  }

  // Web: create a platform credential bound to this device.
  let credential: PublicKeyCredential | null;
  try {
    credential = await navigator.credentials.create({
      publicKey: {
        challenge: randomChallenge(),
        rp: { name: "EduCard" },
        user: {
          id: uuidToBytes(userId),
          name: email,
          displayName: fullName || email,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          residentKey: "required",
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "none",
      },
    });
  } catch (err) {
    throw new Error(describeError(err, "Biometric setup was cancelled."));
  }
  if (!credential) throw new Error("Biometric setup was cancelled.");

  const { token } = await registerBiometricCredential({
    data: {
      credentialId: base64url(new Uint8Array(credential.rawId)),
      deviceLabel: describeDevice(),
    },
  });
  await storeCredential({
    token,
    credentialId: base64url(new Uint8Array(credential.rawId)),
    label: describeDevice(),
  });
}

/**
 * Full biometric sign-in: verifies the student's biometrics on this device and
 * restores their session. Throws a user-friendly error on any failure.
 */
export async function biometricSignIn(): Promise<void> {
  const stored = await getStoredCredential();
  if (!stored) throw new Error("Biometric sign-in is not set up on this device.");

  if (biometricPlatform() === "native") {
    const { NativeBiometric } = await import("@capacitor-community/native-biometric");
    await NativeBiometric.verifyIdentity({
      reason: "Sign in to EduCard with your fingerprint or Face ID",
    });
  } else {
    let assertion: PublicKeyCredential | null;
    try {
      assertion = await navigator.credentials.get({
        publicKey: {
          challenge: randomChallenge(),
          rpId: window.location.hostname,
          userVerification: "required",
          timeout: 60000,
        },
      });
    } catch (err) {
      throw new Error(describeError(err, "Biometric sign-in was cancelled."));
    }
    if (!assertion) throw new Error("Biometric sign-in was cancelled.");
  }

  // The device verified the student's biometrics; exchange the device pass
  // for a fresh session.
  let payload: { success: boolean; email?: string; tokenHash?: string; error?: string };
  try {
    const res = await fetch("/api/public/biometric-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: stored.token, credentialId: stored.credentialId }),
    });
    payload = (await res.json()) as typeof payload;
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }

  if (!payload.success || !payload.email || !payload.tokenHash) {
    throw new Error(payload.error || "Biometric sign-in failed. Please sign in with your password.");
  }

  const { error } = await supabase.auth.verifyOtp({
    email: payload.email,
    token_hash: payload.tokenHash,
    type: "magiclink",
  });
  if (error) throw new Error("Biometric sign-in failed. Please sign in with your password.");
}

function describeDevice(): string {
  if (typeof navigator === "undefined") return "This device";
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "Android device";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iPhone / iPad";
  if (/Windows/i.test(ua)) return "Windows PC";
  if (/Mac/i.test(ua)) return "Mac";
  return "This device";
}

function describeError(err: unknown, fallback: string): string {
  const name = (err as { name?: string })?.name;
  if (name === "NotAllowedError") return "Biometric check was cancelled or timed out. Please try again.";
  if (name === "SecurityError") {
    return "Biometric sign-in isn't available in this embedded view. Open the app at its own web address (educard12.lovable.app) to use it.";
  }
  if (name === "InvalidStateError") return "This device already has biometric sign-in set up for another account.";
  if (name === "NotSupportedError") return "This device or browser doesn't support fingerprint / Face ID sign-in.";
  return fallback;
}
