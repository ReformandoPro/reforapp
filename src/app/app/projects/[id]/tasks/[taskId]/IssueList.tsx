export type TaskIssueListItem = {
  id: string;
  reporterLabel: string;
  createdAtLabel: string;
  description: string;
};

export function IssueList({ issues }: { issues: TaskIssueListItem[] }) {
  if (issues.length === 0) {
    return <p className="mt-4 text-sm text-content-secondary">Aún no hay incidencias.</p>;
  }

  return (
    <ul className="mt-4 space-y-3">
      {issues.map((issue) => (
        <li key={issue.id} className="rounded-xl border border-subtle bg-bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-content-primary">{issue.reporterLabel}</p>
            <p className="text-xs text-content-tertiary">{issue.createdAtLabel}</p>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-content-secondary">{issue.description}</p>
        </li>
      ))}
    </ul>
  );
}

