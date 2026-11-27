import { CheckCircle2, CircleHelp, LoaderCircle, Sparkles } from 'lucide-react';
import type { Issue } from './data';
export function AriaAction({ issue, onClick }: { issue: Issue; onClick: () => void }) {
  const phase = issue.run?.phase;
  const label =
    phase === 'analyzing'
      ? 'Analyzing…'
      : phase === 'executing'
        ? 'Working…'
        : ['plan', 'clarification', 'blocked', 'cancelled'].includes(phase || '') ||
            (phase === 'completed' && issue.run?.partial)
          ? 'Review'
          : issue.status === 'Completed' || phase === 'completed'
            ? 'Complete'
            : 'Fix with Aria';
  const idle = label === 'Fix with Aria';
  return (
    <button
      className={`cc-fix-button ${idle ? 'aria-invite' : ''} ${phase === 'clarification' || phase === 'blocked' ? 'needs-input' : ''} ${issue.status === 'Completed' ? 'ready' : ''}`}
      onClick={onClick}
      title={
        phase === 'clarification'
          ? 'Aria needs your input'
          : phase === 'plan'
            ? 'Review and approve the plan'
            : phase === 'blocked'
              ? 'Review the blocker'
              : undefined
      }
    >
      {idle ? (
        <img className="cc-button-star" src="/assets/aria-avatar.png" alt="" />
      ) : phase === 'clarification' || phase === 'blocked' ? (
        <CircleHelp size={14} />
      ) : phase === 'analyzing' || phase === 'executing' ? (
        <LoaderCircle size={14} className="spin" />
      ) : issue.status === 'Completed' || phase === 'completed' ? (
        <CheckCircle2 size={14} />
      ) : (
        <Sparkles size={14} />
      )}
      <span aria-live="polite" aria-atomic="true">
        {label}
      </span>
    </button>
  );
}
