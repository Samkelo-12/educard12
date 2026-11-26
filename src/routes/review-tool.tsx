import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  History,
  Inbox,
  Lock,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ApplicationDocument = {
  label: string;
  url: string;
};

type PendingApplication = {
  id: string;
  transport_site?: string | null;
  title?: string | null;
  surname?: string | null;
  first_names?: string | null;
  date_of_application?: string | null;
  date_of_birth?: string | null;
  citizenship?: string | null;
  cell_no?: string | null;
  email_address?: string | null;
  postal_address?: string | null;
  residence_name?: string | null;
  guardian_title?: string | null;
  guardian_surname?: string | null;
  guardian_first_names?: string | null;
  guardian_tel_home?: string | null;
  guardian_tel_work?: string | null;
  guardian_tel_cell?: string | null;
  guardian_postal_address?: string | null;
  guardian_email_address?: string | null;
  proposed_course_of_study?: string | null;
  special_treatment?: boolean | null;
  physical_disabilities_particulars?: string | null;
  form_of_payment?: string | null;
  declaration_accepted?: boolean | null;
  signature_name?: string | null;
  signature_date?: string | null;
  created_at: string;
  student_name: string;
  student_number: string;
  documents?: ApplicationDocument[];
  valid_until?: string | null;
};

type HistoryApplication = PendingApplication & {
  status: string;
  reviewed_at: string | null;
  valid_until: string | null;
  rejection_reason?: string | null;
};

type Tab = 'pending' | 'history';
type HistoryFilter = 'all' | 'approved' | 'rejected';
type PaymentFilter = 'ALL' | 'NSFAS' | 'Bursary' | 'Upfront Payment';
type SiteFilter = 'ALL' | 'Potsdam site' | 'Chiselhurst site';

