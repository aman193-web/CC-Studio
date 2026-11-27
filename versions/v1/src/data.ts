export type Status = 'To do' | 'In progress' | 'In review' | 'Done';
export type Priority = 'High' | 'Medium' | 'Low';
export type Phase = 'idle' | 'analyzing' | 'clarification' | 'plan' | 'executing' | 'completed';
export interface Task {
  id: number;
  title: string;
  detail: string;
  subtasks?: string[];
  agent: string;
  enabled: boolean;
}
export interface Run {
  phase: Phase;
  instructions: string;
  answer?: string;
  tasks: Task[];
  step: number;
  startedAt?: number;
}
export interface Issue {
  id: number;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  label: string;
  assignee: string;
  source: 'GitHub' | 'GitLab' | 'Studio';
  comments: number;
  date: string;
  run?: Run;
}
export interface Project {
  id: string;
  name: string;
  repository: string;
  provider: 'GitHub' | 'GitLab';
  connected: boolean;
  branch: string;
  issues: Issue[];
}
export const taskPlan = (title: string): Task[] => {
  const lower = title.toLowerCase();
  const domain = /email|invit/.test(lower)
    ? 'email and invitation'
    : /chart|dashboard|filter/.test(lower)
      ? 'dashboard'
      : /auth|login|password/.test(lower)
        ? 'authentication'
        : /export/.test(lower)
          ? 'export'
          : 'feature';
  const implementationSteps: Record<string, string[]> = {
    'email and invitation': [
      'Add an invitation form with email validation and role selection',
      'Connect the existing email service and show pending invitations',
      'Handle invitation expiry and resend actions',
    ],
    dashboard: [
      'Trace how dashboard state is read, updated, and restored',
      'Update the relevant state handling without changing existing controls',
      'Verify date range, team, and chart filters work together',
    ],
    authentication: [
      'Trace the sign-in and session recovery flow',
      'Update the affected authentication component and preserve route context',
      'Verify signed-in, expired, and unauthenticated states',
    ],
    export: [
      'Add an export action beside the analytics controls',
      'Serialize visible columns and respect the current filters',
      'Download a CSV with readable headers and a dated filename',
    ],
    feature: [
      'Identify the components and data contracts affected by this requirement',
      'Implement the smallest complete change using existing patterns',
      'Check the new behavior against the issue description',
    ],
  };
  return [
    {
      id: 1,
      title: `Update the ${domain} implementation`,
      detail: `Review the relevant components and implement “${title}”. Keep existing public APIs and visual styles consistent.`,
      subtasks: implementationSteps[domain],
      agent: 'Auto-select',
      enabled: true,
    },
    {
      id: 2,
      title: 'Handle edge cases and loading states',
      detail:
        'Cover empty data, failed requests, and repeated actions. Make keyboard interaction and feedback clear.',
      subtasks: [
        'Add helpful empty, loading, and error states',
        'Prevent duplicate actions while a request is running',
        'Verify keyboard navigation and smaller-screen layouts',
      ],
      agent: 'Auto-select',
      enabled: true,
    },
    {
      id: 3,
      title: 'Add coverage and prepare for review',
      detail:
        'Add focused regression coverage, check the acceptance criteria, and prepare a change summary for human review.',
      subtasks: [
        'Cover the main path and the most important failure case',
        'Run the relevant project checks',
        'Summarize the changes and any remaining limitations',
      ],
      agent: 'Auto-select',
      enabled: true,
    },
  ];
};
export const initialIssues: Issue[] = [
  {
    id: 42,
    title: 'Add CSV export to analytics',
    description:
      'Let users export their filtered dashboard data as a CSV file. Include column headers and preserve the active date range. Show a clear loading state while the export is prepared.',
    status: 'To do',
    priority: 'Medium',
    label: 'Feature',
    assignee: 'AS',
    source: 'GitHub',
    comments: 2,
    date: 'Today',
  },
  {
    id: 41,
    title: 'Fix login redirect after session timeout',
    description:
      'When a session expires, signing back in sends users to the home page instead of the page they were viewing. Preserve the original route and query parameters.',
    status: 'To do',
    priority: 'High',
    label: 'Bug',
    assignee: 'RK',
    source: 'GitHub',
    comments: 3,
    date: 'Today',
  },
  {
    id: 40,
    title: 'Add dark mode support',
    description:
      'Introduce a dark appearance option that follows system preferences by default. Keep existing contrast and component states accessible.',
    status: 'To do',
    priority: 'Low',
    label: 'Enhancement',
    assignee: '',
    source: 'Studio',
    comments: 0,
    date: 'Yesterday',
  },
  {
    id: 39,
    title: 'Improve empty states across the app',
    description:
      'Give users a helpful next step when there are no projects, reports, or search results. Reuse our existing typography and lavender palette.',
    status: 'To do',
    priority: 'Low',
    label: 'Design',
    assignee: 'AS',
    source: 'GitHub',
    comments: 1,
    date: 'Yesterday',
  },
  {
    id: 38,
    title: 'Fix dashboard filters not persisting',
    description:
      'Dashboard filters reset when users navigate away and return. Persist the selected date range, team, and chart filters across page navigation.',
    status: 'In progress',
    priority: 'High',
    label: 'Bug',
    assignee: 'Aria',
    source: 'GitHub',
    comments: 2,
    date: 'Today',
    run: {
      phase: 'clarification',
      instructions: 'Keep the implementation simple and consistent with current filters.',
      tasks: taskPlan('Fix dashboard filters not persisting'),
      step: 0,
    },
  },
  {
    id: 37,
    title: 'Add team member invitations',
    description:
      'Allow workspace admins to invite team members by email. Invitations should expire after seven days and show a clear pending state.',
    status: 'In progress',
    priority: 'Medium',
    label: 'Feature',
    assignee: 'Aria',
    source: 'GitHub',
    comments: 4,
    date: 'Today',
    run: {
      phase: 'plan',
      instructions: 'Use the existing email service.',
      tasks: taskPlan('Add team member invitations'),
      step: 0,
    },
  },
  {
    id: 36,
    title: 'Optimize chart rendering performance',
    description:
      'Reduce unnecessary chart re-renders when dashboard controls change. Keep transitions smooth with large datasets.',
    status: 'In progress',
    priority: 'Medium',
    label: 'Improvement',
    assignee: 'RK',
    source: 'GitHub',
    comments: 1,
    date: 'Yesterday',
  },
  {
    id: 35,
    title: 'Fix mobile navigation overflow',
    description:
      'The project navigation overflows the viewport on smaller screens. Ensure all links are reachable and the active section remains visible.',
    status: 'In review',
    priority: 'High',
    label: 'Bug',
    assignee: 'Aria',
    source: 'GitHub',
    comments: 2,
    date: 'Today',
    run: {
      phase: 'completed',
      instructions: '',
      tasks: taskPlan('Fix mobile navigation overflow'),
      step: 3,
    },
  },
  {
    id: 34,
    title: 'Add password visibility toggle',
    description:
      'Add a keyboard-accessible visibility toggle to password fields on sign-in and account settings.',
    status: 'In review',
    priority: 'Low',
    label: 'Enhancement',
    assignee: 'AS',
    source: 'GitHub',
    comments: 1,
    date: 'Yesterday',
  },
  {
    id: 33,
    title: 'Update dashboard loading skeletons',
    description: 'Replace loading spinners with skeletons that match the dashboard layout.',
    status: 'Done',
    priority: 'Low',
    label: 'Design',
    assignee: 'AS',
    source: 'GitHub',
    comments: 0,
    date: 'Nov 25',
  },
  {
    id: 32,
    title: 'Fix duplicate notification badges',
    description: 'Deduplicate notification events before updating the unread badge.',
    status: 'Done',
    priority: 'Medium',
    label: 'Bug',
    assignee: 'Aria',
    source: 'GitHub',
    comments: 2,
    date: 'Nov 25',
  },
  {
    id: 31,
    title: 'Improve table sorting',
    description: 'Add stable, accessible column sorting to dashboard tables.',
    status: 'Done',
    priority: 'Medium',
    label: 'Improvement',
    assignee: 'RK',
    source: 'GitHub',
    comments: 1,
    date: 'Nov 24',
  },
];
export const initialProjects: Project[] = [
  {
    id: 'realtime',
    name: 'Realtime Dashboard',
    repository: 'codeconductor/realtime-dashboard',
    provider: 'GitHub',
    connected: true,
    branch: 'main',
    issues: initialIssues,
  },
  {
    id: 'customer',
    name: 'Customer Portal',
    repository: '',
    provider: 'GitLab',
    connected: false,
    branch: 'main',
    issues: [],
  },
];
export const statuses: Status[] = ['To do', 'In progress', 'In review', 'Done'];
export const phaseLabels: Record<Phase, string> = {
  idle: 'Ready to help',
  analyzing: 'Analyzing',
  clarification: 'Needs your input',
  plan: 'Plan ready',
  executing: 'Executing',
  completed: 'Ready for review',
};
