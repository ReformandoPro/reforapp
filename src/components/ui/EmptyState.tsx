type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed bg-bg-surface p-6 text-center">
      <h3 className="text-base font-semibold text-content-primary">{title}</h3>
      <p className="mt-2 text-sm text-content-secondary">{description}</p>
    </div>
  );
}
