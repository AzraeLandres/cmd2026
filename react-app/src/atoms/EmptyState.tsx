import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  role?:    string;
}

export default function EmptyState({ children, role = 'status' }: Props) {
  return (
    <div
      className="rounded border border-dashed border-border bg-surface p-4 text-center text-sm text-textMuted"
      role={role}
    >
      {children}
    </div>
  );
}
