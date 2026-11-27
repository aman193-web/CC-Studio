import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { gsap } from 'gsap';
import { IssueBoard } from './IssueBoard';
import { IssueContext, IssueBranch } from './IssueContext';
import {
  ArrowRight,
  ArrowLeft,
  Pencil,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
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
  UserCircle,
  X,
} from 'lucide-react';
import { AriaAvatar, AriaWorkspace, IssueActionView } from './AriaWorkflow';
import { initialIssues, issueLabels, phaseLabels, statuses, taskPlan } from './data';
import type { Issue, Phase, Priority, Run } from './data';

import { CreateIssue } from './CreateIssue';
import { IssueList } from './IssueList';
import {
  ChildIssues,
  IssueLabels,
  LabelPicker,
  ParentFields,
  StatusBadge,
  SecondaryBadge,
  useIssueMotion,
} from './IssueHierarchy';
import {
  ancestors,
  association,
  hasLabel,
  labelsOf,
  migrateIssues,
  newIssueData,
  reconcileApprovedWork,
  searchIssue,
  uid,
  validateIssue,
} from './issueModel';
const STORAGE = 'cc-studio-issues-batch1';
const seed = () => {
  const base = initialIssues.map((i) => ({
    ...i,
    source: i.source === 'Studio' ? ('Studio' as const) : ('GitLab' as const),
  }));
  const epic = {
    ...newIssueData(50, 'Analytics and reporting', ['Epic']),
    description: 'Make dashboard data easier to explore, understand, and export.',
  };
  const story = {
    ...newIssueData(51, 'Explore dashboard analytics', ['Story']),
    description: 'As a workspace member, I can filter, sort, and export analytics.',
    parentIssueId: 50,
  };
  const auth = {
    ...newIssueData(52, 'User authentication', ['Epic']),
    description: 'Provide a reliable and accessible sign-in experience.',
  };
  const login = {
    ...newIssueData(53, 'Reliable sign-in and recovery', ['Story']),
    description: 'Help users return to their work after signing in.',
    parentIssueId: 52,
  };
  return migrateIssues([
    ...base.map((i) => ({
      ...i,
      parentIssueId: [42, 38, 36, 33, 31].includes(i.id) ? 51 : [41, 34].includes(i.id) ? 53 : null,
    })),
    epic,
    story,
    auth,
    login,
  ]);
};
function loadIssues(): Issue[] {
  try {
    const saved = localStorage.getItem(STORAGE);
    const legacy = localStorage.getItem('cc-studio-issues-v2');
    const value = JSON.parse(saved || legacy || 'null');
    if (
      Array.isArray(value) &&
      value.every((i) => typeof i.id === 'number' && typeof i.title === 'string')
    ) {
      if (!saved && legacy && !localStorage.getItem('cc-studio-issues-v2-before-batch1'))
        localStorage.setItem('cc-studio-issues-v2-before-batch1', legacy);
      return migrateIssues(value);
    }
    return seed();
  } catch {
    return seed();
  }
}
const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ');
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
  const [epicFilter, setEpicFilter] = useState('');
  const [storyFilter, setStoryFilter] = useState('');
  const [labelFilter, setLabelFilter] = useState('');
  const [listPage, setListPage] = useState(1);
  const [groupBy, setGroupBy] = useState(() => {
    try {
      return localStorage.getItem('cc-studio-group-by') || 'None';
    } catch {
      return 'None';
    }
  });
  useEffect(() => {
    setListPage(1);
  }, [status, source, query, epicFilter, storyFilter, labelFilter, groupBy]);
  const [createParent, setCreateParent] = useState<number | undefined>();
  useEffect(() => {
    try {
      localStorage.setItem('cc-studio-group-by', groupBy);
    } catch {
      /* Session preference remains available. */
    }
  }, [groupBy]);
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
  const noticeRef = useIssueMotion(notice);
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
    window.history.pushState(null, '', '#issues');
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
  const update = (id: number, changes: Partial<Issue>) => {
    const original = issues.find((i) => i.id === id);
    if (!original) return;
    const candidate = { ...original, ...changes, updatedAt: new Date().toISOString() };
    const error = validateIssue(candidate, issues);
    if (error) {
      setNotice(error);
      return;
    }
    setIssues((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...changes, updatedAt: candidate.updatedAt } : i)),
    );
  };
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
                status: step === count ? ('Completed' as const) : ('AI Working' as const),
                workItems: (i.workItems || []).map((work) => {
                  const taskIndex = i
                    .run!.tasks.filter((t) => t.enabled)
                    .findIndex((t) => t.workItemId === work.id);
                  if (taskIndex < 0 || work.status === 'Completed') return work;
                  const status =
                    taskIndex < step
                      ? ('Completed' as const)
                      : taskIndex === step
                        ? ('AI Working' as const)
                        : ('To Do' as const);
                  return {
                    ...work,
                    status,
                    updatedAt: new Date().toISOString(),
                    subtasks: work.subtasks.map((sub) =>
                      sub.status === 'Completed' ? sub : { ...sub, status },
                    ),
                  };
                }),
                run: {
                  ...i.run,
                  verified: step === count,
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
          (!epicFilter || association(i, issues, 'Epic')?.id === Number(epicFilter)) &&
          (!storyFilter || association(i, issues, 'Story')?.id === Number(storyFilter)) &&
          (!labelFilter || hasLabel(i, labelFilter)) &&
          searchIssue(i, issues, query),
      ),
    [issues, status, source, query, epicFilter, storyFilter, labelFilter],
  );
  const makeRun = (issue: Issue, instructions: string): Run => {
    const work = issue.workItems || [];
    const hasChildren = issues.some((i) => i.parentIssueId === issue.id);
    return {
      id: uid(),
      planId: uid(),
      phase: 'analyzing',
      instructions,
      mode: 'preview',
      step: 0,
      startedAt: Date.now(),
      tasks: work.length
        ? work
            .filter((w) => w.status !== 'Completed')
            .map((w, index) => ({
              id: index + 1,
              workItemId: w.id,
              title: w.title,
              detail: w.description,
              subtasks: w.subtasks.map((s) => s.title),
              agent: w.assignee || 'Aria',
              enabled: true,
            }))
        : hasChildren
          ? []
          : taskPlan(issue.title),
    };
  };
  const start = (id: number, instructions: string) => {
    const issue = issues.find((i) => i.id === id)!;
    const run = makeRun(issue, instructions);
    update(id, {
      run,
      draftPlanId: run.planId,
      runHistory: issue.run ? [...(issue.runHistory || []), issue.run] : issue.runHistory,
    });
  };
  const approve = (id: number) => {
    const issue = issues.find((i) => i.id === id)!;
    if (!issue.run || issue.run.phase !== 'plan' || !issue.run.tasks.some((t) => t.enabled)) return;
    let run: Run = {
      ...issue.run,
      phase: 'executing',
      approvedAt: new Date().toISOString(),
      step: 0,
      startedAt: Date.now(),
    };
    const workItems = reconcileApprovedWork(issue, run);
    run = {
      ...run,
      tasks: run.tasks.map((t) => ({
        ...t,
        workItemId:
          t.workItemId ||
          workItems.find((w) => w.planId === run.planId && w.id.endsWith(`-task-${t.id}`))?.id,
      })),
    };
    const first = run.tasks.find((t) => t.enabled)?.workItemId;
    update(id, {
      status: 'AI Working',
      approvedPlanId: run.planId,
      draftPlanId: undefined,
      run,
      workItems: workItems.map((w) => ({
        ...w,
        runId: run.tasks.some((t) => t.workItemId === w.id) ? run.id : w.runId,
        status: w.id === first && w.status !== 'Completed' ? 'AI Working' : w.status,
      })),
    });
  };
  const create = (draft: Issue, plan: boolean) => {
    const id = Math.max(...issues.map((i) => i.id), 0) + 1;
    const issue = { ...draft, id };
    if (plan) {
      issue.run = makeRun(issue, '');
      issue.draftPlanId = issue.run.planId;
    }
    setIssues((prev) => [issue, ...prev]);
    setCreateOpen(false);
    setCreateParent(undefined);
    setNotice('Issue created');
    openIssue(id);
  };
  const openCreate = (parent?: number) => {
    setCreateParent(parent);
    setCreateOpen(true);
  };
  const clearFilters = () => {
    setQuery('');
    setSource('All sources');
    setStatus('All');
    setEpicFilter('');
    setStoryFilter('');
    setLabelFilter('');
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
            <StatusBadge issue={ticket} />
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
                issues={issues}
                onOpen={openIssue}
                onFix={openAria}
                onCreateChild={openCreate}
                onAssociate={(id, parentIssueId) => update(id, { parentIssueId })}
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
                      if (!selected.run?.verified) {
                        setNotice('Verification is required before completion.');
                        return;
                      }
                      update(selected.id, { status: 'Completed' });
                      setNotice('Issue completed');
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
                  <button className="button primary" onClick={() => openCreate()}>
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
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                          e.preventDefault();
                          const options = ['All', ...statuses];
                          const index =
                            (options.indexOf(s) +
                              (e.key === 'ArrowRight' ? 1 : -1) +
                              options.length) %
                            options.length;
                          setStatus(options[index]);
                          (e.currentTarget.parentElement?.children[index] as HTMLElement)?.focus();
                        }
                      }}
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
                <select
                  aria-label="Filter by Epic"
                  value={epicFilter}
                  onChange={(e) => {
                    setEpicFilter(e.target.value);
                    setStoryFilter('');
                  }}
                >
                  <option value="">All Epics</option>
                  {issues
                    .filter((i) => hasLabel(i, 'Epic'))
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.title}
                      </option>
                    ))}
                </select>
                <select
                  aria-label="Filter by Story"
                  value={storyFilter}
                  onChange={(e) => setStoryFilter(e.target.value)}
                >
                  <option value="">All Stories</option>
                  {issues
                    .filter(
                      (i) =>
                        hasLabel(i, 'Story') &&
                        (!epicFilter || i.parentIssueId === Number(epicFilter)),
                    )
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.title}
                      </option>
                    ))}
                </select>
                <select
                  aria-label="Filter by label"
                  value={labelFilter}
                  onChange={(e) => setLabelFilter(e.target.value)}
                >
                  <option value="">All labels</option>
                  {[...new Set([...issueLabels, ...issues.flatMap(labelsOf)])].map((label) => (
                    <option key={label}>{label}</option>
                  ))}
                </select>
                {issueView === 'list' && (
                  <label className="cc-group-control">
                    Group by
                    <select
                      aria-label="Group by"
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value)}
                    >
                      {['None', 'Epic', 'Story'].map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                  </label>
                )}
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
                      allIssues={issues}
                    />
                  </div>
                  <div className="cc-board-hint">
                    <span>{filtered.length} issues · grouped by status</span>
                    <span>Status follows approved execution</span>
                  </div>
                </>
              ) : (
                <IssueList
                  page={listPage}
                  onPage={setListPage}
                  issues={filtered}
                  allIssues={issues}
                  groupBy={groupBy}
                  onOpen={openIssue}
                  onFix={openAria}
                  onTicket={openTicket}
                  onClear={clearFilters}
                />
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
      {createOpen && (
        <CreateIssue
          issues={issues}
          parentId={createParent}
          onClose={() => setCreateOpen(false)}
          onCreate={create}
        />
      )}
      {notice && (
        <div ref={noticeRef} className="cc-toast" role="status">
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

function IssueDetails({
  issue,
  issues,
  onOpen,
  onFix,
  onCreateChild,
  onAssociate,
  onClose,
  onChange,
  ariaWorkflow,
  onTicket,
}: {
  issue: Issue;
  issues: Issue[];
  onOpen: (id: number) => void;
  onFix: (id: number) => void;
  onCreateChild: (parent: number) => void;
  onAssociate: (id: number, parentId: number | null) => void;
  onClose: () => void;
  onChange: (changes: Partial<Issue>) => void;
  ariaWorkflow: ReactNode;
  onTicket: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [organizing, setOrganizing] = useState(false);
  const detailMotion = useIssueMotion(issue.id);
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
          <button onClick={onClose}>Issues</button>
          {ancestors(issue, issues).map((parent) => (
            <span key={parent.id} className="cc-breadcrumb-parent">
              <ChevronRight size={12} />
              <button onClick={() => onOpen(parent.id)}>{parent.title}</button>
            </span>
          ))}
          <ChevronRight size={12} /> Issue #{issue.id}
        </span>
      </div>
      <header className="cc-issue-page-header cc-integrated-header">
        <div className="cc-detail-kicker">
          <IssueLabels issue={issue} />
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
          <div className="cc-status-property">
            <span>Status</span>
            <StatusBadge issue={issue} />
            <SecondaryBadge issue={issue} />
          </div>
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
        <div className="cc-organize-line">
          <span>
            Assigned to <strong>{issue.assignee || 'Unassigned'}</strong>
          </span>
          {ancestors(issue, issues)
            .filter((p) => hasLabel(p, 'Epic') || hasLabel(p, 'Story'))
            .map((p) => (
              <button key={p.id} onClick={() => onOpen(p.id)}>
                <span className={`cc-type ${hasLabel(p, 'Epic') ? 'epic' : 'story'}`}>
                  {hasLabel(p, 'Epic') ? 'Epic' : 'Story'}
                </span>
                {p.title}
              </button>
            ))}
          <button
            className="text-button"
            onClick={() => setOrganizing(!organizing)}
            aria-expanded={organizing}
          >
            Edit labels & relationships
          </button>
        </div>
        {organizing && (
          <div className="cc-organize-editor">
            <LabelPicker
              value={labelsOf(issue)}
              extra={issues.flatMap(labelsOf)}
              onChange={(labels) =>
                onChange({
                  labels,
                  label: labels[0] || '',
                  parentIssueId: labels.includes('Epic') ? null : issue.parentIssueId,
                })
              }
            />
            <ParentFields
              issue={issue}
              issues={issues}
              onChange={(parentIssueId) => onChange({ parentIssueId })}
            />
            <label>
              Assignee
              <input
                aria-label="Issue assignee"
                value={issue.assignee}
                placeholder="Unassigned"
                onChange={(e) => onChange({ assignee: e.target.value })}
              />
            </label>
          </div>
        )}
      </header>
      <div ref={detailMotion} className="cc-issue-page-grid">
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
          <ChildIssues
            issue={issue}
            issues={issues}
            onOpen={onOpen}
            onFix={onFix}
            onCreate={onCreateChild}
            onAssociate={onAssociate}
          />
          <section className="cc-page-aria">
            <div className="cc-aria-section-mascot">
              <AriaAvatar />
            </div>
            <div className="cc-page-aria-heading">
              <div>
                <span className="cc-section-eyebrow">YOUR CODING TEAMMATE</span>
                <h2>
                  {issue.status === 'Completed'
                    ? 'This issue is complete'
                    : issue.run
                      ? phaseLabels[issue.run.phase]
                      : 'Let Aria take it from here'}
                </h2>
              </div>
            </div>
            <p>
              {issue.status === 'Completed'
                ? 'The required work has been completed. Its tasks and history remain available below.'
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
