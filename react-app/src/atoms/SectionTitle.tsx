import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function SectionTitle({ children, className = "" }: Props) {
  return (
    <h2
      className={`mb-3 flex items-center gap-2.5 text-base font-bold tracking-tight text-text ${className}`}
    >
      <span className="h-4 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
      {children}
    </h2>
  );
}
