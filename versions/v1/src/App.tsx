import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { gsap } from 'gsap';
import {
  Activity,
  Bell,
  Blocks,
  BookOpen,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Circle,
  CircleDashed,
  CircleHelp,
  Cloud,
  Code2,
  Database,
  Ellipsis,
  Eye,
  FileCode2,
  Filter,
  Folder,
  GitBranch,
  Github,
  Gitlab,
  GitPullRequest,
  LayoutDashboard,
  LayoutGrid,
  List,
  LoaderCircle,
  Mail,
  MessageSquare,
  Network,
  PanelLeftClose,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { initialProjects, phaseLabels, statuses, taskPlan } from './data';
import type { Issue, Phase, Priority, Project, Run, Status, Task } from './data';

const STORAGE = 'cc-studio-projects-v1';
const loadProjects = (): Project[] => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) || 'null');
    return Array.isArray(saved) && saved.every((p) => p.id && Array.isArray(p.issues))
      ? saved
      : initialProjects;
  } catch {
    return initialProjects;
  }
};
const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ');
function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return name === 'Aria' ? (
    <AriaAvatar small={small} />
  ) : (
    <span
      className={cx('avatar', small && 'small', !name && 'unassigned', name === 'RK' && 'peach')}
      title={name === 'AS' ? 'Aman Singh' : name === 'RK' ? 'Riya Kapoor' : 'Unassigned'}
    >
      {name || <Users size={13} />}
    </span>
  );
}
function AriaAvatar({ small = false, large = false }: { small?: boolean; large?: boolean }) {
  return (
    <span className={cx('aria-avatar', small && 'small', large && 'large')}>
      <img
        src="/assets/aria-avatar.png"
        alt="Aria"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      <Sparkles className="avatar-fallback" size={small ? 15 : 22} />
    </span>
  );
}
function StatusIcon({ status }: { status: Status }) {
  return status === 'Done' ? (
    <CheckCircle2 size={15} />
  ) : status === 'In review' ? (
    <CircleDashed size={15} />
  ) : status === 'In progress' ? (
    <span className="progress-status" />
  ) : (
    <Circle size={15} />
  );
}
function PriorityIcon({ priority }: { priority: Priority }) {
  return (
    <span
      className={cx('priority-bars', priority.toLowerCase())}
      aria-label={`${priority} priority`}
    >
      <i />
      <i />
      <i />
    </span>
  );
}
function RepoIcon({ provider, size = 16 }: { provider: string; size?: number }) {
  return provider === 'GitLab' ? (
    <Gitlab size={size} />
  ) : provider === 'Studio' ? (
    <Blocks size={size} />
  ) : (
    <Github size={size} />
  );
}
function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const el = ref.current!;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (el.querySelector('[autofocus], input, textarea, button') as HTMLElement)?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current();
      if (e.key === 'Tab') {
        const list = Array.from(
          el.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), textarea, select, [tabindex="0"], a[href]',
          ),
        ).filter((x) => x.offsetParent !== null);
        if (!list.length) return;
        if (e.shiftKey && document.activeElement === list[0]) {
          e.preventDefault();
          list.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === list.at(-1)) {
          e.preventDefault();
          list[0].focus();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = bodyOverflow;
      previous?.focus();
    };
  }, []);
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(ref.current, {
        opacity: 0,
        y: 12,
        scale: 0.985,
        duration: 0.25,
        ease: 'power2.out',
      });
    });
    return () => mm.revert();
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className={cx('modal', wide && 'wide')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="modal-header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
function IssueCard({
  issue,
  onOpen,
  onFix,
  onMove,
}: {
  issue: Issue;
  onOpen: () => void;
  onFix: () => void;
  onMove: (s: Status) => void;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <article
      className="issue-card"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(issue.id));
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      <div className="card-top">
        <span className="issue-id">
          <RepoIcon provider={issue.source} size={13} />
          <span>RTD-{issue.id}</span>
        </span>
        <div className="card-actions">
          <PriorityIcon priority={issue.priority} />
          <button
            className="icon-button tiny"
            aria-label={`Actions for RTD-${issue.id}`}
            onClick={() => setMenu(!menu)}
          >
            <Ellipsis size={17} />
          </button>
          {menu && (
            <div className="dropdown card-menu">
              <span className="menu-label">Move to</span>
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onMove(s);
                    setMenu(false);
                  }}
                >
                  <StatusIcon status={s} />
                  {s}
                  {s === issue.status && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <button className="issue-title" onClick={onOpen}>
        {issue.title}
      </button>
      <div className="card-labels">
        <span className={cx('label', issue.label.toLowerCase())}>
          {issue.label === 'Bug' && <span className="label-dot" />}
          {issue.label}
        </span>
        {issue.priority === 'High' && <span className="high-label">High priority</span>}
      </div>
      {issue.run && (
        <button
          className={cx(
            'run-strip',
            issue.run.phase === 'clarification' && 'question',
            issue.run.phase === 'completed' && 'finished',
          )}
          onClick={onFix}
        >
          {issue.run.phase === 'clarification' ? (
            <CircleHelp size={13} />
          ) : issue.run.phase === 'completed' ? (
            <CheckCheck size={13} />
          ) : (
            <Sparkles size={13} />
          )}
          <span>{phaseLabels[issue.run.phase]}</span>
          {issue.run.phase === 'clarification' && <span className="attention-dot" />}
        </button>
      )}
      <div className="card-footer">
        <div className="card-people">
          <Avatar name={issue.assignee} small />
          <span>{issue.assignee === 'Aria' ? 'Aria' : issue.date}</span>
        </div>
        <div className="card-meta">
          {issue.comments > 0 && (
            <span>
              <MessageSquare size={13} />
              {issue.comments}
            </span>
          )}
          {!issue.run && issue.status !== 'Done' && (
            <button
              className="fix-mini"
              aria-label={`Fix ${issue.title} with Aria`}
              title="Fix with Aria"
              onClick={onFix}
            >
              <Sparkles size={13} />
              <span>Fix with Aria</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>(loadProjects);
  const [projectId, setProjectId] = useState('realtime');
  const project = projects.find((p) => p.id === projectId) || projects[0];
  const issues = project.issues;
  const [section, setSection] = useState('Issues');
  const [view, setView] = useState<'board' | 'list'>('board');
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [priorityFilter, setPriorityFilter] = useState('All priorities');
  const [sort, setSort] = useState('Newest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [modal, setModal] = useState<
    'create' | 'repository' | 'help' | 'settings' | 'activity' | null
  >(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [fixId, setFixId] = useState<number | null>(null);
  const [projectMenu, setProjectMenu] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState('just now');
  const [devMode, setDevMode] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [createStatus, setCreateStatus] = useState<Status>('To do');
  const [storageError, setStorageError] = useState(false);
  const [activity, setActivity] = useState<string[]>([]);
  const main = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const updateProject = (fn: (p: Project) => Project) =>
    setProjects((prev) => prev.map((p) => (p.id === projectId ? fn(p) : p)));
  const updateIssue = (id: number, changes: Partial<Issue>) =>
    updateProject((p) => ({
      ...p,
      issues: p.issues.map((i) => (i.id === id ? { ...i, ...changes } : i)),
    }));
  const notify = (message: string) => {
    setToast(message);
    setActivity((a) => [message, ...a].slice(0, 8));
  };
  const moveIssue = (id: number, status: Status) => {
    updateIssue(id, { status });
    notify(`RTD-${id} moved to ${status.toLowerCase()}`);
  };
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(projects));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [projects]);
  useEffect(() => {
    if (modal !== 'create') setCreateStatus('To do');
  }, [modal]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !modal &&
        fixId === null &&
        selectedId === null
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setProjectMenu(false);
        setFiltersOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [modal, fixId, selectedId]);
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.enter', { y: 14, opacity: 0, stagger: 0.055, duration: 0.5, ease: 'power2.out' });
    });
    return () => mm.revert();
  }, []);
  useEffect(() => {
    const tick = setInterval(() => {
      setProjects((prev) => {
        let changed = false;
        const next = prev.map((p) => ({
          ...p,
          issues: p.issues.map((i) => {
            if (!i.run?.startedAt) return i;
            const elapsed = Date.now() - i.run.startedAt;
            if (i.run.phase === 'analyzing' && elapsed > 2800) {
              changed = true;
              return { ...i, run: { ...i.run, phase: 'plan' as Phase, startedAt: undefined } };
            }
            if (i.run.phase === 'executing') {
              const enabled = i.run.tasks.filter((t) => t.enabled).length;
              const step = Math.min(enabled, Math.floor(elapsed / 2200));
              if (step !== i.run.step) {
                changed = true;
                return {
                  ...i,
                  status: step >= enabled ? ('In review' as Status) : i.status,
                  run: {
                    ...i.run,
                    step,
                    phase: step >= enabled ? ('completed' as Phase) : ('executing' as Phase),
                    startedAt: step >= enabled ? undefined : i.run.startedAt,
                  },
                };
              }
            }
            return i;
          }),
        }));
        return changed ? next : prev;
      });
    }, 650);
    return () => clearInterval(tick);
  }, []);
  const counts = {
    all: issues.length,
    mine: issues.filter((i) => i.assignee === 'AS').length,
    aria: issues.filter((i) => i.assignee === 'Aria').length,
  };
  const filtered = useMemo(
    () =>
      issues
        .filter(
          (i) =>
            (tab === 'all' || (tab === 'mine' ? i.assignee === 'AS' : i.assignee === 'Aria')) &&
            (!query ||
              `${i.title} RTD-${i.id} ${i.label}`.toLowerCase().includes(query.toLowerCase())) &&
            (statusFilter === 'All statuses' ||
              (statusFilter === 'Active' ? i.status !== 'Done' : i.status === statusFilter)) &&
            (priorityFilter === 'All priorities' || i.priority === priorityFilter),
        )
        .sort((a, b) =>
          sort === 'Priority'
            ? ['High', 'Medium', 'Low'].indexOf(a.priority) -
              ['High', 'Medium', 'Low'].indexOf(b.priority)
            : sort === 'Oldest'
              ? a.id - b.id
              : b.id - a.id,
        ),
    [issues, tab, query, statusFilter, priorityFilter, sort],
  );
  const visibleStatuses =
    statusFilter === 'Active'
      ? statuses.filter((s) => s !== 'Done')
      : statusFilter === 'All statuses'
        ? statuses
        : [statusFilter as Status];
  const running = issues.filter(
    (i) => i.run && ['clarification', 'plan', 'analyzing', 'executing'].includes(i.run.phase),
  );
  const done = issues.filter((i) => i.status === 'Done').length;
  const recentCompleted = issues.find((i) => i.run?.phase === 'completed');
  const recentInProgress = issues.find((i) => i.status === 'In progress' && i.assignee !== 'Aria');
  const selected = issues.find((i) => i.id === selectedId);
  const fixIssue = issues.find((i) => i.id === fixId);
  const sync = () => {
    if (!project.connected) {
      setModal('repository');
      return;
    }
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncedAt('just now');
      notify('Demo repository is up to date. Changes are saved locally.');
    }, 1100);
  };
  const createIssue = (
    data: {
      title: string;
      description: string;
      priority: Priority;
      label: string;
      assignee: string;
    },
    plan: boolean,
  ) => {
    const id = Math.max(0, ...issues.map((i) => i.id)) + 1;
    const issue: Issue = {
      ...data,
      id,
      status: createStatus,
      source: 'Studio',
      comments: 0,
      date: 'Today',
    };
    updateProject((p) => ({ ...p, issues: [issue, ...p.issues] }));
    setModal(null);
    setStatusFilter(createStatus === 'Done' ? 'Done' : 'Active');
    setTab('all');
    setQuery('');
    notify(`RTD-${id} created${project.connected ? ' · queued for demo sync' : ''}`);
    if (plan) setFixId(id);
  };
  const startRun = (id: number, instructions: string) => {
    updateIssue(id, {
      assignee: 'Aria',
      run: {
        phase: 'analyzing',
        instructions,
        tasks: taskPlan(issues.find((i) => i.id === id)!.title),
        step: 0,
        startedAt: Date.now(),
      },
    });
  };
  const updateRun = (id: number, changes: Partial<Run>) => {
    const i = issues.find((i) => i.id === id)!;
    updateIssue(id, { run: { ...i.run!, ...changes } });
  };
  const approve = (id: number) => {
    const i = issues.find((i) => i.id === id)!;
    updateIssue(id, {
      status: 'In progress',
      assignee: 'Aria',
      run: { ...i.run!, phase: 'executing', step: 0, startedAt: Date.now() },
    });
    notify(`Plan approved for RTD-${id}. Aria is getting started.`);
  };
  const nav = (name: string) => {
    setSection(name);
    setMobileNav(false);
    if (name === 'Integrations') setModal('repository');
  };
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to workspace
      </a>
      <header className="topbar">
        <a
          className="brand"
          href="#"
          aria-label="CC Studio home"
          onClick={(e) => {
            e.preventDefault();
            setSection('Issues');
          }}
        >
          <svg viewBox="0 0 68 36" aria-hidden="true">
            <path
              d="M34 18C25 7 20 3 13 3A15 15 0 0 0 13 33C20 33 25 29 34 18S48 3 55 3A15 15 0 0 1 55 33C48 33 43 29 34 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
            />
          </svg>
          <span>Studio</span>
        </a>
        <span className="top-divider" />
        <div className="project-picker">
          <button onClick={() => setProjectMenu(!projectMenu)} aria-expanded={projectMenu}>
            <span className="project-icon">
              <LayoutDashboard size={15} />
            </span>
            {project.name}
            <ChevronsUpDown size={14} />
          </button>
          {projectMenu && (
            <div className="dropdown project-dropdown">
              <span className="menu-label">YOUR PROJECTS</span>
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setProjectId(p.id);
                    setProjectMenu(false);
                    setSelectedId(null);
                    setFixId(null);
                    setQuery('');
                    setTab('all');
                  }}
                >
                  <LayoutDashboard size={16} />
                  {p.name}
                  {p.id === projectId && <Check size={15} />}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="preview-badge">Interactive preview</span>
        <div className="topbar-actions">
          <div className="mode-switch">
            <button className={!devMode ? 'selected' : ''} onClick={() => setDevMode(false)}>
              Pro Mode
            </button>
            <button className={devMode ? 'selected' : ''} onClick={() => setDevMode(true)}>
              Dev Mode
            </button>
          </div>
          <button className="button compact sync-code" onClick={() => setModal('repository')}>
            <Cloud size={15} />
            Sync code
          </button>
          <button
            className="icon-button notifications"
            aria-label="Notifications"
            onClick={() => setModal('activity')}
          >
            <Bell size={18} />
            <i />
          </button>
          <button
            className="profile"
            aria-label="Profile and workspace settings"
            onClick={() => setModal('settings')}
          >
            <Avatar name="AS" />
            <ChevronDown size={13} />
          </button>
          <button
            className="icon-button mobile-menu"
            aria-label="Toggle navigation"
            onClick={() => setMobileNav(!mobileNav)}
          >
            <List size={20} />
          </button>
        </div>
      </header>
      <aside className={cx('sidebar', mobileNav && 'mobile-open')}>
        <div className="workspace-label">
          <span className="workspace-monogram">c</span>
          <div>
            <strong>CodeConductor</strong>
            <span>Team workspace</span>
          </div>
          <ChevronDown size={14} />
        </div>
        <nav aria-label="Project navigation">
          <span className="nav-group-title">BUILD</span>
          {[
            { name: 'Features', icon: Blocks },
            { name: 'Data Model', icon: Database },
            { name: 'User Flow', icon: Network },
            { name: 'Preview', icon: Eye },
          ].map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={cx('nav-item', section === name && 'active')}
              onClick={() => nav(name)}
            >
              <Icon size={18} />
              {name}
            </button>
          ))}
          <span className="nav-group-title manage-label">MANAGE</span>
          <button
            className={cx('nav-item', section === 'Issues' && 'active')}
            onClick={() => nav('Issues')}
          >
            <LayoutGrid size={18} />
            Issues
            <span className="nav-count">{issues.filter((i) => i.status !== 'Done').length}</span>
          </button>
          <button
            className={cx('nav-item', section === 'Aria activity' && 'active')}
            onClick={() => nav('Aria activity')}
          >
            <Sparkles size={18} />
            Aria activity{running.length > 0 && <span className="nav-status-dot" />}
          </button>
          <button className="nav-item" onClick={() => setModal('repository')}>
            <Blocks size={18} />
            Integrations
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="repository-mini">
            <div>
              <RepoIcon provider={project.provider} />
              <strong>{project.provider} repository</strong>
              {project.connected && <span className="connected-dot" />}
            </div>
            <p>
              {project.connected ? project.repository.split('/').pop() : 'No repository connected'}
            </p>
            <button onClick={() => setModal('repository')}>
              {project.connected ? (
                <>
                  <GitBranch size={12} />
                  {project.branch}
                  <span>
                    Manage
                    <ChevronRight size={12} />
                  </span>
                </>
              ) : (
                <>
                  Connect repository
                  <Plus size={13} />
                </>
              )}
            </button>
          </div>
          <button className="nav-item" onClick={() => setModal('help')}>
            <CircleHelp size={18} />
            Help & getting started
          </button>
          <button className="nav-item" onClick={() => setModal('settings')}>
            <Settings2 size={18} />
            Workspace settings
          </button>
          <div className="workspace-footer">
            <span className="tiny-logo">∞</span>Made for what’s next.
            <PanelLeftClose size={15} />
          </div>
        </div>
      </aside>
      <main className="main" ref={main} id="main-content" tabIndex={-1}>
        <div className="breadcrumb-bar">
          <div>
            <Folder size={15} />
            <span>{project.name}</span>
            <ChevronRight size={13} />
            <strong>{section}</strong>
          </div>
          <div className="collaborators">
            <Avatar name="RK" small />
            <Avatar name="AS" small />
            <span className="plus-avatar">+2</span>
            <span className="team-text">Your team, in sync</span>
          </div>
        </div>
        {devMode && (
          <div className="dev-banner">
            <Code2 size={15} />
            <code>
              {project.repository || 'repository not connected'} / {project.branch}
            </code>
            <span>Local prototype · integration adapters pending</span>
          </div>
        )}
        {storageError && (
          <div className="storage-warning">
            Browser storage is unavailable. Changes will last for this session only.
          </div>
        )}
        {section === 'Issues' || section === 'Aria activity' ? (
          <div className="workspace-content">
            <div className="page-heading enter">
              <div>
                <div className="eyebrow">A CLEAR PATH FROM IDEA TO DONE</div>
                <h1>
                  {section === 'Issues' ? 'Project issues' : 'Aria activity'}
                  <span className="heading-dot" />
                </h1>
                <p>
                  {section === 'Issues'
                    ? 'Plan your work. Track what matters. Ship with Aria.'
                    : 'A little help, a lot of progress. See what Aria is working on.'}
                </p>
              </div>
              <div className="heading-actions">
                <button
                  className="button plan-button"
                  onClick={() => {
                    setCreatingPlan(true);
                    setModal('create');
                  }}
                >
                  <Sparkles size={15} />
                  Plan with Aria
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    setCreatingPlan(false);
                    setModal('create');
                  }}
                >
                  <Plus size={17} />
                  New issue
                </button>
              </div>
            </div>
            <section className="aria-banner enter">
              <div className="banner-avatar">
                <AriaAvatar large />
              </div>
              <div className="banner-copy">
                <h2>Your ideas. Aria’s helping hand.</h2>
                <p>Turn a requirement into a clear plan, then let Aria take care of the code.</p>
                <button
                  onClick={() => {
                    setCreatingPlan(true);
                    setModal('create');
                  }}
                >
                  Let’s build something
                  <Sparkles size={13} />
                </button>
              </div>
              <div className="banner-flow">
                <div>
                  <span>
                    <List size={19} />
                  </span>
                  <small>Plan it</small>
                </div>
                <i />
                <div>
                  <span className="flow-aria">
                    <Sparkles size={19} />
                  </span>
                  <small>Build it</small>
                </div>
                <i />
                <div>
                  <span>
                    <CheckCheck size={19} />
                  </span>
                  <small>Ship it</small>
                </div>
              </div>
              <span className="banner-spark s1">✧</span>
              <span className="banner-spark s2">✧</span>
            </section>
            {section === 'Aria activity' ? (
              <div className="activity-page enter">
                <div className="section-title">
                  <h2>Agent work</h2>
                  <span>{issues.filter((i) => i.run).length} tasks</span>
                </div>
                {issues.filter((i) => i.run).length ? (
                  issues
                    .filter((i) => i.run)
                    .map((i) => (
                      <button className="activity-row" key={i.id} onClick={() => setFixId(i.id)}>
                        <AriaAvatar />
                        <div>
                          <small>RTD-{i.id}</small>
                          <strong>{i.title}</strong>
                        </div>
                        <span className={cx('phase-badge', i.run!.phase)}>
                          {phaseLabels[i.run!.phase]}
                        </span>
                        <ChevronRight size={17} />
                      </button>
                    ))
                ) : (
                  <div className="empty-state">
                    <Sparkles size={28} />
                    <h3>Aria is ready when you are</h3>
                    <p>Choose an issue and select Fix with Aria.</p>
                    <button className="button primary" onClick={() => setSection('Issues')}>
                      Browse issues
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="issue-tabs enter">
                  <div role="tablist" aria-label="Issue ownership">
                    {[
                      { key: 'all', name: 'All issues', count: counts.all },
                      { key: 'mine', name: 'Assigned to me', count: counts.mine },
                      { key: 'aria', name: 'Aria tasks', count: counts.aria },
                    ].map((t) => (
                      <button
                        role="tab"
                        aria-selected={tab === t.key}
                        className={tab === t.key ? 'active' : ''}
                        onClick={() => setTab(t.key)}
                        key={t.key}
                      >
                        {t.key === 'aria' && <Sparkles size={14} />} {t.name}
                        <span>{t.count}</span>
                      </button>
                    ))}
                  </div>
                  <button className="sync-status" onClick={sync}>
                    <RefreshCw size={12} className={syncing ? 'spin' : ''} />
                    {syncing
                      ? 'Syncing demo…'
                      : project.connected
                        ? `Synced ${syncedAt}`
                        : 'Connect repository'}
                  </button>
                </div>
                <div className="workspace-grid enter">
                  <section className="issues-area" aria-label="Issues">
                    <div className="board-toolbar">
                      <div className="search-input">
                        <Search size={16} />
                        <input
                          ref={searchRef}
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search issues…"
                          aria-label="Search issues"
                        />
                        {query ? (
                          <button
                            className="icon-button tiny"
                            aria-label="Clear search"
                            onClick={() => setQuery('')}
                          >
                            <X size={13} />
                          </button>
                        ) : (
                          <kbd>/</kbd>
                        )}
                      </div>
                      <div className="filter-wrapper">
                        <button
                          className={cx(
                            'button filter-button',
                            (filtersOpen || priorityFilter !== 'All priorities') && 'is-active',
                          )}
                          onClick={() => setFiltersOpen(!filtersOpen)}
                        >
                          <Filter size={14} />
                          <span>Filter</span>
                          {priorityFilter !== 'All priorities' && <i />}
                        </button>
                        {filtersOpen && (
                          <div className="dropdown filter-popover">
                            <label>
                              Status
                              <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                              >
                                {['Active', 'All statuses', ...statuses].map((s) => (
                                  <option key={s}>{s}</option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Priority
                              <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                              >
                                {['All priorities', 'High', 'Medium', 'Low'].map((s) => (
                                  <option key={s}>{s}</option>
                                ))}
                              </select>
                            </label>
                            <button
                              onClick={() => {
                                setStatusFilter('Active');
                                setPriorityFilter('All priorities');
                                setFiltersOpen(false);
                              }}
                            >
                              Reset filters
                            </button>
                          </div>
                        )}
                      </div>
                      <select
                        className="sort-select"
                        aria-label="Sort issues"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                      >
                        <option>Newest</option>
                        <option>Oldest</option>
                        <option>Priority</option>
                      </select>
                      <div className="view-toggle">
                        <button
                          className={view === 'board' ? 'active' : ''}
                          aria-label="Board view"
                          aria-pressed={view === 'board'}
                          onClick={() => setView('board')}
                        >
                          <LayoutGrid size={15} />
                        </button>
                        <button
                          className={view === 'list' ? 'active' : ''}
                          aria-label="List view"
                          aria-pressed={view === 'list'}
                          onClick={() => setView('list')}
                        >
                          <List size={17} />
                        </button>
                      </div>
                    </div>
                    {priorityFilter !== 'All priorities' || statusFilter !== 'Active' ? (
                      <div className="active-filters">
                        <button
                          onClick={() => {
                            setStatusFilter('Active');
                            setPriorityFilter('All priorities');
                          }}
                        >
                          <Filter size={12} />
                          {statusFilter} · {priorityFilter}
                          <X size={12} />
                        </button>
                      </div>
                    ) : null}
                    {view === 'board' ? (
                      <div
                        className="board"
                        style={{
                          gridTemplateColumns: `repeat(${visibleStatuses.length}, minmax(0, 1fr))`,
                        }}
                      >
                        {visibleStatuses.map((status) => (
                          <div
                            className={cx(
                              'board-column',
                              status.toLowerCase().replaceAll(' ', '-'),
                            )}
                            key={status}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const id = Number(e.dataTransfer.getData('text/plain'));
                              if (issues.some((i) => i.id === id)) moveIssue(id, status);
                            }}
                          >
                            <div className="column-header">
                              <div>
                                <StatusIcon status={status} />
                                <h3>{status}</h3>
                                <span>{filtered.filter((i) => i.status === status).length}</span>
                              </div>
                              <button
                                className="icon-button tiny"
                                aria-label={`Create issue in ${status}`}
                                onClick={() => {
                                  setCreatingPlan(false);
                                  setCreateStatus(status);
                                  setModal('create');
                                }}
                              >
                                <Plus size={15} />
                              </button>
                            </div>
                            <div className="column-cards">
                              {filtered
                                .filter((i) => i.status === status)
                                .map((i) => (
                                  <IssueCard
                                    key={i.id}
                                    issue={i}
                                    onOpen={() => setSelectedId(i.id)}
                                    onFix={() => setFixId(i.id)}
                                    onMove={(s) => moveIssue(i.id, s)}
                                  />
                                ))}
                              {!filtered.some((i) => i.status === status) && (
                                <div className="column-empty">
                                  <CircleDashed size={23} />
                                  <span>
                                    {query ? 'No matching issues' : 'A little room for progress'}
                                  </span>
                                </div>
                              )}
                              <button
                                className="add-issue"
                                onClick={() => {
                                  setCreatingPlan(false);
                                  setCreateStatus(status);
                                  setModal('create');
                                }}
                              >
                                <Plus size={14} />
                                Add issue
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="issue-list">
                        <div className="list-header">
                          <span>Issue</span>
                          <span>Status</span>
                          <span>Priority</span>
                          <span>Assignee</span>
                        </div>
                        {filtered.map((i) => (
                          <button
                            className="issue-list-row"
                            key={i.id}
                            onClick={() => setSelectedId(i.id)}
                          >
                            <div>
                              <span className="issue-id">RTD-{i.id}</span>
                              <strong>{i.title}</strong>
                            </div>
                            <span className="list-status">
                              <StatusIcon status={i.status} />
                              {i.status}
                            </span>
                            <span>
                              <PriorityIcon priority={i.priority} />
                              {i.priority}
                            </span>
                            <Avatar name={i.assignee} small />
                          </button>
                        ))}
                        {!filtered.length && (
                          <div className="empty-state">
                            <Search size={24} />
                            <h3>No issues found</h3>
                            <p>Try a different search or clear your filters.</p>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="board-foot">
                      <span>
                        {filtered.length} of {issues.length} issues
                      </span>
                      <button
                        onClick={() => setStatusFilter(statusFilter === 'Done' ? 'Active' : 'Done')}
                      >
                        <CheckCircle2 size={13} />
                        {statusFilter === 'Done'
                          ? 'Back to active issues'
                          : `${done} completed issues`}
                      </button>
                      <span className="drag-tip">Drag issues to update status</span>
                    </div>
                  </section>
                  <aside className="aria-rail">
                    <div className="rail-heading">
                      <div>
                        <span className="aria-symbol">
                          <Sparkles size={16} />
                        </span>
                        <h2>Aria at work</h2>
                      </div>
                      <span className="live-badge">
                        <i />
                        Live
                      </span>
                    </div>
                    <p className="rail-description">A teammate that moves work forward.</p>
                    <div className="agent-summary">
                      <div>
                        <strong>{running.length}</strong>
                        <span>Active tasks</span>
                      </div>
                      <div>
                        <strong>{issues.filter((i) => i.run?.phase === 'completed').length}</strong>
                        <span>Ready for review</span>
                      </div>
                    </div>
                    {running.slice(0, 2).map((i) => (
                      <button
                        className={cx(
                          'agent-task',
                          i.run!.phase === 'clarification' && 'needs-input',
                        )}
                        key={i.id}
                        onClick={() => setFixId(i.id)}
                      >
                        <div className="agent-task-top">
                          <span className={cx('agent-status', i.run!.phase)}>
                            {i.run!.phase === 'clarification' ? (
                              <CircleHelp size={12} />
                            ) : (
                              <Sparkles size={12} />
                            )}{' '}
                            {phaseLabels[i.run!.phase]}
                          </span>
                          <small>RTD-{i.id}</small>
                        </div>
                        <strong>{i.title}</strong>
                        <p>
                          {i.run!.phase === 'clarification'
                            ? 'One quick question before I continue.'
                            : i.run!.phase === 'plan'
                              ? 'A clear plan, ready for your approval.'
                              : 'Taking care of the details.'}
                        </p>
                        <span className="agent-task-action">
                          {i.run!.phase === 'clarification'
                            ? 'Answer question'
                            : i.run!.phase === 'plan'
                              ? 'Review plan'
                              : 'View progress'}
                          <ChevronRight size={14} />
                        </span>
                      </button>
                    ))}
                    {!running.length && (
                      <div className="rail-empty">
                        <AriaAvatar />
                        <p>
                          All caught up.
                          <br />
                          What should we build next?
                        </p>
                      </div>
                    )}
                    <button className="all-activity" onClick={() => setSection('Aria activity')}>
                      View all agent activity
                      <ChevronRight size={14} />
                    </button>
                    <div className="project-activity">
                      <div className="section-title">
                        <h3>Latest activity</h3>
                        <Activity size={15} />
                      </div>
                      <>
                        {recentCompleted && (
                          <div className="timeline-item">
                            <span className="timeline-avatar">
                              <Check size={12} />
                            </span>
                            <div>
                              <p>
                                <strong>Aria</strong> prepared a fix for{' '}
                                <button onClick={() => setFixId(recentCompleted.id)}>
                                  RTD-{recentCompleted.id}
                                </button>
                              </p>
                              <small>Demo task · Ready for your review</small>
                            </div>
                          </div>
                        )}
                      </>
                      <>
                        {recentInProgress && (
                          <div className="timeline-item">
                            <Avatar name={recentInProgress.assignee} small />
                            <div>
                              <p>
                                <strong>
                                  {recentInProgress.assignee === 'RK' ? 'Riya' : 'Your team'}
                                </strong>{' '}
                                is working on{' '}
                                <button onClick={() => setSelectedId(recentInProgress.id)}>
                                  RTD-{recentInProgress.id}
                                </button>
                              </p>
                              <small>In progress · {recentInProgress.date}</small>
                            </div>
                          </div>
                        )}
                      </>
                      <div className="timeline-item">
                        <span className="timeline-avatar github">
                          <Github size={14} />
                        </span>
                        <div>
                          <p>
                            {project.connected ? (
                              <>
                                Issues synced from <strong>{project.provider}</strong>
                              </>
                            ) : (
                              <>Connect a repository to get started</>
                            )}
                          </p>
                          <small>
                            {project.connected
                              ? `Demo repository · ${syncedAt}`
                              : 'Your issues are saved in Studio'}
                          </small>
                        </div>
                      </div>
                    </div>
                    <div className="aria-tip">
                      <ShieldCheck size={18} />
                      <p>
                        You’re always in control.
                        <br />
                        <span>Aria starts coding only after you approve the plan.</span>
                      </p>
                    </div>
                  </aside>
                </div>
              </>
            )}
          </div>
        ) : (
          <ProjectSection
            section={section}
            project={project}
            onCreate={() => {
              setCreatingPlan(true);
              setModal('create');
            }}
          />
        )}
        <footer className="page-footer">
          <span>© 2026 CodeConductor AI</span>
          <span>
            <span className="connected-dot" />
            All changes saved {storageError ? 'for this session' : 'on this device'}
          </span>
          <button onClick={() => setModal('help')}>
            <BookOpen size={12} />
            Quick guide
          </button>
        </footer>
      </main>
      {modal === 'create' && (
        <CreateIssueModal
          plan={creatingPlan}
          project={project}
          onClose={() => setModal(null)}
          onCreate={createIssue}
        />
      )}
      {modal === 'repository' && (
        <RepositoryModal
          project={project}
          onClose={() => setModal(null)}
          onSave={(data) => {
            updateProject((p) => ({ ...p, ...data }));
            setModal(null);
            notify(
              data.connected
                ? 'Demo repository connected. Issue sync is simulated locally.'
                : 'Repository disconnected. Studio issues are preserved.',
            );
          }}
        />
      )}
      {selected && (
        <IssueDetail
          key={`${project.id}-${selected.id}`}
          issueKey={`${project.id}-${selected.id}`}
          issue={selected}
          onClose={() => setSelectedId(null)}
          onUpdate={(changes) => {
            updateIssue(selected.id, changes);
            notify(`RTD-${selected.id} updated`);
          }}
          onFix={() => {
            setFixId(selected.id);
            setSelectedId(null);
          }}
        />
      )}
      {fixIssue && (
        <AriaModal
          issue={fixIssue}
          onClose={() => setFixId(null)}
          onStart={(s) => startRun(fixIssue.id, s)}
          onRunUpdate={(c) => updateRun(fixIssue.id, c)}
          onApprove={() => approve(fixIssue.id)}
          onDone={() => {
            moveIssue(fixIssue.id, 'Done');
            setFixId(null);
          }}
        />
      )}
      {modal === 'help' && (
        <Modal
          title="A simpler way to ship"
          subtitle="Your quick guide to issues and Aria"
          onClose={() => setModal(null)}
        >
          <div className="modal-body guide">
            <div>
              <RepoIcon provider="GitHub" />
              <section>
                <h3>Connect your project</h3>
                <p>
                  Choose GitHub or GitLab in Integrations. This preview uses a demo repository; no
                  external changes are made.
                </p>
              </section>
            </div>
            <div>
              <Plus />
              <section>
                <h3>Start with an issue or an idea</h3>
                <p>
                  Create a focused issue with a title, description, priority, and assignee. Switch
                  between board and list views or drag cards to update status.
                </p>
              </section>
            </div>
            <div>
              <Sparkles />
              <section>
                <h3>Give Aria a little direction</h3>
                <p>
                  Choose Fix with Aria, add optional context, and review the proposed tasks. You can
                  change task assignments before approving.
                </p>
              </section>
            </div>
            <div>
              <ShieldCheck />
              <section>
                <h3>Stay in control</h3>
                <p>
                  Answer clarifications, monitor progress, and review the result. Agent work and
                  repository sync are simulated in this local prototype.
                </p>
              </section>
            </div>
          </div>
          <div className="modal-footer">
            <span className="muted">Tip: press / to search issues</span>
            <button className="button primary" onClick={() => setModal(null)}>
              Got it
            </button>
          </div>
        </Modal>
      )}
      {modal === 'settings' && (
        <Modal
          title="Workspace settings"
          subtitle="Your CC Studio preview"
          onClose={() => setModal(null)}
        >
          <div className="modal-body">
            <div className="settings-profile">
              <Avatar name="AS" />
              <div>
                <strong>Aman Singh</strong>
                <p>Workspace administrator · CodeConductor</p>
              </div>
            </div>
            <div className="settings-line">
              <div>
                <strong>Local persistence</strong>
                <p>Issues, plans, and repository preferences stay on this device.</p>
              </div>
              <CheckCircle2 size={20} />
            </div>
            <div className="settings-line">
              <div>
                <strong>Reduced motion</strong>
                <p>Animations automatically follow your device preference.</p>
              </div>
              <CheckCircle2 size={20} />
            </div>
            <div className="info-note">
              <ShieldCheck size={17} />
              <p>
                This is an interactive frontend prototype. No repository credentials are collected
                and no code is modified.
              </p>
            </div>
          </div>
          <div className="modal-footer">
            <span>Version 1.0 · Development preview</span>
            <button className="button primary" onClick={() => setModal(null)}>
              Done
            </button>
          </div>
        </Modal>
      )}
      {modal === 'activity' && (
        <Modal
          title="Workspace activity"
          subtitle="The latest updates from this session"
          onClose={() => setModal(null)}
        >
          <div className="modal-body">
            {activity.length ? (
              activity.map((a, i) => (
                <div className="notification-item" key={i}>
                  <CheckCircle2 size={17} />
                  <p>{a}</p>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Bell size={26} />
                <h3>You’re all caught up</h3>
                <p>Your issue and agent updates will appear here.</p>
              </div>
            )}
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={14} />
          </span>
          {toast}
          <button
            className="icon-button tiny"
            aria-label="Dismiss notification"
            onClick={() => setToast('')}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function CreateIssueModal({
  plan,
  project,
  onClose,
  onCreate,
}: {
  plan: boolean;
  project: Project;
  onClose: () => void;
  onCreate: (
    data: {
      title: string;
      description: string;
      priority: Priority;
      label: string;
      assignee: string;
    },
    plan: boolean,
  ) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [label, setLabel] = useState('Feature');
  const [assignee, setAssignee] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (title.trim())
      onCreate(
        { title: title.trim(), description: description.trim(), priority, label, assignee },
        plan,
      );
  };
  return (
    <Modal
      title={plan ? 'What would you like to build?' : 'Create an issue'}
      subtitle={
        plan
          ? 'Start with an idea. Aria will help you turn it into a plan.'
          : `${project.name} · Keep it focused. You can add details later.`
      }
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="modal-body form-stack">
          {plan && (
            <div className="plan-intro">
              <AriaAvatar />
              <p>
                Tell me what you have in mind.
                <br />
                <strong>You’ll review the plan before any work begins.</strong>
              </p>
            </div>
          )}
          <label>
            {plan ? 'Your requirement' : 'Issue title'}
            <input
              autoFocus
              required
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                plan ? 'e.g. Let users export their analytics to CSV' : 'What needs to be done?'
              }
            />
          </label>
          <label>
            {plan ? 'A little more context' : 'Description'}
            <span className="optional">Optional</span>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the expected outcome, what’s happening now, or anything worth knowing…"
            />
          </label>
          <div className="form-grid">
            <label>
              Priority
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>
            <label>
              Label
              <select value={label} onChange={(e) => setLabel(e.target.value)}>
                {['Feature', 'Bug', 'Enhancement', 'Improvement', 'Design'].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
            <label>
              Assignee
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                <option value="">Unassigned</option>
                <option value="AS">Aman Singh</option>
                <option value="RK">Riya Kapoor</option>
                <option value="Aria">Aria</option>
              </select>
            </label>
          </div>
          <div className="form-note">
            <RepoIcon provider={project.provider} size={14} />
            {project.connected
              ? 'Saved in Studio and added to the demo sync queue.'
              : 'Saved in Studio. Connect a repository whenever you’re ready.'}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={!title.trim()} type="submit">
            {plan ? <Sparkles size={15} /> : <Plus size={15} />}{' '}
            {plan ? 'Create & plan with Aria' : 'Create issue'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function RepositoryModal({
  project,
  onClose,
  onSave,
}: {
  project: Project;
  onClose: () => void;
  onSave: (data: Partial<Project>) => void;
}) {
  const [provider, setProvider] = useState<'GitHub' | 'GitLab'>(project.provider);
  const [repo, setRepo] = useState(project.repository);
  const [branch, setBranch] = useState(project.branch);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const connect = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[\w.-]+\/[\w./-]+$/.test(repo.trim())) {
      setError('Use an owner/repository name, for example acme/dashboard.');
      return;
    }
    setConnecting(true);
    timer.current = setTimeout(
      () =>
        onSave({
          provider,
          repository: repo.trim(),
          branch: branch.trim() || 'main',
          connected: true,
        }),
      900,
    );
  };
  return (
    <Modal
      title="Connect your repository"
      subtitle="One project. One shared source of truth."
      onClose={onClose}
    >
      <form onSubmit={connect}>
        <div className="modal-body form-stack">
          <div className="provider-options">
            {(['GitHub', 'GitLab'] as const).map((p) => (
              <button
                type="button"
                className={cx('provider-option', provider === p && 'selected')}
                key={p}
                onClick={() => setProvider(p)}
              >
                <RepoIcon provider={p} size={25} />
                <strong>{p}</strong>
                <span>{provider === p ? <CheckCircle2 size={18} /> : <Circle size={18} />}</span>
              </button>
            ))}
          </div>
          <label>
            Repository
            <input
              required
              value={repo}
              onChange={(e) => {
                setRepo(e.target.value);
                setError('');
              }}
              placeholder="organization/repository"
            />
            {error && <span className="error-text">{error}</span>}
          </label>
          <label>
            Default branch
            <input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="main" />
          </label>
          <div className="sync-explainer">
            <span>
              <LayoutGrid size={23} />
              <strong>CC Studio</strong>
            </span>
            <RefreshCw size={20} />
            <span>
              <RepoIcon provider={provider} size={23} />
              <strong>{provider}</strong>
            </span>
          </div>
          <div className="check-list">
            <p>
              <Check size={15} />
              Create an issue in either place
            </p>
            <p>
              <Check size={15} />
              Keep titles, descriptions, and status in sync
            </p>
            <p>
              <Check size={15} />
              Resolve sync conflicts before overwriting changes
            </p>
          </div>
          <div className="info-note">
            <CircleHelp size={17} />
            <p>
              <strong>Demo connection</strong>
              <br />
              This prototype saves your connection locally. Live two-way sync requires provider
              authentication, a backend, and webhooks. No credentials are requested here.
            </p>
          </div>
        </div>
        <div className="modal-footer">
          {project.connected ? (
            <button
              type="button"
              className="text-button danger"
              onClick={() => onSave({ connected: false })}
            >
              Disconnect repository
            </button>
          ) : (
            <button type="button" className="button" onClick={onClose}>
              Cancel
            </button>
          )}
          <button className="button primary" disabled={connecting || !repo.trim()}>
            {connecting ? (
              <LoaderCircle className="spin" size={15} />
            ) : (
              <RepoIcon provider={provider} size={15} />
            )}{' '}
            {connecting
              ? 'Connecting…'
              : project.connected
                ? 'Save demo connection'
                : 'Connect demo repository'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function IssueDetail({
  issueKey,
  issue,
  onClose,
  onUpdate,
  onFix,
}: {
  issueKey: string;
  issue: Issue;
  onClose: () => void;
  onUpdate: (changes: Partial<Issue>) => void;
  onFix: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`cc-comments-${issueKey}`) || '[]');
    } catch {
      return [];
    }
  });
  const addComment = () => {
    if (!comment.trim()) return;
    const next = [...comments, comment.trim()];
    setComments(next);
    try {
      localStorage.setItem(`cc-comments-${issueKey}`, JSON.stringify(next));
    } catch {}
    setComment('');
    onUpdate({ comments: issue.comments + 1 });
  };
  return (
    <Modal
      title={`RTD-${issue.id}`}
      subtitle={`${issue.source} issue · ${issue.date}`}
      onClose={onClose}
      wide
    >
      <div className="modal-body issue-detail">
        <div className="detail-title-row">
          {editing ? (
            <input
              aria-label="Issue title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          ) : (
            <h2>{issue.title}</h2>
          )}
          <button
            className="text-button"
            disabled={editing && !title.trim()}
            onClick={() => {
              if (editing) onUpdate({ title: title.trim(), description: description.trim() });
              setEditing(!editing);
            }}
          >
            {editing ? 'Save' : 'Edit'}
          </button>
        </div>
        <div className="detail-properties">
          <label>
            Status
            <select
              value={issue.status}
              onChange={(e) => onUpdate({ status: e.target.value as Status })}
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
              onChange={(e) => onUpdate({ priority: e.target.value as Priority })}
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </label>
          <label>
            Assignee
            <select value={issue.assignee} onChange={(e) => onUpdate({ assignee: e.target.value })}>
              <option value="">Unassigned</option>
              <option value="AS">Aman Singh</option>
              <option value="RK">Riya Kapoor</option>
              <option value="Aria">Aria</option>
            </select>
          </label>
        </div>
        <section className="description-section">
          <h3>Description</h3>
          {editing ? (
            <textarea
              aria-label="Issue description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          ) : (
            <p>
              {issue.description ||
                'No description yet. Add a little context to help your team get started.'}
            </p>
          )}
        </section>
        <div className="detail-aria">
          <AriaAvatar />
          <div>
            <strong>
              {issue.run ? phaseLabels[issue.run.phase] : 'A helping hand with this issue'}
            </strong>
            <p>
              {issue.run
                ? 'Your plan and progress are one click away.'
                : 'Aria can break it down, find a fix, and prepare it for review.'}
            </p>
          </div>
          <button className="button primary" onClick={onFix}>
            <Sparkles size={14} />
            {issue.run ? 'View task' : 'Fix with Aria'}
          </button>
        </div>
        <section className="comment-section">
          <h3>
            Updates <span>{comments.length}</span>
          </h3>
          {comments.map((c, i) => (
            <div className="comment" key={i}>
              <Avatar name="AS" small />
              <div>
                <strong>
                  Aman Singh <small>Just now</small>
                </strong>
                <p>{c}</p>
              </div>
            </div>
          ))}
          <div className="comment-form">
            <Avatar name="AS" small />
            <input
              aria-label="Add an update"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave an update for your team…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') addComment();
              }}
            />
            <button className="button" disabled={!comment.trim()} onClick={addComment}>
              Post
            </button>
          </div>
        </section>
      </div>
      <div className="modal-footer">
        <span className="form-note">
          <ShieldCheck size={14} />
          Changes saved on this device
        </span>
        <button className="button" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}
function AriaModal({
  issue,
  onClose,
  onStart,
  onRunUpdate,
  onApprove,
  onDone,
}: {
  issue: Issue;
  onClose: () => void;
  onStart: (instructions: string) => void;
  onRunUpdate: (changes: Partial<Run>) => void;
  onApprove: () => void;
  onDone: () => void;
}) {
  const [instructions, setInstructions] = useState(issue.run?.instructions || '');
  const [answer, setAnswer] = useState('session');
  const [custom, setCustom] = useState('');
  const [expanded, setExpanded] = useState<number | null>(1);
  const [showSummary, setShowSummary] = useState(false);
  const phase = issue.run?.phase || 'idle';
  const tasks = issue.run?.tasks || [];
  const enabled = tasks.filter((t) => t.enabled);
  const stage =
    phase === 'idle'
      ? 0
      : ['analyzing', 'clarification'].includes(phase)
        ? 1
        : phase === 'plan'
          ? 2
          : phase === 'executing'
            ? 3
            : 4;
  const editTask = (id: number, changes: Partial<Task>) =>
    onRunUpdate({ tasks: tasks.map((t) => (t.id === id ? { ...t, ...changes } : t)) });
  return (
    <Modal
      title="A little help from Aria"
      subtitle={`RTD-${issue.id} · ${issue.title}`}
      onClose={onClose}
      wide
    >
      <div className="aria-modal-body">
        <div className="aria-steps">
          {['Context', 'Analyze', 'Approve', 'Execute', 'Review'].map((s, i) => (
            <div key={s} className={cx(i === stage && 'current', i < stage && 'complete')}>
              <span>{i < stage ? <Check size={12} /> : i + 1}</span>
              {s}
            </div>
          ))}
        </div>
        {phase === 'idle' && (
          <div className="aria-stage">
            <div className="aria-greeting">
              <AriaAvatar large />
              <h2>Let’s take this off your plate.</h2>
              <p>
                I’ll turn this issue into a focused plan.
                <br />
                You’ll have the final say before I start.
              </p>
            </div>
            <div className="context-card">
              <FileCode2 size={18} />
              <div>
                <strong>{issue.title}</strong>
                <p>
                  {issue.description ||
                    'Add optional instructions below to give Aria more context.'}
                </p>
              </div>
            </div>
            <label className="instructions-label">
              Anything else I should know?<span className="optional">Optional</span>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Reuse the existing components and keep changes small…"
              />
            </label>
            <div className="demo-inline">
              <ShieldCheck size={14} />
              Preview mode · Aria’s analysis and code changes are simulated.
            </div>
          </div>
        )}
        {phase === 'analyzing' && (
          <div className="aria-stage analyzing-stage">
            <AriaAvatar large />
            <h2>Connecting the dots…</h2>
            <p>Turning your issue and instructions into a focused plan.</p>
            <div className="analysis-list">
              <p>
                <CheckCircle2 size={16} />
                Reading the issue and your context
              </p>
              <p>
                <LoaderCircle size={16} className="spin" />
                Mapping the work into small tasks
              </p>
              <p className="muted">
                <Circle size={16} />
                Preparing your plan for review
              </p>
            </div>
            <div className="animated-progress">
              <i />
            </div>
            <small>Demo analysis · usually just a few seconds</small>
          </div>
        )}
        {phase === 'clarification' && (
          <div className="aria-stage">
            <div className="question-heading">
              <AriaAvatar />
              <div>
                <span className="eyebrow">ONE QUICK QUESTION</span>
                <h2>How long should filters be remembered?</h2>
              </div>
            </div>
            <p className="question-copy">
              There are a couple of good ways to handle this. Your preference will help me choose
              the right approach.
            </p>
            <fieldset className="answer-options">
              <legend className="sr-only">Filter persistence preference</legend>
              {[
                {
                  value: 'session',
                  title: 'While the browser is open',
                  desc: 'Remember filters during the current session.',
                  badge: 'Recommended',
                },
                {
                  value: 'persistent',
                  title: 'Across browser sessions',
                  desc: 'Keep preferences on this device, even after closing the browser.',
                },
                {
                  value: 'custom',
                  title: 'I have something else in mind',
                  desc: 'Tell Aria how you’d like it to work.',
                },
              ].map((o) => (
                <label key={o.value} className={answer === o.value ? 'selected' : ''}>
                  <input
                    type="radio"
                    name="answer"
                    value={o.value}
                    checked={answer === o.value}
                    onChange={() => setAnswer(o.value)}
                  />
                  <span>
                    <strong>
                      {o.title}
                      {o.badge && <em>{o.badge}</em>}
                    </strong>
                    <small>{o.desc}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            <label className="instructions-label">
              Additional context
              <span className="optional">{answer === 'custom' ? 'Required' : 'Optional'}</span>
              <textarea
                rows={3}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Add a preference or a detail Aria should consider…"
              />
            </label>
          </div>
        )}
        {phase === 'plan' && (
          <div className="aria-stage">
            <div className="question-heading">
              <AriaAvatar />
              <div>
                <span className="eyebrow">A CLEAR PLAN, READY FOR YOU</span>
                <h2>Small steps. A thoughtful solution.</h2>
              </div>
            </div>
            <p className="question-copy">
              Review the work below, adjust the assignments, and approve when you’re happy.
            </p>
            {issue.run?.answer && (
              <div className="answer-summary">
                <Check size={14} />
                {issue.run.answer}
              </div>
            )}
            <div className="plan-meta">
              <span>
                <List size={14} />
                {enabled.length} tasks selected
              </span>
              <span>
                <Sparkles size={14} />
                Auto-select finds the right agent
              </span>
            </div>
            <div className="plan-tasks">
              {tasks.map((t, index) => (
                <div key={t.id} className={cx('plan-task', !t.enabled && 'excluded')}>
                  <div className="plan-task-title">
                    <input
                      type="checkbox"
                      aria-label={`Include ${t.title}`}
                      checked={t.enabled}
                      onChange={(e) => editTask(t.id, { enabled: e.target.checked })}
                    />
                    <button
                      onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                      aria-expanded={expanded === t.id}
                    >
                      <span className="task-number">0{index + 1}</span>
                      <strong>{t.title}</strong>
                      <ChevronDown size={15} />
                    </button>
                  </div>
                  {expanded === t.id && (
                    <div className="task-description">
                      <p>{t.detail}</p>
                      <ul>
                        {(t.subtasks || taskPlan(issue.title)[index].subtasks || []).map(
                          (subtask) => (
                            <li key={subtask}>{subtask}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                  <div className="task-assignment">
                    <span>
                      <Code2 size={13} />
                      Coding agent
                    </span>
                    <select
                      aria-label={`Agent for task ${index + 1}`}
                      value={t.agent}
                      onChange={(e) => editTask(t.id, { agent: e.target.value })}
                    >
                      <option>Auto-select</option>
                      <option>Aria · Frontend</option>
                      <option>Aria · Backend</option>
                      <option>Aria · Quality</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <div className="approval-note">
              <ShieldCheck size={17} />
              <span>You’re in control. Aria will only execute the tasks you approve.</span>
            </div>
          </div>
        )}
        {(phase === 'executing' || phase === 'completed') && (
          <div className="aria-stage">
            <div className="aria-greeting compact-greeting">
              {phase === 'completed' ? (
                <span className="completion-icon">
                  <CheckCheck size={28} />
                </span>
              ) : (
                <AriaAvatar large />
              )}
              <h2>
                {phase === 'completed'
                  ? 'A little less on your to-do list.'
                  : 'Making things happen.'}
              </h2>
              <p>
                {phase === 'completed'
                  ? 'The demo run is complete and ready for your review.'
                  : 'Aria is working through your approved plan. You can keep browsing.'}
              </p>
            </div>
            <div className="execution-summary" role="status">
              <span>
                {issue.run!.step} of {enabled.length} tasks complete
              </span>
              <strong>{Math.round((issue.run!.step / Math.max(enabled.length, 1)) * 100)}%</strong>
            </div>
            <div className="execution-progress">
              <i style={{ width: `${(issue.run!.step / Math.max(enabled.length, 1)) * 100}%` }} />
            </div>
            <div className="execution-tasks">
              {enabled.map((t, i) => (
                <div key={t.id} className={i < issue.run!.step ? 'done' : ''}>
                  {i < issue.run!.step ? (
                    <CheckCircle2 size={20} />
                  ) : i === issue.run!.step ? (
                    <LoaderCircle className="spin" size={20} />
                  ) : (
                    <Circle size={20} />
                  )}
                  <div>
                    <strong>{t.title}</strong>
                    <small>
                      {t.agent === 'Auto-select' ? 'Aria · Auto-selected' : t.agent} ·{' '}
                      {i < issue.run!.step
                        ? 'Completed'
                        : i === issue.run!.step
                          ? 'In progress'
                          : 'Queued'}
                    </small>
                  </div>
                </div>
              ))}
            </div>
            {phase === 'completed' && (
              <div className="result-card">
                <div>
                  <GitPullRequest size={19} />
                  <strong>Ready for a human review</strong>
                </div>
                <p>
                  The approved tasks have completed in this simulation. In a connected workspace,
                  the code diff, checks, and pull request would appear here.
                </p>
                <button className="text-button" onClick={() => setShowSummary(!showSummary)}>
                  {showSummary ? 'Hide' : 'View'} task summary
                  <ChevronDown size={14} />
                </button>
                {showSummary && (
                  <ul>
                    {enabled.map((t) => (
                      <li key={t.id}>{t.title} — simulated successfully</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="demo-inline">
              <CircleHelp size={14} />
              Demo execution · no repository files or pull requests are changed.
            </div>
          </div>
        )}
      </div>
      <div className="modal-footer aria-modal-footer">
        <span>
          <ShieldCheck size={14} />
          {phase === 'completed' ? 'Review before closing the issue' : 'Your approval comes first'}
        </span>
        {phase === 'idle' ? (
          <button className="button primary" onClick={() => onStart(instructions)}>
            <Sparkles size={15} />
            Analyze & create plan
          </button>
        ) : phase === 'analyzing' ? (
          <button className="button" onClick={onClose}>
            Continue browsing
          </button>
        ) : phase === 'clarification' ? (
          <button
            className="button primary"
            disabled={answer === 'custom' && !custom.trim()}
            onClick={() =>
              onRunUpdate({
                phase: 'plan',
                answer:
                  `${answer === 'session' ? 'Remember filters for the current session.' : answer === 'persistent' ? 'Remember filters across browser sessions.' : ''} ${custom}`.trim(),
              })
            }
          >
            Confirm & review plan
          </button>
        ) : phase === 'plan' ? (
          <button className="button primary" disabled={!enabled.length} onClick={onApprove}>
            <Play size={14} />
            Approve & start {enabled.length} tasks
          </button>
        ) : phase === 'executing' ? (
          <button className="button" onClick={onClose}>
            Continue browsing
          </button>
        ) : (
          <button className="button primary" onClick={onDone}>
            <CheckCheck size={15} />
            Mark issue as done
          </button>
        )}
      </div>
    </Modal>
  );
}
function ProjectSection({
  section,
  project,
  onCreate,
}: {
  section: string;
  project: Project;
  onCreate: () => void;
}) {
  const features = [
    {
      icon: Mail,
      title: 'Email Management',
      description: 'Send, receive, and organize email. Keep every conversation in context.',
    },
    {
      icon: Users,
      title: 'User Management',
      description: 'Manage your team, permissions, and account settings.',
    },
    {
      icon: Folder,
      title: 'Files Management',
      description: 'Upload and organize files with one shared place for your project.',
    },
    {
      icon: LayoutDashboard,
      title: 'Analytics Dashboard',
      description: 'Bring your real-time metrics and reports together.',
    },
  ];
  return (
    <div className="workspace-content context-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR PROJECT, CONNECTED</div>
          <h1>{section}</h1>
          <p>
            {section === 'Features'
              ? 'The building blocks of your application.'
              : `Project context for ${project.name}.`}
          </p>
        </div>
        <button className="button primary" onClick={onCreate}>
          <Sparkles size={15} />
          Plan a change
        </button>
      </div>
      <div className="context-notice">
        <BookOpen size={17} />
        Reference workspace · This section provides project context for the Issues prototype.
      </div>
      {section === 'Features' ? (
        <div className="features-grid">
          {features.map(({ icon: Icon, title, description }) => (
            <div className="feature-card" key={title}>
              <span>
                <Icon size={23} />
              </span>
              <h2>{title}</h2>
              <p>{description}</p>
              <button className="text-button" onClick={onCreate}>
                Plan an improvement
                <Plus size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : section === 'Data Model' ? (
        <div className="features-grid">
          {[
            {
              name: 'Users',
              fields: ['id · UUID', 'name · String', 'email · String', 'role · Enum'],
            },
            {
              name: 'Projects',
              fields: ['id · UUID', 'name · String', 'repository · String', 'owner_id · Users'],
            },
            {
              name: 'Issues',
              fields: ['id · UUID', 'title · String', 'status · Enum', 'project_id · Projects'],
            },
            {
              name: 'Agent tasks',
              fields: [
                'id · UUID',
                'issue_id · Issues',
                'agent · String',
                'approved_at · Timestamp',
              ],
            },
          ].map((t) => (
            <div className="feature-card data-card" key={t.name}>
              <h2>
                <Database size={18} />
                {t.name}
              </h2>
              {t.fields.map((f) => (
                <p key={f}>{f}</p>
              ))}
            </div>
          ))}
        </div>
      ) : section === 'User Flow' ? (
        <div className="user-flow">
          {[
            'Select a project',
            'Connect repository',
            'Create or choose an issue',
            'Review Aria’s plan',
            'Approve execution',
            'Review and ship',
          ].map((s, i) => (
            <div key={s}>
              <span>{i + 1}</span>
              <strong>{s}</strong>
              {i < 5 && <ChevronDown size={20} />}
            </div>
          ))}
        </div>
      ) : (
        <div className="preview-screen">
          <LayoutDashboard size={36} />
          <h2>{project.name}</h2>
          <p>Your application preview will appear here when a project runtime is connected.</p>
          <div className="preview-metrics">
            <div>
              <strong>4</strong>
              <span>Features</span>
            </div>
            <div>
              <strong>{project.issues.length}</strong>
              <span>Project issues</span>
            </div>
            <div>
              <strong>{project.issues.filter((i) => i.status === 'Done').length}</strong>
              <span>Completed</span>
            </div>
          </div>
          <button className="button primary" onClick={onCreate}>
            <Sparkles size={15} />
            Plan the next feature
          </button>
        </div>
      )}
    </div>
  );
}
