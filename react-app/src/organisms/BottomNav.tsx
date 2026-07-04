import { NavLink, useLocation } from 'react-router-dom';

interface NavItemConfig {
  to:    string;
  end:   boolean;
  icon:  string;
  label: string;
}

const NAV_ITEMS: NavItemConfig[] = [
  { to: '/',       end: true,  icon: '⌂',  label: 'Accueil' },
  { to: '/phases', end: false, icon: '⚽', label: 'Phases'  },
  { to: '/paris',  end: false, icon: '★',  label: 'Paris'   },
  { to: '/profil', end: false, icon: '◉',  label: 'Profil'  },
];

function useIsActive(to: string, end: boolean): boolean {
  const { pathname } = useLocation();
  if (to === '/phases') return pathname.startsWith('/phases') || pathname.startsWith('/matches') || pathname.startsWith('/match/');
  if (end) return pathname === '/';
  return pathname.startsWith(to);
}

function NavItem({ to, end, icon, label }: NavItemConfig) {
  const active = useIsActive(to, end);
  return (
    <NavLink
      to={to}
      end={end}
      className={'nav-item' + (active ? ' active' : '')}
      aria-current={active ? 'page' : undefined}
    >
      <span className="nav-icon" aria-hidden="true">{icon}</span>
      <span className="nav-label">{label}</span>
    </NavLink>
  );
}

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      {NAV_ITEMS.map((item) => <NavItem key={item.to} {...item} />)}
    </nav>
  );
}
