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
      className={'chip' + (active ? ' active' : '')}
      onClick={onClick}
      aria-pressed={active}
      {...rest}
    >
      {children}
    </button>
  );
}
