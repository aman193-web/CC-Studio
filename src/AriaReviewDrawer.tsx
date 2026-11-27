import { Maximize2, ChevronDown } from 'lucide-react';
import type { Issue } from './data';
import { Modal } from './AriaWorkflow';
import { AriaPlanPanel } from './AriaPlanPanel';
import type { AriaControls } from './AriaPlanPanel';
import { AriaDisclosure } from './AriaDisclosure';
import { ActivityPanel } from './IssueDetailsWorkspace';
import { ancestors } from './issueModel';

export function AriaReviewDrawer({
  issue,
  issues,
  controls,
  onClose,
  onExpand,
}: {
  issue: Issue;
  issues: Issue[];
  controls: AriaControls;
  onClose: () => void;
  onExpand: () => void;
}) {
  const work = issues
    .filter(
      (item) =>
        item.id === issue.id || ancestors(item, issues).some((parent) => parent.id === issue.id),
    )
    .flatMap((item) => item.workItems || []);
  return (
    <Modal
      title={`Aria · Issue #${issue.id}`}
      subtitle={issue.title}
      drawer
      className="cc-aria-review-drawer"
      closeLabel="Close Aria sidebar"
      onClose={onClose}
      headerActions={
        <button
          className="icon-button"
          aria-label="Expand to full issue view"
          title="Expand to full issue view"
          onClick={onExpand}
        >
          <Maximize2 size={18} />
        </button>
      }
    >
      <div className="sw-ai cc-aria-review-content">
        <div className="sw-ai-scroll">
          <AriaPlanPanel
            issue={issue}
            controls={controls}
            tasksOnLeft
            executionWork={work}
            onViewTasks={onExpand}
          />
          {!!issue.run?.events?.length && (
            <AriaDisclosure className="sw-activity">
              <summary>
                <ChevronDown size={14} /> Activity <span>{issue.run.events.length} updates</span>
              </summary>
              <ActivityPanel issue={issue} compact />
            </AriaDisclosure>
          )}
        </div>
      </div>
    </Modal>
  );
}
