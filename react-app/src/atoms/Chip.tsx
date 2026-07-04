import { ReactNode } from 'react';

interface Props {
  children:  ReactNode;
  active:    boolean;
  onClick:   () => void;
  role?:     string;
  'aria-selected'?: boolean;
}

export default function Chip({ children, active, onClick, ...rest }: Props) {
  return (
    <button
      type="button"
      className={
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors " +
        (active
          ? "border-primary bg-primary text-white"
          : "border-border bg-surface text-textMuted hover:text-text")
      }
      onClick={onClick}
      aria-pressed={active}
      {...rest}
    >
      {children}
    </button>
  );
}
