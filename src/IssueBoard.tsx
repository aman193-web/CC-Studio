import { ExternalLink, ListTree, MessageSquare, Paperclip, GitBranch } from 'lucide-react';
import { statuses } from './data';
import type { Issue } from './data';
import { IssueLabels, StatusBadge, SecondaryBadge } from './IssueHierarchy';
import { ancestors } from './issueModel';
import { AriaAction } from './AriaAction';

export function IssueBoard({
  issues,
  onOpen,
  onFix,
  onTicket,
  allIssues,
}: {
  issues: Issue[];
  onOpen: (id: number) => void;
  onFix: (id: number) => void;
  onTicket: (id: number) => void;
  allIssues: Issue[];
}) {
  return (
    <div className="cc-kanban" aria-label="Issue board">
      {statuses.map((status) => {
        const cards = issues.filter((issue) => issue.status === status);
        return (
          <section
            key={status}
            aria-label={`${status} column`}
            className={`cc-board-column ${status.toLowerCase().replaceAll(' ', '-')}`}
          >
            <header className="cc-column-heading">
              <i />
              <h2>{status}</h2>
              <span>{cards.length}</span>
            </header>
            <div className="cc-column-cards">
              {cards.map((issue) => (
                <article key={issue.id} data-issue-id={issue.id} className="cc-board-card">
                  <div className="cc-card-top">
                    <IssueLabels issue={issue} />
                    <span className={`cc-priority ${issue.priority.toLowerCase()}`}>
                      <i />
                      {issue.priority}
                    </span>
                  </div>
                  <button className="cc-card-title" onClick={() => onOpen(issue.id)}>
                    {issue.title}
                  </button>
                  <p className="cc-card-description">{issue.description}</p>
                  {issue.parentIssueId && (
                    <button className="cc-card-parent" onClick={() => onOpen(issue.parentIssueId!)}>
                      {ancestors(issue, allIssues)
                        .map((i) => i.title)
                        .join(' / ')}
                    </button>
                  )}
                  <div className="cc-card-state">
                    <StatusBadge issue={issue} />
                    <SecondaryBadge issue={issue} />
                  </div>
                  <div className="cc-card-origin">
                    <span>
                      Created in <b>{issue.source === 'Studio' ? 'CC Studio' : 'GitLab'}</b>
                    </span>
                    <a
                      className="cc-ticket"
                      href={`#gitlab-issue-${issue.id}`}
                      aria-label={`View GitLab ticket #${issue.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onTicket(issue.id);
                      }}
                    >
                      #{issue.id}
                      <ExternalLink size={11} />
                    </a>
                  </div>
                  <button
                    className="cc-card-context"
                    onClick={() => onOpen(issue.id)}
                    aria-label={`View activity and context for issue #${issue.id}`}
                  >
                    <span title="Child tasks">
                      <ListTree size={12} />
                      {
                        allIssues.filter(
                          (i) => i.parentIssueId === issue.id && i.status === 'Completed',
                        ).length
                      }
                      /{allIssues.filter((i) => i.parentIssueId === issue.id).length} children ·{' '}
                      {issue.workItems?.length || 0} tasks
                    </span>
                    <span title="Comments">
                      <MessageSquare size={12} />
                      {issue.comments + (issue.notes?.length || 0)}
                    </span>
                    <span title="Attached media">
                      <Paperclip size={12} />
                      {issue.media?.length || 0}
                    </span>
                    {(issue.run?.phase === 'executing' || issue.run?.phase === 'completed') && (
                      <GitBranch size={12} aria-label="Branch available" />
                    )}
                  </button>
                  <div className="cc-card-actions">
                    <AriaAction issue={issue} onClick={() => onFix(issue.id)} />
                  </div>
                </article>
              ))}
              {!cards.length && (
                <div className="cc-column-empty">
                  <span>Nothing here yet</span>
                  <small>
                    {status === 'AI Working'
                      ? 'Approved work appears here during execution'
                      : status === 'Completed'
                        ? 'Completed work appears here after verification'
                        : 'Create an issue to get started'}
                  </small>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
