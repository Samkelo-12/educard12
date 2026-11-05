# Transport push notifications

## Goal
Send a push notification when a transport application is submitted, accepted, or expires.

## User-facing behavior
- Keep the existing immediate push on submission and approval; make approval pushes happen only when the status actually changes.
- Send one expiry notification on the first day the approved transport pass is no longer valid (the day after `valid_until`).
- Add a corresponding in-app notification so the event remains visible if push delivery is unavailable.

## Implementation
- Add durable per-application expiry-notification tracking so daily checks and retries cannot send duplicates.
- Add a protected server-side expiry processor that selects only approved, expired applications, records the notification, and sends through the existing Firebase push helper.
- Configure a once-daily background schedule using the project’s scheduled-job capability; keep the scheduler authorization server-side and do not expose it to the browser.
- Preserve existing submission and approval notification behavior, correcting approval retries so they do not send repeated pushes.

## Verification
- Confirm submission and approval still send their immediate alerts.
- Verify expiry selection uses the app’s existing date boundary, sends once per application, and ignores pending, rejected, and still-valid applications.
- Check build/runtime diagnostics and review the touched code for secret exposure.

## Technical details
- Database schema changes go through a Lovable Database migration with explicit grants and RLS considerations.
- FCM delivery remains server-only through the existing connector; the expiry schedule must invoke only a protected server handler.
