import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Sparkles } from 'lucide-react';
import type { Issue } from './data';
import { ancestors, association, workTypeOf, secondaryStatus } from './issueModel';
import { SecondaryBadge, StatusBadge, useIssueMotion } from './IssueHierarchy';
import { AriaAction } from './AriaAction';
export function IssueList({
  issues,
  page,
  onPage,
  allIssues,
  groupBy,
  onOpen,
  onFix,
  onTicket,
  onClear,
}: {
  issues: Issue[];
  page: number;
  onPage: (page: number) => void;
  allIssues: Issue[];
  groupBy: string;
  onOpen: (id: number) => void;
  onFix: (id: number) => void;
  onTicket: (id: number) => void;
  onClear: () => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  const key = issues.map((i) => `${i.id}:${i.status}`).join(',') + groupBy;
  const ref = useIssueMotion(key + [...collapsed].join(',') + page);
  const groups = useMemo(() => {
    if (groupBy === 'None')
      return [{ key: 'flat', title: '', items: issues, issue: undefined as Issue | undefined }];
    const buckets = new Map<
      string,
      { key: string; title: string; items: Issue[]; issue?: Issue }
    >();
    for (const issue of issues) {
      const parent = association(issue, allIssues, groupBy);
      const key = parent ? String(parent.id) : 'none';
      if (!buckets.has(key))
        buckets.set(key, {
          key,
          title: parent?.title || `No ${groupBy.toLowerCase()}`,
          items: [],
          issue: parent,
        });
      buckets.get(key)!.items.push(issue);
    }
    return [...buckets.values()];
  }, [issues, allIssues, groupBy]);
  // In hierarchy views, page complete groups, never split their child trees across pages.
  const maxPage = Math.max(1, Math.ceil((groupBy === 'None' ? issues.length : groups.length) / 8));
  const currentPage = Math.min(page, maxPage);
  const shownGroups =
    groupBy === 'None'
      ? [{ ...groups[0], items: issues.slice((currentPage - 1) * 8, currentPage * 8) }]
      : groups.slice((currentPage - 1) * 8, currentPage * 8);
  const row = (
    issue: Issue,
    depth = 0,
    groupItems: Issue[] = [],
    visited = new Set<number>(),
  ): React.ReactNode => {
    if (visited.has(issue.id)) return null;
    visited.add(issue.id);
    const children = groupItems.filter((i) => i.parentIssueId === issue.id);
    const allChildren = allIssues.filter((i) => i.parentIssueId === issue.id);
    const expanded =
      groupBy === 'None' ? collapsed.has(`i-${issue.id}`) : !collapsed.has(`i-${issue.id}`);
    return (
      <Fragment key={issue.id}>
        <tr data-issue-id={issue.id}>
          <td>
            <div className="cc-list-title-row" style={{ paddingLeft: Math.min(depth, 4) * 17 }}>
              {(groupBy === 'None' ? allChildren.length : children.length) ? (
                <button
                  className="cc-tree-toggle"
                  aria-label={`${expanded ? 'Collapse' : 'Expand'} issue #${issue.id}`}
                  aria-expanded={expanded}
                  onClick={() => toggle(`i-${issue.id}`)}
                >
                  <ChevronDown size={14} className={expanded ? '' : 'closed'} />
                </button>
              ) : null}
              <div>
                <button className="cc-issue-title" onClick={() => onOpen(issue.id)}>
                  <small>#{issue.id}</small> {issue.title}
                </button>
                {allChildren.length > 0 && (
                  <div className="cc-issue-subline">
                    {allChildren.length > 0 && (
                      <span className="cc-child-count">
                        {allChildren.filter((i) => i.status === 'Completed').length}/
                        {allChildren.length} children
                      </span>
                    )}
                  </div>
                )}
                {groupBy === 'None' && issue.parentIssueId && (
                  <button className="cc-list-parent" onClick={() => onOpen(issue.parentIssueId!)}>
                    {ancestors(issue, allIssues)
                      .map((i) => i.title)
                      .join(' / ')}
                  </button>
                )}
              </div>
            </div>
          </td>
          <td>
            <StatusBadge issue={issue} />
            {secondaryStatus(issue) !== 'Awaiting verification' && <SecondaryBadge issue={issue} />}
          </td>
          <td>
            <span className={`cc-type ${workTypeOf(issue).toLowerCase()}`}>
              {workTypeOf(issue)}
            </span>
          </td>
          <td>
            <span className={`cc-priority cc-table-priority ${issue.priority.toLowerCase()}`}>
              <i aria-hidden="true" />
              {issue.priority}
            </span>
          </td>
          <td>
            <button className="cc-ticket" onClick={() => onTicket(issue.id)}>
              #{issue.id}
              <ExternalLink size={12} />
            </button>
          </td>
          <td>
            <AriaAction issue={issue} onClick={() => onFix(issue.id)} />
          </td>
        </tr>
        {expanded && children.map((child) => row(child, depth + 1, groupItems, visited))}
        {groupBy === 'None' && expanded && allChildren.length > 0 && (
          <tr className="cc-child-preview">
            <td colSpan={6}>
              <div>
                {allChildren.map((child) => (
                  <button key={child.id} onClick={() => onOpen(child.id)}>
                    <span>
                      #{child.id} · {child.title}
                    </span>
                    <StatusBadge issue={child} />
                  </button>
                ))}
              </div>
            </td>
          </tr>
        )}
      </Fragment>
    );
  };
  return (
    <>
      <div ref={ref} className="cc-table-scroll">
        <table className="cc-issue-table">
          <thead>
            <tr>
              <th>Issue</th>
              <th>Status</th>
              <th>Type</th>
              <th>Priority</th>
              <th>GitLab ticket</th>
              <th>
                <Sparkles size={13} /> Aria
              </th>
            </tr>
          </thead>
          <tbody>
            {shownGroups.map((group) => {
              const expanded = !collapsed.has(`g-${group.key}`);
              const roots = group.items.filter(
                (i) => !group.items.some((p) => p.id === i.parentIssueId),
              );
              return (
                <Fragment key={group.key}>
                  {groupBy !== 'None' && (
                    <tr className="cc-group-row">
                      <td colSpan={6}>
                        <button aria-expanded={expanded} onClick={() => toggle(`g-${group.key}`)}>
                          <ChevronDown size={15} className={expanded ? '' : 'closed'} />
                          <span className={`cc-type ${groupBy.toLowerCase()}`}>{groupBy}</span>
                          <strong>{group.title}</strong>
                          <span>
                            {group.items.length} issues ·{' '}
                            {group.items.filter((i) => i.status === 'Completed').length} completed
                          </span>
                        </button>
                        {group.issue && (
                          <button className="text-button" onClick={() => onOpen(group.issue!.id)}>
                            Open #{group.issue.id}
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                  {expanded &&
                    (groupBy === 'None'
                      ? group.items.map((i) => row(i))
                      : roots.map((i) => row(i, 0, group.items, new Set())))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {!issues.length && (
          <div className="cc-empty">
            <h3>No issues found</h3>
            <p>Try another search or clear your filters.</p>
            <button className="button" onClick={onClear}>
              Clear filters
            </button>
          </div>
        )}
      </div>
      <div className="cc-pagination">
        <span>
          {issues.length} issues{groupBy !== 'None' ? ` · ${groups.length} groups` : ''}
        </span>
        <div>
          <button
            aria-label="Previous page"
            disabled={currentPage === 1}
            onClick={() => onPage(currentPage - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            {currentPage} / {maxPage}
          </span>
          <button
            aria-label="Next page"
            disabled={currentPage === maxPage}
            onClick={() => onPage(currentPage + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
