import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { gsap } from 'gsap';
import { AriaAction, IssueBoard } from './IssueBoard';
import { IssueContext, IssueBranch } from './IssueContext';
import {
  ArrowRight,
  ArrowLeft,
  Pencil,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleDashed,
  Clock3,
  Cloud,
  Database,
  ExternalLink,
  Eye,
  Folder,
  Gitlab,
  Info,
  ListChecks,
  List,
  Columns3,
  Network,
  PanelLeft,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Settings,
  Sparkles,
  UserCircle,
  X,
} from 'lucide-react';
import { AriaAvatar, AriaWorkspace, IssueActionView, Modal } from './AriaWorkflow';
import { initialIssues, phaseLabels, statuses, taskPlan } from './data';
import type { Issue, Phase, Priority, Run, Status } from './data';

const STORAGE = 'cc-studio-issues-v2';
const seed = () =>
  initialIssues.map((i) => ({
    ...i,
    source: i.source === 'Studio' ? ('Studio' as const) : ('GitLab' as const),
  }));
function loadIssues(): Issue[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE) || 'null');
    return Array.isArray(value) &&
      value.every((i) => typeof i.id === 'number' && typeof i.title === 'string')
      ? value
      : seed();
  } catch {
    return seed();
  }
}
const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ');
function StatusMark({ status }: { status: Status }) {
  return status === 'Done' ? (
    <CheckCircle2 size={14} />
  ) : status === 'In review' ? (
    <CircleDashed size={14} />
  ) : status === 'In progress' ? (
    <span className="cc-progress-dot" />
  ) : (
    <Circle size={14} />
  );
}
function Source({ source }: { source: Issue['source'] }) {
  return (
    <span className={cx('cc-source', source === 'Studio' && 'studio')}>
      {source === 'Studio' ? <span className="cc-mini-mark">∞</span> : <Gitlab size={14} />}{' '}
      {source === 'Studio' ? 'CC Studio' : 'GitLab'}
    </span>
  );
}
function GitMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="m11.3 1.8-9.5 9.5a1 1 0 0 0 0 1.4l9.5 9.5a1 1 0 0 0 1.4 0l9.5-9.5a1 1 0 0 0 0-1.4l-9.5-9.5a1 1 0 0 0-1.4 0"
      />
      <path d="m8 6 8 8M10 8v10" fill="none" stroke="white" strokeWidth="1.4" />
      <circle cx="10" cy="8" r="1.5" fill="white" />
      <circle cx="16" cy="14" r="1.5" fill="white" />
      <circle cx="10" cy="18" r="1.5" fill="white" />
    </svg>
  );
}

