import { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import type { Issue, Priority } from './data';
import { AriaAvatar, Modal } from './AriaWorkflow';
import { LabelPicker, ParentFields } from './IssueHierarchy';
import { hasLabel, hierarchyKind, labelsOf, newIssueData, validateIssue } from './issueModel';
export function CreateIssue({
  issues,
  parentId,
  onClose,
  onCreate,
}: {
  issues: Issue[];
  parentId?: number;
  onClose: () => void;
  onCreate: (issue: Issue, plan: boolean) => void;
}) {
  const [draft, setDraft] = useState<Issue>(() => ({
    ...newIssueData(Math.max(0, ...issues.map((i) => i.id)) + 1, ''),
    parentIssueId: parentId ?? null,
  }));
  const [error, setError] = useState('');
  const patch = (changes: Partial<Issue>) => {
    setDraft((d) => ({ ...d, ...changes }));
    setError('');
  };
  const submit = (plan: boolean) => {
    if (!draft.title.trim()) {
      setError('Add an issue title.');
      return;
    }
    const issue = { ...draft, title: draft.title.trim(), description: draft.description.trim() };
    const invalid = validateIssue(issue, issues);
    if (invalid) {
      setError(invalid);
      return;
    }
    onCreate(issue, plan);
  };
  return (
    <Modal
      title={parentId ? 'New child issue' : 'New issue'}
      subtitle="Add work to Realtime Dashboard."
      onClose={onClose}
      drawer
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(false);
        }}
      >
        <div className="modal-body form-stack">
          <label>
            Issue title <span className="cc-required">*</span>
            <input
              autoFocus
              required
              maxLength={160}
              placeholder="What needs to be done?"
              value={draft.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </label>
          <label>
            Description <span className="optional">Optional</span>
            <textarea
              rows={4}
              placeholder="Describe the expected outcome…"
              value={draft.description}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </label>
          <LabelPicker
            value={labelsOf(draft)}
            extra={issues.flatMap(labelsOf)}
            onChange={(labels) => {
              const next = { ...draft, labels, label: labels[0] || '' };
              patch({
                labels,
                label: labels[0] || '',
                parentIssueId:
                  hierarchyKind(next) === 'Epic'
                    ? null
                    : hierarchyKind(next) === 'Story' &&
                        !issues.some((i) => i.id === draft.parentIssueId && hasLabel(i, 'Epic'))
                      ? null
                      : draft.parentIssueId,
              });
            }}
          />
          <ParentFields
            issue={draft}
            issues={issues}
            onChange={(parentIssueId) => patch({ parentIssueId })}
          />
          <div className="cc-form-pair">
            <label>
              Priority
              <select
                aria-label="Priority"
                value={draft.priority}
                onChange={(e) => patch({ priority: e.target.value as Priority })}
              >
                {['High', 'Medium', 'Low'].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label>
              Assignee
              <select
                aria-label="Assignee"
                value={draft.assignee}
                onChange={(e) => patch({ assignee: e.target.value })}
              >
                <option value="">Unassigned</option>
                {[...new Set(['Aria', ...issues.map((i) => i.assignee).filter(Boolean)])].map(
                  (a) => (
                    <option key={a}>{a}</option>
                  ),
                )}
              </select>
            </label>
          </div>
          <div className="cc-plan-intro">
            <div>
              <strong>Plan with Aria</strong>
              <p>Review the proposed work before execution starts.</p>
            </div>
            <AriaAvatar />
          </div>
          {error && (
            <p role="alert" className="cc-context-error">
              {error}
            </p>
          )}
        </div>
        <div className="modal-footer cc-create-actions">
          <button type="submit" className="button" disabled={!draft.title.trim()}>
            <Plus size={14} />
            Create Issue
          </button>
          <button
            type="button"
            className="button primary"
            disabled={!draft.title.trim()}
            onClick={() => submit(true)}
          >
            <Sparkles size={14} />
            Create & Plan with Aria
          </button>
        </div>
      </form>
    </Modal>
  );
}
