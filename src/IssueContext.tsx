import { useRef, useState } from 'react';
import {
  Activity,
  Circle,
  CheckCircle2,
  GitBranch,
  ImagePlus,
  ListTree,
  MessageSquare,
  Paperclip,
  Send,
  Trash2,
} from 'lucide-react';
import type { Issue } from './data';
import { WorkItems } from './WorkItems';
import { useIssueMotion } from './IssueHierarchy';

export function IssueContext({
  issue,
  onChange,
}: {
  issue: Issue;
  onChange: (changes: Partial<Issue>) => void;
}) {
  const [tab, setTab] = useState('Tasks');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const upload = useRef<HTMLInputElement>(null);
  const tasks = issue.workItems || [];
  const panelRef = useIssueMotion(tab);
  const notes = issue.notes || [];
  const media = issue.media || [];
  const tabs = [
    { name: 'Activity', icon: Activity, count: null },
    { name: 'Tasks', icon: ListTree, count: tasks.length },
    { name: 'Media', icon: Paperclip, count: media.length },
    { name: 'Comments', icon: MessageSquare, count: issue.comments + notes.length },
  ];
  const addMedia = async (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) {
      setError('Choose a PNG, JPG, or WebP image under 1 MB.');
      return;
    }
    if (media.length >= 3) {
      setError('You can attach up to 3 images per issue.');
      return;
    }
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }).catch(() => '');
    if (!data) {
      setError('The image could not be read. Try again.');
      return;
    }
    onChange({ media: [...media, { id: Date.now(), name: file.name, data }] });
    setError('');
  };
  return (
    <section className="cc-issue-context" aria-label="Issue context">
      <div className="cc-context-tabs" role="tablist" aria-label="Issue context sections">
        {tabs.map(({ name, icon: Icon, count }) => (
          <button
            key={name}
            role="tab"
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                const index =
                  (tabs.findIndex((t) => t.name === name) +
                    (e.key === 'ArrowRight' ? 1 : -1) +
                    tabs.length) %
                  tabs.length;
                setTab(tabs[index].name);
                (e.currentTarget.parentElement?.children[index] as HTMLElement)?.focus();
              }
            }}
            id={`context-tab-${name.replace(' ', '-')}`}
            aria-controls="issue-context-panel"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
          >
            <Icon size={14} />
            {name}
            {count !== null && <span>{count}</span>}
          </button>
        ))}
      </div>
      <div
        ref={panelRef}
        id="issue-context-panel"
        role="tabpanel"
        aria-labelledby={`context-tab-${tab.replace(' ', '-')}`}
        className="cc-context-panel"
      >
        {tab === 'Activity' && (
          <div className="cc-activity-list">
            <div>
              <span className="cc-activity-dot">
                <Circle size={12} />
              </span>
              <p>
                <strong>
                  Issue created in {issue.source === 'Studio' ? 'CC Studio' : 'GitLab'}
                </strong>
                <small>
                  {issue.date} · Linked to GitLab #{issue.id}
                </small>
              </p>
            </div>
            {issue.run && (
              <div>
                <span className="cc-activity-dot purple">
                  <Activity size={12} />
                </span>
                <p>
                  <strong>
                    {issue.run.phase === 'completed'
                      ? issue.run.mode === 'preview'
                        ? 'Aria completed the demonstration tasks'
                        : 'Aria completed the tasks'
                      : issue.run.phase === 'executing'
                        ? 'Aria is working through the approved plan'
                        : issue.run.phase === 'plan'
                          ? 'Aria prepared a plan for review'
                          : issue.run.phase === 'clarification'
                            ? 'Aria needs your input'
                            : 'Aria is analyzing this issue'}
                  </strong>
                  <small>
                    {tasks.length} implementation tasks ·{' '}
                    {issue.run.phase === 'executing' || issue.run.phase === 'completed'
                      ? 'Plan approved'
                      : 'Waiting for your approval'}
                  </small>
                </p>
              </div>
            )}
            {(issue.runHistory || []).map((run, index) => (
              <div key={run.id || index}>
                <span className="cc-activity-dot purple">
                  <Activity size={12} />
                </span>
                <p>
                  <strong>Previous Aria run · {run.phase}</strong>
                  <small>
                    {run.step} tasks completed · {run.approvedAt ? 'Approved plan' : 'Draft plan'}
                  </small>
                </p>
              </div>
            ))}
            {notes.map((note) => (
              <div key={note.id}>
                <span className="cc-activity-dot">
                  <MessageSquare size={12} />
                </span>
                <p>
                  <strong>You added a comment</strong>
                  <small>{note.text}</small>
                </p>
              </div>
            ))}
            <div>
              <span className="cc-activity-dot">
                <CheckCircle2 size={12} />
              </span>
              <p>
                <strong>Current status: {issue.status}</strong>
                <small>Aria handles the implementation. You review the result.</small>
              </p>
            </div>
          </div>
        )}
        {tab === 'Tasks' && <WorkItems issue={issue} onChange={onChange} />}
        {tab === 'Media' && (
          <>
            <div className="cc-media-toolbar">
              <span>Screenshots and visual context</span>
              <button className="text-button" onClick={() => upload.current?.click()}>
                <ImagePlus size={14} />
                Attach image
              </button>
              <input
                ref={upload}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-label="Attach issue image"
                hidden
                onChange={(e) => {
                  void addMedia(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
            {media.length ? (
              <div className="cc-media-grid">
                {media.map((file) => (
                  <figure key={file.id}>
                    <a
                      href={file.data}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${file.name}`}
                    >
                      <img src={file.data} alt={file.name} />
                    </a>
                    <figcaption>
                      <span>{file.name}</span>
                      <button
                        aria-label={`Remove ${file.name}`}
                        onClick={() => onChange({ media: media.filter((m) => m.id !== file.id) })}
                      >
                        <Trash2 size={13} />
                      </button>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="cc-media-empty">
                Drop the guesswork—add a screenshot.<small>PNG, JPG, WebP · Up to 1 MB each</small>
              </div>
            )}
            {error && (
              <p className="cc-context-error" role="alert">
                {error}
              </p>
            )}
          </>
        )}
        {tab === 'Comments' && (
          <>
            <div className="cc-comment-list">
              {notes.map((note) => (
                <article key={note.id}>
                  <span className="cc-comment-avatar">AS</span>
                  <div>
                    <strong>
                      You{' '}
                      <small>
                        {new Date(note.id).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </small>
                    </strong>
                    <p>{note.text}</p>
                  </div>
                </article>
              ))}
            </div>
            <form
              className="cc-comment-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!comment.trim()) return;
                onChange({ notes: [...notes, { id: Date.now(), text: comment.trim() }] });
                setComment('');
              }}
            >
              <textarea
                aria-label="Add a comment"
                placeholder="Add context or leave a note…"
                rows={2}
                maxLength={2000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div>
                <span />
                <button className="button primary" disabled={!comment.trim()}>
                  <Send size={13} />
                  Comment
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </section>
  );
}

export function IssueBranch({ issue }: { issue: Issue }) {
  const [copied, setCopied] = useState(false);
  const branch = issue.run?.branch;
  const available = Boolean(branch);
  return (
    <div className="cc-branch-property">
      <span className="cc-field-label">
        <GitBranch size={13} />
        Branch
      </span>
      {available ? (
        <>
          <button
            className="cc-branch-name"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(branch || '');
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
            title="Copy branch name"
          >
            {copied ? 'Copied' : branch}
          </button>
          <small>Click to copy branch name</small>
        </>
      ) : (
        <>
          <span className="cc-branch-pending">Not created yet</span>
          <small>Aria creates a branch after plan approval.</small>
        </>
      )}
    </div>
  );
}