export default function App() {
  const [tab, setTab] = useState(() =>
    window.location.hash.startsWith('#issues') ? 'Issues' : 'Features',
  );
  useEffect(() => {
    document
      .querySelector('.cc-tab.active')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [tab]);
  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === '#cc-workspace') return;
      setTab(window.location.hash.startsWith('#issues') ? 'Issues' : 'Features');
      const match = window.location.hash.match(/^#issues\/(\d+)(?:\/aria)?$/);
      const action = window.location.hash.match(/^#issues\/(\d+)\/(aria|ticket)$/);
      setFixId(action?.[2] === 'aria' ? Number(action[1]) : null);
      setTicketId(action?.[2] === 'ticket' ? Number(action[1]) : null);
      const returnMatch = String(window.history.state?.returnHash || '').match(/^#issues\/(\d+)$/);
      setSelectedId(
        match ? Number(match[1]) : action && returnMatch ? Number(returnMatch[1]) : null,
      );
    };
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onHashChange);
    };
  }, []);
  const [issues, setIssues] = useState<Issue[]>(loadIssues);
  const [issueView, setIssueView] = useState<'list' | 'board'>(() => {
    try {
      return localStorage.getItem('cc-studio-issue-view') === 'board' ? 'board' : 'list';
    } catch {
      return 'list';
    }
  });
  const issuesRef = useRef<HTMLElement>(null);
  useEffect(() => {
    try {
      localStorage.setItem('cc-studio-issue-view', issueView);
    } catch {
      /* View remains available for the session. */
    }
  }, [issueView]);
  useLayoutEffect(() => {
    if (tab !== 'Issues' || !issuesRef.current) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const cards = issuesRef.current?.querySelectorAll('.cc-board-card, .cc-issue-table tbody tr');
      if (cards?.length)
        gsap.fromTo(
          cards,
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.35,
            stagger: 0.035,
            ease: 'power2.out',
            clearProps: 'opacity,transform',
          },
        );
    });
    return () => mm.revert();
  }, [tab, issueView]);
  const [status, setStatus] = useState('All');
  const [source, setSource] = useState('All sources');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const match = window.location.hash.match(/^#issues\/(\d+)(?:\/aria)?$/);
    return match ? Number(match[1]) : null;
  });
  const [fixId, setFixId] = useState<number | null>(() => {
    const m = window.location.hash.match(/^#issues\/(\d+)\/aria$/);
    return m ? Number(m[1]) : null;
  });
  const [ticketId, setTicketId] = useState<number | null>(() => {
    const m = window.location.hash.match(/^#issues\/(\d+)\/ticket$/);
    return m ? Number(m[1]) : null;
  });
  const [notice, setNotice] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [dev, setDev] = useState(false);
  const [message, setMessage] = useState('');
  const [context, setContext] = useState(true);
  const [history, setHistory] = useState(false);
  const [featureSearch, setFeatureSearch] = useState('');
  const [featureView, setFeatureView] = useState('Accepted');
  const [saved, setSaved] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = issues.find((i) => i.id === selectedId);
  const openIssue = (id: number) => {
    window.history.pushState({ ccIssuePage: true }, '', `#issues/${id}`);
    setSelectedId(id);
    setTab('Issues');
  };
  const backToIssues = () => {
    if (window.history.state?.ccIssuePage) window.history.back();
    else window.history.replaceState(null, '', '#issues');
    setSelectedId(null);
  };
  const navigateSection = (name: string) => {
    setFixId(null);
    setTicketId(null);
    window.history.pushState(null, '', name === 'Issues' ? '#issues' : '#features');
    setSelectedId(null);
    setTab(name);
  };
  const openAria = (id: number) => {
    if (selectedId !== id) openIssue(id);
    setFixId(null);
    requestAnimationFrame(() => {
      document
        .getElementById('issue-aria-workflow')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };
  const closeAction = () => {
    const id = fixId ?? ticketId;
    setFixId(null);
    setTicketId(null);
    if (window.history.state?.ccActionPage) window.history.back();
    else {
      window.history.replaceState(null, '', `#issues/${id}`);
      setSelectedId(id);
    }
  };
  const ticket = issues.find((i) => i.id === ticketId);
  const update = (id: number, changes: Partial<Issue>) =>
    setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)));
  const updateRun = (id: number, changes: Partial<Run>) =>
    setIssues((prev) =>
      prev.map((i) => (i.id === id && i.run ? { ...i, run: { ...i.run, ...changes } } : i)),
    );
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(issues));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [issues]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 3800);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    setPage(1);
  }, [status, source, query]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !createOpen &&
        selectedId === null &&
        fixId === null &&
        ticketId === null &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [createOpen, selectedId, fixId, ticketId]);
  useEffect(() => {
    const timer = setInterval(() => {
      setIssues((prev) => {
        let changed = false;
        const next = prev.map((i) => {
          if (!i.run?.startedAt) return i;
          const elapsed = Date.now() - i.run.startedAt;
          if (i.run.phase === 'analyzing' && elapsed > 2200) {
            changed = true;
            return { ...i, run: { ...i.run, phase: 'plan' as Phase, startedAt: undefined } };
          }
          if (i.run.phase === 'executing') {
            const count = i.run.tasks.filter((t) => t.enabled).length;
            const step = Math.min(count, Math.floor(elapsed / 2000));
            if (step !== i.run.step) {
              changed = true;
              return {
                ...i,
                status: step === count ? ('In review' as Status) : i.status,
                run: {
                  ...i.run,
                  step,
                  phase: step === count ? ('completed' as Phase) : ('executing' as Phase),
                  startedAt: step === count ? undefined : i.run.startedAt,
                },
              };
            }
          }
          return i;
        });
        return changed ? next : prev;
      });
    }, 500);
    return () => clearInterval(timer);
  }, []);
  const filtered = useMemo(
    () =>
      issues.filter(
        (i) =>
          (status === 'All' || i.status === status) &&
          (source === 'All sources' || i.source === source) &&
          `${i.title} ${i.id} ${i.label}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [issues, status, source, query],
  );
  const maxPage = Math.max(1, Math.ceil(filtered.length / 8));
  const currentPage = Math.min(page, maxPage);
  const shown = filtered.slice((currentPage - 1) * 8, currentPage * 8);
  const start = (id: number, instructions: string) => {
    const issue = issues.find((i) => i.id === id)!;
    update(id, {
      assignee: 'Aria',
      run: {
        phase: 'analyzing',
        instructions,
        tasks: taskPlan(issue.title),
        step: 0,
        startedAt: Date.now(),
      },
    });
  };
  const approve = (id: number) => {
    const issue = issues.find((i) => i.id === id)!;
    update(id, {
      status: 'In progress',
      assignee: 'Aria',
      run: { ...issue.run!, phase: 'executing', step: 0, startedAt: Date.now() },
    });
  };
  const create = (title: string, description: string, priority: Priority, plan: boolean) => {
    const id = Math.max(...issues.map((i) => i.id), 0) + 1;
    setIssues((prev) => [
      {
        id,
        title,
        description,
        priority,
        status: 'To do',
        label: 'Feature',
        source: 'Studio',
        assignee: '',
        comments: 0,
        date: 'Just now',
      },
      ...prev,
    ]);
    setCreateOpen(false);
    setStatus('All');
    setSource('All sources');
    setQuery('');
    setPage(1);
    setNotice('Issue created');
    openIssue(id);
    if (plan) openAria(id);
  };
  const existingAction = (name: string) => setNotice(`${name} is unavailable right now.`);
  const openTicket = (id: number) => {
    window.history.pushState(
      { ccActionPage: true, returnHash: window.location.hash },
      '',
      `#issues/${id}/ticket`,
    );
    setFixId(null);
    setTicketId(id);
  };
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    },
    [],
  );
  const sync = () => {
    setSyncing(true);
    syncTimer.current = setTimeout(() => {
      setSyncing(false);
      setNotice('Issue list refreshed');
    }, 800);
  };
  const tabs = [
    { name: 'Features', icon: Network },
    { name: 'Data Model', icon: Database },
    { name: 'User Flow', icon: Database },
    { name: 'Preview', icon: Eye },
    { name: 'Integrations' },
    { name: 'App Notifications' },
    { name: 'Issues', icon: ListChecks },
  ];
  const actionView = ticket ? (
    <IssueActionView
      title={`GitLab issue #${ticket.id}`}
      subtitle="Linked GitLab ticket"
      onBack={closeAction}
    >
      <div className="modal-body cc-ticket-preview">
        <div className="cc-ticket-heading">
          <Gitlab size={25} />
          <div>
            <strong>Realtime Dashboard</strong>
            <span>Issues / #{ticket.id}</span>
          </div>
          <span className="cc-connected">
            <i />
            Connected
          </span>
        </div>
        <h3>{ticket.title}</h3>
        <p>{ticket.description}</p>
        <div className="cc-ticket-preview-meta">
          <Source source={ticket.source} />
          <span className={cx('cc-status', ticket.status.toLowerCase().replaceAll(' ', '-'))}>
            <StatusMark status={ticket.status} />
            {ticket.status}
          </span>
        </div>
        <div className="cc-ticket-url">
          <ExternalLink size={15} />
          <code>gitlab.com/your-workspace/realtime-dashboard/-/issues/{ticket.id}</code>
        </div>
      </div>
      <div className="modal-footer">
        <button className="button primary" onClick={closeAction}>
          Done
        </button>
      </div>
    </IssueActionView>
  ) : null;
  return (
    <div className="cc-shell">
      <a className="cc-skip" href="#cc-workspace">
        Skip to workspace
      </a>
      <header className="cc-header">
        <a
          className="cc-brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigateSection('Features');
          }}
          aria-label="CC Studio"
        >
          <img src="/assets/cc-studio-logo.svg" alt="CC Studio" width="160" height="29" />
        </a>
        <div className="cc-header-actions">
          <button className="cc-project-button" onClick={() => existingAction('Project selection')}>
            Realtime Dashboard
            <ChevronDown size={14} />
          </button>
          <div className="cc-mode">
            <button className={!dev ? 'active' : ''} onClick={() => setDev(false)}>
              Pro Mode
            </button>
            <button className={dev ? 'active' : ''} onClick={() => setDev(true)}>
              Dev Mode
            </button>
          </div>
          <button className="cc-dark-button" onClick={() => existingAction('Regenerate')}>
            Regenerate
          </button>
          <button className="cc-git-button" aria-label="Git repository" onClick={sync}>
            <GitMark />
          </button>
          <button className="cc-dark-button" onClick={() => existingAction('Deploy')}>
            <Rocket size={17} />
            Deploy
          </button>
          <button className="cc-dark-button" onClick={sync}>
            <Cloud size={17} />
            Sync Code
          </button>
          <button className="cc-profile-button" onClick={() => existingAction('Profile')}>
            <UserCircle size={21} />
            AS
            <ChevronDown size={12} />
          </button>
        </div>
      </header>
      <div className={cx('cc-layout', (!leftOpen || tab === 'Issues') && 'left-collapsed')}>
        <aside className="cc-assistant" hidden={!leftOpen || tab === 'Issues'}>
          <div className="cc-assistant-status">
            <span>Workspace server is unreachable. Please try again later.</span>
            <button aria-label="View Studio history" onClick={() => setHistory(!history)}>
              <Clock3 size={22} />
            </button>
          </div>
          <div className="cc-chat">
            <div className="cc-user-message">Add Email Management feature</div>
            <div className="cc-suggested">
              <div className="cc-suggestion-title">
                <strong>Suggested changes</strong>
                <span>1 suggestions</span>
              </div>
              <div className="cc-feature-suggestion">
                <div className="cc-feature-tag">
                  <ChevronDown size={14} />
                  <b>FEATURE</b>
                  <span>1 items</span>
                </div>
                <div className="cc-feature-accept">
                  <div>
                    <strong>Email Management</strong>
                    <p>
                      Allows users to send, receive, organize, and manage their emails within the
                      application, ensuring efficient communication and inbox control.
                    </p>
                  </div>
                  <span>Accepted</span>
                </div>
              </div>
            </div>
            {history && (
              <div className="cc-history">
                <Clock3 size={15} />
                <span>Email Management feature accepted.</span>
                <button aria-label="Close history" onClick={() => setHistory(false)}>
                  <X size={13} />
                </button>
              </div>
            )}
          </div>
          <label className="cc-context">
            <input
              type="checkbox"
              checked={context}
              onChange={(e) => setContext(e.target.checked)}
            />
            <span>
              <strong>Context:</strong> Feature
            </span>
          </label>
          <form
            className="cc-composer"
            onSubmit={(e) => {
              e.preventDefault();
              if (message.trim()) {
                existingAction('Studio assistant');
                setMessage('');
              }
            }}
          >
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              aria-label="Message Studio"
              placeholder="Type your message here..."
            />
            <button aria-label="Send message" type="submit">
              <ArrowRight size={20} />
            </button>
          </form>
        </aside>
        <main className="cc-workspace" id="cc-workspace" tabIndex={-1}>
          <nav className="cc-tabs" aria-label="Studio sections">
            {tab !== 'Issues' && (
              <button
                className="cc-panel-toggle"
                onClick={() => setLeftOpen(!leftOpen)}
                aria-label={leftOpen ? 'Collapse assistant panel' : 'Show assistant panel'}
              >
                <PanelLeft size={24} />
              </button>
            )}
            <div className="cc-tab-items">
              {tabs.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  className={cx(
                    'cc-tab',
                    tab === name && 'active',
                    name === 'Issues' && 'issues-tab',
                  )}
                  onClick={() => {
                    if (name === 'Issues' || name === 'Features') navigateSection(name);
                    else existingAction(name);
                  }}
                  aria-current={tab === name ? 'page' : undefined}
                >
                  {Icon && <Icon size={16} />}
                  <span>{name}</span>
                  {name === 'Issues' && <i />}
                </button>
              ))}
            </div>
            <button
              className="cc-settings"
              aria-label="Project settings"
              onClick={() => existingAction('Project settings')}
            >
              <Settings size={20} />
            </button>
          </nav>
          {tab === 'Features' ? (
            <div className="cc-features-panel">
              <div className="cc-feature-toolbar">
                <div className="cc-breadcrumb">
                  <strong>Realtime Dashboard</strong>
                  <span>/</span>Features
                </div>
                <div className="cc-feature-controls">
                  <div className="cc-feature-toggle">
                    {['Accepted', 'Suggested'].map((v) => (
                      <button
                        key={v}
                        className={featureView === v ? 'active' : ''}
                        onClick={() => setFeatureView(v)}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <button
                    className="cc-add-feature"
                    aria-label="Add feature"
                    onClick={() => existingAction('Add feature')}
                  >
                    <Plus size={22} />
                  </button>
                  <label className="cc-feature-search">
                    <input
                      placeholder="Search"
                      aria-label="Search features"
                      value={featureSearch}
                      onChange={(e) => setFeatureSearch(e.target.value)}
                    />
                    <Search size={21} />
                  </label>
                </div>
              </div>
              <div className="cc-feature-grid">
                {[
                  {
                    name: 'Email Management',
                    description:
                      'Allows users to send, receive, organize, and manage emails within the application, ensuring efficient communication and inbox control.',
                    empty: true,
                  },
                  { name: 'User Management', description: 'This feature will be managing user' },
                  {
                    name: 'Files Management',
                    description: 'This feature will be managing file uploads',
                  },
                  { name: 'Email', description: 'This feature will be managing email jobs' },
                ]
                  .filter(
                    (f) =>
                      f.name.toLowerCase().includes(featureSearch.toLowerCase()) &&
                      (featureView === 'Accepted' || f.empty),
                  )
                  .map((f) => (
                    <section key={f.name} className="cc-feature-card">
                      <div className="cc-feature-card-head">
                        <Folder size={24} />
                        <div>
                          <strong>{f.name} ()</strong>
                          <p>{f.description}</p>
                        </div>
                      </div>
                      {f.empty ? (
                        <p className="cc-no-features">
                          <Info size={16} />
                          No functionalities specified.
                        </p>
                      ) : (
                        <div className="cc-feature-child">
                          <ChevronRight size={18} />
                          <div>
                            <strong>{f.name} ()</strong>
                            <p>{f.description}</p>
                          </div>
                        </div>
                      )}
                    </section>
                  ))}
              </div>
            </div>
          ) : actionView ? (
            actionView
          ) : selectedId !== null ? (
            selected ? (
              <IssueDetails
                key={selected.id}
                issue={selected}
                onClose={backToIssues}
                onChange={(c) => update(selected.id, c)}
                ariaWorkflow={
                  <AriaWorkspace
                    key={selected.id}
                    issue={selected}
                    onClose={backToIssues}
                    onStart={(instructions) => start(selected.id, instructions)}
                    onRunUpdate={(changes) => updateRun(selected.id, changes)}
                    onApprove={() => approve(selected.id)}
                    onDone={() => {
                      update(selected.id, { status: 'Done' });
                      setNotice('Issue marked as done');
                    }}
                  />
                }
                onTicket={() => openTicket(selected.id)}
              />
            ) : (
              <section className="cc-issue-page cc-missing-issue">
                <h1>Issue not found</h1>
                <p>This issue could not be found.</p>
                <button className="button" onClick={backToIssues}>
                  <ArrowLeft size={16} />
                  Back to issues
                </button>
              </section>
            )
          ) : (
            <section
              ref={issuesRef}
              className={`cc-issues-panel cc-issues-refresh ${issueView}-view`}
            >
              <div className="cc-issues-breadcrumb">
                <div className="cc-issues-heading">
                  <h1>Issues</h1>
                  <p>Plan, track, and ship your next update.</p>
                </div>
                <div className="cc-issues-header-actions">
                  <div className="cc-connected">
                    <Gitlab size={15} />
                    <span>GitLab connected</span>
                    <i />
                    <button aria-label="Refresh GitLab issues" onClick={sync}>
                      <RefreshCw size={14} className={syncing ? 'spin' : ''} />
                    </button>
                  </div>
                  <button className="button primary" onClick={() => setCreateOpen(true)}>
                    <Plus size={16} />
                    New issue
                  </button>
                </div>
              </div>
              <div className="cc-status-row">
                <div className="cc-issue-status-tabs" role="tablist" aria-label="Issue status">
                  {['All', ...statuses].map((s) => (
                    <button
                      key={s}
                      role="tab"
                      aria-selected={status === s}
                      className={status === s ? 'active' : ''}
                      onClick={() => setStatus(s)}
                    >
                      {s}
                      <span>
                        {s === 'All' ? issues.length : issues.filter((i) => i.status === s).length}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="cc-status-avatar" title="Aria · Your coding teammate">
                  <img src="/assets/aria-avatar.png" alt="Aria, your coding teammate" />
                </div>
              </div>
              <div className="cc-issue-toolbar">
                <label className="cc-issue-search">
                  <Search size={16} />
                  <input
                    ref={searchRef}
                    aria-label="Search issues"
                    placeholder="Search issues..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query ? (
                    <button aria-label="Clear search" onClick={() => setQuery('')}>
                      <X size={14} />
                    </button>
                  ) : (
                    <kbd>/</kbd>
                  )}
                </label>
                <select
                  aria-label="Filter by creation source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                >
                  <option>All sources</option>
                  <option value="Studio">Created in CC Studio</option>
                  <option value="GitLab">Created in GitLab</option>
                </select>
                <span className="cc-filtered-count">{filtered.length} issues</span>
                <div className="cc-view-toggle" role="group" aria-label="Issue view">
                  <button
                    aria-pressed={issueView === 'list'}
                    className={issueView === 'list' ? 'active' : ''}
                    onClick={() => setIssueView('list')}
                  >
                    <List size={15} />
                    List
                  </button>
                  <button
                    aria-pressed={issueView === 'board'}
                    className={issueView === 'board' ? 'active' : ''}
                    onClick={() => setIssueView('board')}
                  >
                    <Columns3 size={15} />
                    Board
                  </button>
                </div>
              </div>
              {issueView === 'board' ? (
                <>
                  <div className="cc-board-scroll">
                    <IssueBoard
                      issues={filtered}
                      onOpen={openIssue}
                      onFix={openAria}
                      onTicket={openTicket}
                      onMove={(id, nextStatus) => {
                        update(id, { status: nextStatus });
                        setNotice(`Issue #${id} moved to ${nextStatus}`);
                      }}
                    />
                  </div>
                  <div className="cc-board-hint">
                    <span>{filtered.length} issues · grouped by status</span>
                    <span>Drag to move, or use a card’s dropdown</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="cc-table-scroll">
                    <table className="cc-issue-table">
                      <thead>
                        <tr>
                          <th>Issue</th>
                          <th>Status</th>
                          <th>Created in</th>
                          <th>GitLab ticket</th>
                          <th>
                            <span className="cc-table-aria">
                              <Sparkles size={13} />
                              Aria
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {shown.map((i) => (
                          <tr key={i.id}>
                            <td>
                              <button className="cc-issue-title" onClick={() => openIssue(i.id)}>
                                {i.title}
                              </button>
                              <div className="cc-issue-subline">
                                <span className={cx('cc-type', i.label.toLowerCase())}>
                                  {i.label}
                                </span>
                                <span className={cx('cc-priority', i.priority.toLowerCase())}>
                                  <i />
                                  {i.priority}
                                </span>
                              </div>
                            </td>
                            <td>
                              <button
                                className={cx(
                                  'cc-status',
                                  i.status.toLowerCase().replaceAll(' ', '-'),
                                )}
                                onClick={() => openIssue(i.id)}
                              >
                                <StatusMark status={i.status} />
                                {i.status}
                              </button>
                            </td>
                            <td>
                              <Source source={i.source} />
                            </td>
                            <td>
                              <a
                                className="cc-ticket"
                                href={`#gitlab-issue-${i.id}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  openTicket(i.id);
                                }}
                                aria-label={`View GitLab ticket #${i.id}`}
                              >
                                <span>#{i.id}</span>
                                <ExternalLink size={12} />
                              </a>
                            </td>
                            <td>
                              <AriaAction issue={i} onClick={() => openAria(i.id)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!shown.length && (
                      <div className="cc-empty">
                        <Search size={25} />
                        <h3>No issues found</h3>
                        <p>Try another search or choose a different filter.</p>
                        <button
                          className="button"
                          onClick={() => {
                            setQuery('');
                            setSource('All sources');
                            setStatus('All');
                          }}
                        >
                          Clear filters
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="cc-pagination">
                    <span>
                      {filtered.length
                        ? `${(currentPage - 1) * 8 + 1}–${Math.min(currentPage * 8, filtered.length)} of ${filtered.length} issues`
                        : '0 issues'}
                    </span>
                    <div>
                      <button
                        aria-label="Previous page"
                        disabled={currentPage === 1}
                        onClick={() => setPage(currentPage - 1)}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span>
                        {currentPage} <small>/ {maxPage}</small>
                      </span>
                      <button
                        aria-label="Next page"
                        disabled={currentPage === maxPage}
                        onClick={() => setPage(currentPage + 1)}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
              <div className="cc-aria-note">
                <AriaAvatar small />
                <span>
                  <strong>You’re always in control.</strong> Aria starts only after you approve the
                  plan.
                </span>
              </div>
            </section>
          )}
        </main>
      </div>
      <footer className="cc-footer">© 2026 CodeConductorAI, Inc.</footer>
      {!saved && (
        <div className="cc-storage-warning">
          Changes are available for this session only; browser storage is unavailable.
        </div>
      )}
      {createOpen && <CreateIssue onClose={() => setCreateOpen(false)} onCreate={create} />}
      {notice && (
        <div className="cc-toast" role="status">
          <CheckCircle2 size={17} />
          {notice}
          <button aria-label="Dismiss notification" onClick={() => setNotice('')}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function CreateIssue({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (title: string, description: string, priority: Priority, plan: boolean) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [plan, setPlan] = useState(true);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (title.trim()) onCreate(title.trim(), description.trim(), priority, plan);
  };
  return (
    <Modal title="New issue" subtitle="Add a task to Realtime Dashboard." onClose={onClose} drawer>
      <form onSubmit={submit}>
        <div className="modal-body form-stack">
          <label>
            Issue title{' '}
            <span className="cc-required" aria-hidden="true">
              *
            </span>
            <input
              autoFocus
              required
              maxLength={160}
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            Description<span className="optional">Optional</span>
            <textarea
              rows={6}
              placeholder="Describe the expected outcome or what needs fixing..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label>
            Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {['High', 'Medium', 'Low'].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <div className="cc-create-source">
            <Source source="Studio" />
            <span>Created here, linked to a GitLab ticket.</span>
            <Gitlab size={16} />
          </div>
          <label className="cc-plan-checkbox">
            <input type="checkbox" checked={plan} onChange={(e) => setPlan(e.target.checked)} />
            <span>
              <strong>Make a plan with Aria</strong>
              <small>Review the tasks before anything starts.</small>
            </span>
            <AriaAvatar small />
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button primary" disabled={!title.trim()}>
            {plan ? <Sparkles size={15} /> : <Plus size={15} />}{' '}
            {plan ? 'Create & plan' : 'Create issue'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function IssueDetails({
  issue,
  onClose,
  onChange,
  ariaWorkflow,
  onTicket,
}: {
  issue: Issue;
  onClose: () => void;
  onChange: (changes: Partial<Issue>) => void;
  ariaWorkflow: ReactNode;
  onTicket: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [issue.id]);
  const save = () => {
    if (!title.trim()) return;
    onChange({ title: title.trim(), description: description.trim() });
    setEditing(false);
  };
  return (
    <section className="cc-issue-page" aria-label="Issue details">
      <div className="cc-detail-navigation">
        <button className="cc-back-button" onClick={onClose}>
          <ArrowLeft size={16} />
          Back to issues
        </button>
        <span>
          Realtime Dashboard <ChevronRight size={12} /> Issue #{issue.id}
        </span>
      </div>
      <header className="cc-issue-page-header cc-integrated-header">
        <div className="cc-detail-kicker">
          <span className={`cc-type ${issue.label.toLowerCase()}`}>{issue.label}</span>
          <span>ISSUE #{issue.id}</span>
        </div>
        {editing ? (
          <label className="cc-edit-title-label">
            Issue title
            <input
              aria-label="Issue title"
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
        ) : (
          <h1 ref={heading} tabIndex={-1}>
            {issue.title}
          </h1>
        )}
        <div className="cc-detail-byline">
          <span>
            Created in <Source source={issue.source} />
          </span>
          <span className="cc-byline-dot">·</span>
          <span>{issue.date}</span>
          <span className="cc-byline-dot">·</span>
          <IssueBranch issue={issue} />
          <span className="cc-byline-dot">·</span>
          <button className="cc-page-ticket" onClick={onTicket}>
            <Gitlab size={15} />
            <span>GitLab #{issue.id}</span>
            <ExternalLink size={12} />
          </button>
        </div>
        <div className="cc-issue-properties cc-header-properties" aria-label="Issue properties">
          <label>
            Status
            <select
              value={issue.status}
              onChange={(e) => onChange({ status: e.target.value as Status })}
            >
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select
              value={issue.priority}
              onChange={(e) => onChange({ priority: e.target.value as Priority })}
            >
              {['High', 'Medium', 'Low'].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <div className="cc-issue-page-grid">
        <div className="cc-issue-page-content">
          <section className="cc-description-section">
            <div className="cc-section-heading">
              <h2>Description</h2>
              {!editing ? (
                <button className="text-button" onClick={() => setEditing(true)}>
                  <Pencil size={13} />
                  Edit issue
                </button>
              ) : (
                <div className="cc-edit-actions">
                  <button
                    className="button"
                    onClick={() => {
                      setTitle(issue.title);
                      setDescription(issue.description);
                      setEditing(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button className="button primary" disabled={!title.trim()} onClick={save}>
                    Save changes
                  </button>
                </div>
              )}
            </div>
            {editing ? (
              <textarea
                aria-label="Issue description"
                rows={8}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            ) : (
              <p>
                {issue.description ||
                  'No description added yet. Add context to help your team get started.'}
              </p>
            )}
          </section>
          <section className="cc-page-aria">
            <div className="cc-aria-section-mascot">
              <AriaAvatar />
            </div>
            <div className="cc-page-aria-heading">
              <div>
                <span className="cc-section-eyebrow">YOUR CODING TEAMMATE</span>
                <h2>
                  {issue.status === 'Done'
                    ? 'This issue is complete'
                    : issue.run
                      ? phaseLabels[issue.run.phase]
                      : 'Let Aria take it from here'}
                </h2>
              </div>
            </div>
            <p>
              {issue.status === 'Done'
                ? 'The issue has been marked as resolved. You can revisit its status in the details panel.'
                : issue.run
                  ? 'Review the proposed tasks or follow Aria’s progress on this issue.'
                  : 'Aria turns this issue into a clear plan, then handles the code. You review and approve before execution starts.'}
            </p>
            {ariaWorkflow}
          </section>
          <IssueContext issue={issue} onChange={onChange} />
        </div>
      </div>
    </section>
  );
}
