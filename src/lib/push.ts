// Browser-side push notification registration (web push via Firebase Cloud Messaging).
// The Firebase web credentials are synced by the Firebase Cloud Messaging connector
// as VITE_ variables; the connection must have "Include web push" selected.
import { registerPushToken } from "@/lib/push.functions";

const appId = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID as string | undefined;
const vapidKey = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY as string | undefined;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY as string | undefined,
  projectId: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID as string | undefined,
  appId,
  messagingSenderId: appId?.split(":")[1] ?? "",
};

export type PushResult =
  | { status: "registered"; token: string }
  | { status: "not-configured" | "unsupported" | "open-in-new-tab" | "denied" | "error" };

// Call from a click handler: browsers ignore permission requests without a user gesture.
export async function enablePush(): Promise<PushResult> {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !appId || !vapidKey || !firebaseConfig.messagingSenderId) {
    return { status: "not-configured" };
  }
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return { status: "unsupported" };
  }
  // The Lovable preview runs inside a cross-origin iframe, where browsers
  // reject permission prompts entirely — direct the user to the real app.
  if (window.top !== window.self) {
    return { status: "open-in-new-tab" };
  }

  try {
    const { isSupported, getMessaging, getToken, onMessage } = await import("firebase/messaging");
    const { initializeApp, getApps } = await import("firebase/app");

    const permission =
      Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission !== "granted") {
      return { status: "denied" };
    }

    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(firebaseConfig).filter(([, v]) => v !== undefined) as [string, string][]),
    ).toString();
    const serviceWorkerRegistration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`);

    const app = getApps().find((a) => a.name === "educard-push") ?? initializeApp(firebaseConfig, "educard-push");
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration });
    if (!token) return { status: "denied" };

    // Foreground delivery: show an in-app toast-style notification too.
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? "EduCard";
      const body = payload.notification?.body ?? "You have a new update.";
      if (payload.notification) {
        // eslint-disable-next-line no-new
        new Notification(title, { body });
      }
    });

    await registerPushToken({ data: { token, platform: "web" } });
    localStorage.setItem("educard-push-registered", "1");
    return { status: "registered", token };
  } catch (err) {
    console.error("Push registration failed", err);
    return { status: "error" };
  }
}

export function pushRegistrationState(): "on" | "off" | "unknown" {
  if (typeof window === "undefined") return "unknown";
  if (!("Notification" in window)) return "unknown";
  if (Notification.permission !== "granted") return "off";
  try {
    return localStorage.getItem("educard-push-registered") === "1" ? "on" : "off";
  } catch {
    return "unknown";
  }
}
