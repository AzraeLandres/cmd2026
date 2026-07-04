import { NavLink, useLocation } from "react-router-dom";
import { Home, Goal, Star, CircleUser, type LucideIcon } from "lucide-react";

interface NavItemConfig {
  to: string;
  end: boolean;
  icon: LucideIcon;
  label: string;
}

const NAV_ITEMS: NavItemConfig[] = [
  { to: "/", end: true, icon: Home, label: "Accueil" },
  { to: "/phases", end: false, icon: Goal, label: "Phases" },
  { to: "/paris", end: false, icon: Star, label: "Paris" },
  { to: "/profil", end: false, icon: CircleUser, label: "Profil" },
];

function isItemActive(pathname: string, to: string, end: boolean): boolean {
  if (to === "/phases")
    return (
      pathname.startsWith("/phases") ||
      pathname.startsWith("/matches") ||
      pathname.startsWith("/match/")
    );
  if (end) return pathname === "/";
  return pathname.startsWith(to);
}

function NavItem({
  to,
  end,
  icon: Icon,
  label,
  active,
}: NavItemConfig & { active: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={
        "flex flex-1 flex-row justify-center items-center  gap-1.5 py-5 px-3 text-sm no-underline transition-colors " +
        (active
          ? "text-white bg-appBg font-semibold"
          : "text-primary text-textMuted")
      }
      aria-current={active ? "page" : undefined}
    >
      <Icon aria-hidden="true" size={20} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-shell -translate-x-1/2 items-center justify-center border-t border-border bg-surface"
      aria-label="Navigation principale"
    >
      {NAV_ITEMS.map((item) => (
        <NavItem
          key={item.to}
          {...item}
          active={isItemActive(pathname, item.to, item.end)}
        />
      ))}
    </nav>
  );
}
