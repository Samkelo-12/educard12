import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { Check, History, Inbox, Lock, RefreshCw, X } from 'lucide-react';
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

type HistoryApplication = PendingApplication & {
  status: string;
  reviewed_at: string | null;
  valid_until: string | null;
};

type Tab = 'pending' | 'history';
type HistoryFilter = 'all' | 'approved' | 'rejected';

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
  const [history, setHistory] = useState<HistoryApplication[]>([]);
  const [tab, setTab] = useState<Tab>('pending');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadApplications = useCallback(async (key: string) => {
    setLoading(true);
    setError('');
    try {
      const [pendingRes, historyRes] = await Promise.all([
        fetch('/api/public/pending-applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: key }),
        }),
        fetch('/api/public/application-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: key }),
        }),
      ]);
      const pendingData = await pendingRes.json();
      const historyData = await historyRes.json();
      if (!pendingRes.ok || !pendingData.success) {
        throw new Error(pendingData.error || 'Failed to load applications');
      }
      if (!historyRes.ok || !historyData.success) {
        throw new Error(historyData.error || 'Failed to load application history');
      }
      setApplications(pendingData.applications as PendingApplication[]);
      setHistory(historyData.applications as HistoryApplication[]);
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
        const reviewed = applications.find((a) => a.id === applicationId);
        setApplications((prev) => prev.filter((a) => a.id !== applicationId));
        if (reviewed) {
          setHistory((prev) => [
            {
              ...reviewed,
              status,
              reviewed_at: new Date().toISOString(),
              valid_until: data.application?.valid_until ?? null,
            },
            ...prev,
          ]);
        }
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
    [secret, applications],
  );

  const unlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretInput.trim()) return;
    setSecret(secretInput.trim());
    void loadApplications(secretInput.trim());
  };

  const isActive = (app: HistoryApplication) =>
    app.status === 'approved' &&
    (!app.valid_until || new Date(app.valid_until) >= new Date());

  const filteredHistory = history.filter((app) => {
    if (historyFilter === 'approved') return isActive(app);
    if (historyFilter === 'rejected') return app.status === 'rejected';
    return true;
  });

  const filterButton = (value: HistoryFilter, label: string) => (
    <button
      key={value}
      type="button"
      onClick={() => setHistoryFilter(value)}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        historyFilter === value
          ? 'bg-primary text-primary-foreground'
          : 'border border-border bg-card text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );

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
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Secret Key</Label>
              <Input
                type="password"
                required
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                className="h-11"
                placeholder="Enter admin secret key"
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
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-1">
              <button
                type="button"
                onClick={() => setTab('pending')}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  tab === 'pending'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Inbox className="h-4 w-4" />
                Pending
              </button>
              <button
                type="button"
                onClick={() => setTab('history')}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  tab === 'history'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <History className="h-4 w-4" />
                History
              </button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {tab === 'pending'
                  ? `${applications.length} pending application${applications.length === 1 ? '' : 's'}`
                  : `${filteredHistory.length} reviewed application${filteredHistory.length === 1 ? '' : 's'}`}
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

            {tab === 'pending' ? (
              <>
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
              </>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {filterButton('all', 'All')}
                  {filterButton('approved', 'Approved (active)')}
                  {filterButton('rejected', 'Rejected')}
                </div>

                {filteredHistory.length === 0 && !loading ? (
                  <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                    No applications match this filter.
                  </p>
                ) : null}

                <ul className="space-y-3">
                  {filteredHistory.map((app) => {
                    const active = isActive(app);
                    return (
                      <li key={app.id} className="space-y-2 rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold">
                            {app.student_name}
                            {app.student_number ? (
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                {app.student_number}
                              </span>
                            ) : null}
                          </p>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              app.status === 'approved'
                                ? active
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400'
                            }`}
                          >
                            {app.status === 'approved'
                              ? active
                                ? 'Approved · Active'
                                : 'Approved · Expired'
                              : 'Rejected'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground break-all">ID: {app.id}</p>
                        <p className="text-sm">
                          {app.pickup_point} → {app.dropoff_point}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          Period: {app.period} · Reviewed{' '}
                          {app.reviewed_at ? new Date(app.reviewed_at).toLocaleDateString() : '—'}
                          {app.valid_until
                            ? ` · Valid until ${new Date(app.valid_until).toLocaleDateString()}`
                            : ''}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
