import { useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  GripVertical,
  LoaderCircle,
  ListTree,
  MessageSquare,
  Paperclip,
  GitBranch,
  Sparkles,
} from 'lucide-react';
import { phaseLabels, statuses } from './data';
import type { Issue, Status } from './data';

export function AriaAction({ issue, onClick }: { issue: Issue; onClick: () => void }) {
  if (issue.status === 'Done')
    return (
      <span className="cc-resolved">
        <Check size={13} />
        Resolved
      </span>
    );
  const phase = issue.run?.phase;
  const idle = !phase || phase === 'idle';
  const label = idle
    ? 'Fix with Aria'
    : phase === 'clarification'
      ? 'Needs input'
      : phase === 'plan'
        ? 'Review plan'
        : phase === 'completed'
          ? 'Review fix'
          : phaseLabels[phase];
  return (
    <button
      className={`cc-fix-button ${idle ? 'aria-invite' : ''} ${phase === 'clarification' ? 'needs-input' : ''} ${phase === 'completed' ? 'ready' : ''}`}
      onClick={onClick}
    >
      {idle ? (
        <img className="cc-button-star" src="/assets/aria-avatar.png" alt="" />
      ) : phase === 'clarification' ? (
        <CircleHelp size={14} />
      ) : phase === 'executing' || phase === 'analyzing' ? (
        <LoaderCircle size={14} className="spin" />
      ) : phase === 'completed' ? (
        <CheckCircle2 size={14} />
      ) : (
        <Sparkles size={14} />
      )}
      <span>{label}</span>
    </button>
  );
}

export function IssueBoard({
  issues,
  onOpen,
  onFix,
  onTicket,
  onMove,
}: {
  issues: Issue[];
  onOpen: (id: number) => void;
  onFix: (id: number) => void;
  onTicket: (id: number) => void;
  onMove: (id: number, status: Status) => void;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<Status | null>(null);
  return (
    <div className="cc-kanban" aria-label="Issue board">
      {statuses.map((status) => {
        const cards = issues.filter((issue) => issue.status === status);
        return (
          <section
            key={status}
            aria-label={`${status} column`}
            className={`cc-board-column ${status.toLowerCase().replaceAll(' ', '-')} ${over === status ? 'drop-target' : ''}`}
            onDragOver={(e) => {
              if (dragging !== null) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setOver(status);
              }
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragging !== null) onMove(dragging, status);
              setDragging(null);
              setOver(null);
            }}
          >
            <header className="cc-column-heading">
              <i />
              <h2>{status}</h2>
              <span>{cards.length}</span>
            </header>
            <div className="cc-column-cards">
              {cards.map((issue) => (
                <article
                  key={issue.id}
                  data-issue-id={issue.id}
                  className={`cc-board-card ${dragging === issue.id ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => {
                    if ((e.target as HTMLElement).closest('button,a,select')) {
                      e.preventDefault();
                      return;
                    }
                    setDragging(issue.id);
                    e.dataTransfer.setData('text/plain', String(issue.id));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => {
                    setDragging(null);
                    setOver(null);
                  }}
                >
                  <div className="cc-card-top">
                    <span className={`cc-type ${issue.label.toLowerCase()}`}>{issue.label}</span>
                    <span className={`cc-priority ${issue.priority.toLowerCase()}`}>
                      <i />
                      {issue.priority}
                    </span>
                    <GripVertical className="cc-drag-handle" size={14} aria-hidden="true" />
                  </div>
                  <button className="cc-card-title" onClick={() => onOpen(issue.id)}>
                    {issue.title}
                  </button>
                  <p className="cc-card-description">{issue.description}</p>
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
                      {issue.run?.tasks.filter((t) => t.enabled).length || 0}
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
                    <label className="cc-card-move">
                      <ChevronDown size={14} />
                      <select
                        aria-label={`Move issue #${issue.id}`}
                        value={issue.status}
                        onChange={(e) => onMove(issue.id, e.target.value as Status)}
                      >
                        {statuses.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </article>
              ))}
              {!cards.length && (
                <div className="cc-column-empty">
                  <span>Nothing here yet</span>
                  <small>
                    {dragging !== null
                      ? 'Drop an issue here'
                      : 'Move an issue here when it’s ready'}
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
