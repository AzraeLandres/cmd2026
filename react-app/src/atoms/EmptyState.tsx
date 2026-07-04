import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  role?:    string;
}

export default function EmptyState({ children, role = 'status' }: Props) {
  return (
    <div className="empty-state" role={role}>
      {children}
    </div>
  );
}
