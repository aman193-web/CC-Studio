import type { WorkType } from './data';
export interface ProposedTask {
  id: string;
  title: string;
  description: string;
  subtasks: string[];
  existingWorkId?: string;
  completed: boolean;
  enabled: boolean;
  dependencies: string[];
}
export interface ProposedGroup {
  id: string;
  issueId?: number;
  parentIssueId?: number;
  contextTitle?: string;
  contextType?: WorkType;
  title: string;
  description: string;
  type: WorkType;
  completed: boolean;
  enabled: boolean;
  tasks: ProposedTask[];
}
export interface AriaPlan {
  version: number;
  fingerprint: string;
  approach: string;
  outcome: string;
  assumptions: string[];
  verification: string[];
  groups: ProposedGroup[];
}
export interface AriaEvent {
  id: string;
  at: string;
  message: string;
  kind: 'analysis' | 'execution' | 'verification' | 'error' | 'approval';
  details?: string[];
  workItemId?: string;
  issueId?: number;
}
export interface Clarification {
  question: string;
  reason: string;
  options: string[];
  multiple?: boolean;
  answer?: string;
}
export interface ExecutionItem {
  issueId: number;
  workItemId: string;
  title: string;
  done: boolean;
}
export interface WorkspacePreference {
  collapsed: boolean;
  explicit: boolean;
  ratio: number;
}
export interface RepositoryArtifact {
  id: string;
  kind: 'branch' | 'commit' | 'merge-request' | 'pull-request';
  url: string;
  provider?: 'GitLab' | 'GitHub';
  repository?: string;
  targetBranch?: string;
  implementationBranch?: string;
  reference?: string;
  sha?: string;
  changedFileCount?: number;
  verification?: string;
  issueId?: number;
}
