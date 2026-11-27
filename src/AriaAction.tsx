import { CheckCircle2, CircleHelp, LoaderCircle, Sparkles } from 'lucide-react';
import type { Issue } from './data';
export function AriaAction({ issue, onClick }: { issue: Issue; onClick: () => void }) {
  const phase = issue.run?.phase;
  const label =
    issue.status === 'Completed'
      ? 'View Result'
      : !phase || phase === 'idle'
        ? 'Fix with Aria'
        : phase === 'clarification'
          ? 'Provide Input'
          : phase === 'plan'
            ? 'View Plan'
            : phase === 'blocked'
              ? 'View Blocker'
              : phase === 'cancelled'
                ? 'Continue Work'
                : phase === 'completed'
                  ? 'View Result'
                  : 'View Progress';
  const idle = label === 'Fix with Aria';
  return (
    <button
      className={`cc-fix-button ${idle ? 'aria-invite' : ''} ${phase === 'clarification' || phase === 'blocked' ? 'needs-input' : ''} ${issue.status === 'Completed' ? 'ready' : ''}`}
      onClick={onClick}
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
      <span>{label}</span>
    </button>
  );
}
