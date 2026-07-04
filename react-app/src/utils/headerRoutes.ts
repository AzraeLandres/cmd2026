import { matchPath } from "react-router-dom";
import { PHASE_LABELS } from "./phases";

interface RouteHeader {
  title: string;
  showBack: boolean;
}

interface RouteConfig {
  path: string;
  showBack: boolean;
  title: (params: Record<string, string | undefined>) => string;
}

const ROUTES: RouteConfig[] = [
  { path: "/", showBack: false, title: () => "Coupe du Monde 2026" },
  {
    path: "/phases",
    showBack: false,
    title: () => "Phases de la compétition",
  },
  {
    path: "/matches/:phase",
    showBack: true,
    title: (p) => PHASE_LABELS[p.phase ?? ""] ?? "Matchs",
  },
  { path: "/match/:id", showBack: true, title: () => "Chargement du match…" },
  { path: "/paris", showBack: false, title: () => "Paris" },
  { path: "/favoris", showBack: false, title: () => "Favoris" },
  { path: "/equipes", showBack: false, title: () => "Équipes" },
  { path: "/equipe/:name", showBack: true, title: (p) => p.name ?? "" },
  { path: "/profil", showBack: false, title: () => "Profil" },
];

const DEFAULT_HEADER: RouteHeader = {
  title: "Coupe du Monde 2026",
  showBack: false,
};

export function resolveHeader(pathname: string): RouteHeader {
  for (const route of ROUTES) {
    const match = matchPath(route.path, pathname);
    if (match) return { title: route.title(match.params), showBack: route.showBack };
  }
  return DEFAULT_HEADER;
}