export const Route = createFileRoute('/review-tool')({
  head: () => ({
    meta: [
      { title: 'Review Tool — EduCard' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ReviewToolPage,
});

function formatValue(val: unknown): string {
  if (val === null || val === undefined || val === '') return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  return String(val);
}

function ReviewToolPage() {
  const [secret, setSecret] = useState('');
  const [secretInput, setSecretInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [history, setHistory] = useState<HistoryApplication[]>([]);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [rebukeOpenIds, setRebukeOpenIds] = useState<Record<string, boolean>>({});
  const [previewKeys, setPreviewKeys] = useState<Record<string, boolean>>({});
  const [brokenPreviewKeys, setBrokenPreviewKeys] = useState<Record<string, boolean>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('ALL');
  const [siteFilter, setSiteFilter] = useState<SiteFilter>('ALL');
  const [tab, setTab] = useState<Tab>('pending');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRebukePanel = (app: HistoryApplication) => {
    setRebukeOpenIds((prev) => {
      const nextOpen = !prev[app.id];
      if (nextOpen && app.rejection_reason && rejectionReasons[app.id] === undefined) {
        setRejectionReasons((reasons) => ({
          ...reasons,
          [app.id]: app.rejection_reason ?? '',
        }));
      }
      return { ...prev, [app.id]: nextOpen };
    });
  };

  const togglePreview = (key: string) => {
    setBrokenPreviewKeys((prev) => ({ ...prev, [key]: false }));
    setPreviewKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setRejectionReason = (id: string, value: string) => {
    setRejectionReasons((prev) => ({ ...prev, [id]: value }));
  };

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
      const reason =
        status === 'rejected'
          ? (rejectionReasons[applicationId] ?? '').trim() || null
          : null;

      try {
        const res = await fetch('/api/public/admin-review-application', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId,
            status,
            secret,
            ...(status === 'rejected' ? { rejectionReason: reason } : {}),
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Review failed');
        }

        const reviewedPending = applications.find((a) => a.id === applicationId);
        const existingHistory = history.find((a) => a.id === applicationId);
        const sourceApp = reviewedPending ?? existingHistory;

        setApplications((prev) => prev.filter((a) => a.id !== applicationId));

        if (sourceApp) {
          const updatedRecord: HistoryApplication = {
            ...sourceApp,
            status,
            reviewed_at: new Date().toISOString(),
            valid_until:
              status === 'approved'
                ? (data.application?.valid_until ?? sourceApp.valid_until ?? null)
                : null,
            rejection_reason:
              status === 'rejected'
                ? (data.application?.rejection_reason ?? reason)
                : null,
          };

          setHistory((prev) =>
            existingHistory
              ? prev.map((item) => (item.id === applicationId ? updatedRecord : item))
              : [updatedRecord, ...prev],
          );
        }

        setRebukeOpenIds((prev) => {
          const next = { ...prev };
          delete next[applicationId];
          return next;
        });

        if (status === 'rejected') {
          setRejectionReasons((prev) => {
            const next = { ...prev };
            delete next[applicationId];
            return next;
          });
        }

        const valid = data.application?.valid_until;
        const actionLabel = existingHistory
          ? status === 'rejected'
            ? 'rebuked'
            : 'approved'
          : status;
        setNotice(
          `Application ${actionLabel}${valid ? ` — valid until ${valid}` : ''}${
            status === 'rejected' && reason ? ` (${reason})` : ''
          }.`,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Review failed');
      } finally {
        setBusyId(null);
      }
    },
    [secret, applications, history, rejectionReasons],
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

  const matchesSearchAndFilters = useCallback(
    (app: PendingApplication) => {
      if (paymentFilter !== 'ALL' && app.form_of_payment !== paymentFilter) {
        return false;
      }
      if (siteFilter !== 'ALL' && app.transport_site !== siteFilter) {
        return false;
      }

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      const haystack = [
        app.id,
        app.student_name,
        app.student_number,
        app.first_names,
        app.surname,
        app.residence_name,
        app.proposed_course_of_study,
        app.transport_site,
        app.form_of_payment,
        app.email_address,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    },
    [paymentFilter, siteFilter, searchQuery],
  );

  const filteredPending = useMemo(
    () => applications.filter(matchesSearchAndFilters),
    [applications, matchesSearchAndFilters],
  );

  const filteredHistory = useMemo(
    () =>
      history.filter((app) => {
        if (historyFilter === 'approved' && !isActive(app)) return false;
        if (historyFilter === 'rejected' && app.status !== 'rejected') return false;
        return matchesSearchAndFilters(app);
      }),
    [history, historyFilter, matchesSearchAndFilters],
  );

  const hasActiveFilters =
    Boolean(searchQuery.trim()) || paymentFilter !== 'ALL' || siteFilter !== 'ALL';

  const clearFilters = () => {
    setSearchQuery('');
    setPaymentFilter('ALL');
    setSiteFilter('ALL');
  };

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

  const renderDetailsAndDocuments = (app: PendingApplication) => {
    const docs = Array.isArray(app.documents) ? app.documents : [];
    const guardianFullName = [app.guardian_title, app.guardian_first_names, app.guardian_surname]
      .filter(Boolean)
      .join(' ')
      .trim();

    const detailItems: Array<[string, string]> = [
      ['Transport Site', formatValue(app.transport_site)],
      ['Date of Application', formatValue(app.date_of_application)],
      ['Date of Birth', formatValue(app.date_of_birth)],
      ['Citizenship', formatValue(app.citizenship)],
      ['Cell No.', formatValue(app.cell_no)],
      ['Email Address', formatValue(app.email_address)],
      ['Postal Address', formatValue(app.postal_address)],
      ['Residence Name', formatValue(app.residence_name)],
      ['Proposed Course', formatValue(app.proposed_course_of_study)],
      ['Payment Method', formatValue(app.form_of_payment)],
      ['Special Treatment', formatValue(app.special_treatment)],
      ['Disability Particulars', formatValue(app.physical_disabilities_particulars)],
      ['Guardian Name', guardianFullName || '—'],
      ['Guardian Cell', formatValue(app.guardian_tel_cell)],
      ['Guardian Home Tel', formatValue(app.guardian_tel_home)],
      ['Guardian Work Tel', formatValue(app.guardian_tel_work)],
      ['Guardian Email', formatValue(app.guardian_email_address)],
      ['Guardian Postal Address', formatValue(app.guardian_postal_address)],
      ['Declaration Accepted', formatValue(app.declaration_accepted)],
      ['Signature & Date', `${formatValue(app.signature_name)} (${formatValue(app.signature_date)})`],
    ];

    return (
      <div className="space-y-3 rounded-xl border border-border bg-background/60 p-3 text-xs">
        <div className="space-y-1.5">
          <p className="font-semibold uppercase tracking-wide text-muted-foreground">
            Application Form Details
          </p>
          <dl className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {detailItems.map(([label, val]) => (
              <div key={label} className="rounded-lg border border-border/60 bg-card px-2.5 py-1.5">
                <dt className="text-[11px] text-muted-foreground">{label}</dt>
                <dd className="font-medium text-foreground break-words">{val}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="space-y-1.5">
          <p className="font-semibold uppercase tracking-wide text-muted-foreground">
            Uploaded Documents
          </p>
          {docs.length === 0 ? (
            <p className="rounded-lg border border-border/60 bg-card px-2.5 py-2 text-muted-foreground">
              No uploaded documents found for this application.
            </p>
          ) : (
            <ul className="space-y-2">
              {docs.map((doc, idx) => {
                const docKey = `${app.id}-${doc.label}-${idx}`;
                const isPreviewOpen = Boolean(previewKeys[docKey]);
                const isBrokenImage = Boolean(brokenPreviewKeys[docKey]);

                return (
                  <li
                    key={docKey}
                    className="space-y-2 rounded-lg border border-border/60 bg-card px-2.5 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-medium text-foreground truncate">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{doc.label}</span>
                      </span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => togglePreview(docKey)}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium hover:bg-accent"
                        >
                          {isPreviewOpen ? 'Hide' : 'Preview'}
                        </button>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium hover:bg-accent"
                        >
                          Open
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    {isPreviewOpen ? (
                      <div className="overflow-hidden rounded-md border border-border/60 bg-background/80 p-2">
                        {!isBrokenImage ? (
                          <img
                            src={doc.url}
                            alt={doc.label}
                            onError={() =>
                              setBrokenPreviewKeys((prev) => ({ ...prev, [docKey]: true }))
                            }
                            className="max-h-72 w-full rounded object-contain"
                          />
                        ) : (
                          <div className="flex items-center justify-between gap-2 py-2 text-[11px] text-muted-foreground">
                            <span>Inline preview isn&apos;t available for this file (e.g. PDF).</span>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary hover:underline"
                            >
                              Open file
                            </a>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
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

            {/* Search & Filters (Funding + Site) */}
            <div className="space-y-2.5 rounded-2xl border border-border bg-card p-3.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, student no., residence, course..."
                  className="h-10 pl-9 pr-8 text-xs"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Funding / Payment</Label>
                  <Select
                    value={paymentFilter}
                    onValueChange={(val) => setPaymentFilter(val as PaymentFilter)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All funding</SelectItem>
                      <SelectItem value="NSFAS">NSFAS</SelectItem>
                      <SelectItem value="Bursary">Bursary</SelectItem>
                      <SelectItem value="Upfront Payment">Upfront Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Transport Site</Label>
                  <Select
                    value={siteFilter}
                    onValueChange={(val) => setSiteFilter(val as SiteFilter)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All sites</SelectItem>
                      <SelectItem value="Potsdam site">Potsdam site</SelectItem>
                      <SelectItem value="Chiselhurst site">Chiselhurst site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {hasActiveFilters ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    Reset search &amp; filters
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {tab === 'pending'
                  ? `${filteredPending.length} of ${applications.length} pending`
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
                {filteredPending.length === 0 && !loading ? (
                  <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                    {applications.length === 0
                      ? 'No pending applications.'
                      : 'No pending applications match your search or filters.'}
                  </p>
                ) : null}

                <ul className="space-y-3">
                  {filteredPending.map((app) => {
                    const isExpanded = Boolean(expandedIds[app.id]);
                    return (
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
                            Site: {app.transport_site || 'Not specified'} · Funding:{' '}
                            {app.form_of_payment || 'Not specified'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Submitted {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full justify-between"
                          onClick={() => toggleExpanded(app.id)}
                        >
                          <span>{isExpanded ? 'Hide Details & Documents' : 'View Details & Documents'}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>

                        {isExpanded ? renderDetailsAndDocuments(app) : null}

                        <div className="space-y-1">
                          <Label
                            htmlFor={`reject-reason-${app.id}`}
                            className="text-[11px] text-muted-foreground"
                          >
                            Rejection reason (optional)
                          </Label>
                          <Input
                            id={`reject-reason-${app.id}`}
                            value={rejectionReasons[app.id] ?? ''}
                            onChange={(e) => setRejectionReason(app.id, e.target.value)}
                            placeholder="Optional note if rejecting..."
                            className="h-9 text-xs"
                          />
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
                    );
                  })}
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
                    const isExpanded = Boolean(expandedIds[app.id]);
                    const isRebukeOpen = Boolean(rebukeOpenIds[app.id]);
                    const canReviewOrRebuke = active || app.status === 'rejected';

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
                          Site: {app.transport_site || 'Not specified'} · Funding:{' '}
                          {app.form_of_payment || 'Not specified'}
                        </p>
                        {app.status === 'rejected' && app.rejection_reason ? (
                          <p className="rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400">
                            Reason: {app.rejection_reason}
                          </p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          Reviewed{' '}
                          {app.reviewed_at ? new Date(app.reviewed_at).toLocaleDateString() : '—'}
                          {app.valid_until
                            ? ` · Valid until ${new Date(app.valid_until).toLocaleDateString()}`
                            : ''}
                        </p>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full justify-between"
                          onClick={() => toggleExpanded(app.id)}
                        >
                          <span>{isExpanded ? 'Hide Details & Documents' : 'View Details & Documents'}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>

                        {isExpanded ? renderDetailsAndDocuments(app) : null}

                        {canReviewOrRebuke ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full justify-between border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => toggleRebukePanel(app)}
                          >
                            <span>
                              {isRebukeOpen
                                ? 'Close Review / Rebuke'
                                : active
                                  ? 'Review / Rebuke Pass'
                                  : 'Re-review / Rebuke'}
                            </span>
                            {isRebukeOpen ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        ) : null}

                        {isRebukeOpen ? (
                          <div className="space-y-2.5 rounded-xl border border-destructive/30 bg-background/70 p-3">
                            <div className="space-y-1">
                              <Label
                                htmlFor={`history-rebuke-reason-${app.id}`}
                                className="text-[11px] text-muted-foreground"
                              >
                                Rebuke / rejection reason
                              </Label>
                              <Input
                                id={`history-rebuke-reason-${app.id}`}
                                value={rejectionReasons[app.id] ?? ''}
                                onChange={(e) => setRejectionReason(app.id, e.target.value)}
                                placeholder="Enter reason for rebuking this application..."
                                className="h-9 text-xs"
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex-1"
                                disabled={busyId === app.id}
                                onClick={() => void review(app.id, 'rejected')}
                              >
                                <X className="h-4 w-4" />
                                Rebuke
                              </Button>
                              {app.status === 'rejected' ? (
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  disabled={busyId === app.id}
                                  onClick={() => void review(app.id, 'approved')}
                                >
                                  <Check className="h-4 w-4" />
                                  Approve
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
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
