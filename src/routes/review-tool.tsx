import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { Check, Lock, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type PendingApplication = {
  id: string;
  pickup_point: string;
  dropoff_point: string;
  period: string;
  created_at: string;
  student_name: string;
  student_number: string;
};

export const Route = createFileRoute('/review-tool')({
  head: () => ({
    meta: [
      { title: 'Review Tool — EduCard' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ReviewToolPage,
});

function ReviewToolPage() {
  const [secret, setSecret] = useState('');
  const [secretInput, setSecretInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadApplications = useCallback(async (key: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/public/pending-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: key }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load applications');
      }
      setApplications(data.applications as PendingApplication[]);
      setUnlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
      setUnlocked(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const review = useCallback(
    async (applicationId: string, status: 'approved' | 'rejected') => {
      setBusyId(applicationId);
      setError('');
      setNotice('');
      try {
        const res = await fetch('/api/public/admin-review-application', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId, status, secret }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Review failed');
        }
        setApplications((prev) => prev.filter((a) => a.id !== applicationId));
        const valid = data.application?.valid_until;
        setNotice(
          `Application ${status}${valid ? ` — valid until ${valid}` : ''}.`,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Review failed');
      } finally {
        setBusyId(null);
      }
    },
    [secret],
  );

  const unlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretInput.trim()) return;
    setSecret(secretInput.trim());
    void loadApplications(secretInput.trim());
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-bold">Transport Review</h1>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            EduCard Transport Command Centre
          </p>
        </div>

        {!unlocked ? (
          <form onSubmit={unlock} className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Secret</Label>
              <Input
                type="password"
                required
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                className="h-11"
                placeholder="Enter admin secret"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="h-11 w-full" disabled={loading || !secretInput.trim()}>
              <Lock className="h-4 w-4" />
              {loading ? 'Unlocking…' : 'Unlock'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {applications.length} pending application{applications.length === 1 ? '' : 's'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadApplications(secret)}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh list
              </Button>
            </div>

            {notice ? (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
                {notice}
              </p>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {applications.length === 0 && !loading ? (
              <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                No pending applications.
              </p>
            ) : null}

            <ul className="space-y-3">
              {applications.map((app) => (
                <li key={app.id} className="space-y-3 rounded-2xl border border-border bg-card p-4">
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {app.student_name}
                      {app.student_number ? (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {app.student_number}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground break-all">ID: {app.id}</p>
                    <p className="text-sm">
                      {app.pickup_point} → {app.dropoff_point}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      Period: {app.period} · Submitted {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={busyId === app.id}
                      onClick={() => void review(app.id, 'approved')}
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      disabled={busyId === app.id}
                      onClick={() => void review(app.id, 'rejected')}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
