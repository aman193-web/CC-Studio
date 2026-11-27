import { Check, CheckCircle2, CircleHelp, LoaderCircle, Sparkles } from 'lucide-react';
import { phaseLabels } from './data';
import type { Issue } from './data';

export function AriaAction({ issue, onClick }: { issue: Issue; onClick: () => void }) {
  if (issue.status === 'Completed')
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
