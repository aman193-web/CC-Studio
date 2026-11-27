import { ExternalLink, ListTree, MessageSquare, Paperclip } from 'lucide-react';
import { statuses } from './data';
import type { Issue } from './data';
import { IssueLabels, SecondaryBadge } from './IssueHierarchy';
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
                    <span
                      className={`cc-priority cc-table-priority ${issue.priority.toLowerCase()}`}
                    >
                      <i />
                      {issue.priority}
                    </span>
                  </div>
                  <button className="cc-card-title" onClick={() => onOpen(issue.id)}>
                    {issue.title}
                  </button>
                  <p className="cc-card-description">{issue.description}</p>
                  {(issue.run?.phase === 'clarification' || issue.run?.phase === 'blocked') && (
                    <div className="cc-card-state">
                      <SecondaryBadge issue={issue} />
                    </div>
                  )}
                  <div className="cc-card-meta">
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
                    <button
                      className="cc-card-context"
                      onClick={() => onOpen(issue.id)}
                      aria-label={`View activity and context for issue #${issue.id}`}
                    >
                      {(allIssues.some((i) => i.parentIssueId === issue.id) ||
                        !!issue.workItems?.length) && (
                        <span title="Child issues and tasks">
                          <ListTree size={13} />
                          {allIssues.filter((i) => i.parentIssueId === issue.id).length +
                            (issue.workItems?.length || 0)}
                        </span>
                      )}
                      {!!(issue.comments + (issue.notes?.length || 0)) && (
                        <span title="Comments">
                          <MessageSquare size={13} />
                          {issue.comments + (issue.notes?.length || 0)}
                        </span>
                      )}
                      {!!issue.media?.length && (
                        <span title="Attached media">
                          <Paperclip size={13} />
                          {issue.media.length}
                        </span>
                      )}
                    </button>
                  </div>
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
