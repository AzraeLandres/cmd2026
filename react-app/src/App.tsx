import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import HeaderState from "@interfaces/HeaderState";
import TopBar from "@organisms/TopBar";
import BottomNav from "@organisms/BottomNav";
import ChatBot from "@organisms/ChatBot";
import ModeBanner from "@organisms/ModeBanner";
import { useAuth } from "@context/AuthContext";
import AuthPage from "@pages/AuthPage";
import Landing from "@pages/Landing";
import { HeaderContext } from "@context/HeaderContext";
import { resolveHeader } from "@utils/headerRoutes";

type AuthView = "landing" | "login" | "register";

export default function App() {
  const { user } = useAuth();
  const location = useLocation();
  const [override, setOverride] = useState<Partial<HeaderState>>({});
  const [authView, setAuthView] = useState<AuthView>("landing");

  useEffect(() => {
    setOverride({});
  }, [location.pathname]);

  function updateHeader(partial: Partial<HeaderState>) {
    setOverride((prev) => ({ ...prev, ...partial }));
  }

  if (!user) {
    if (authView === "landing") {
      return (
        <Landing
          onLogin={() => setAuthView("login")}
          onRegister={() => setAuthView("register")}
        />
      );
    }
    return (
      <AuthPage initialMode={authView} onBack={() => setAuthView("landing")} />
    );
  }

  const routeHeader = resolveHeader(location.pathname);
  const header: HeaderState = {
    title: override.title ?? routeHeader.title,
    showBack: override.showBack ?? routeHeader.showBack,
    liveMinute: override.liveMinute ?? null,
  };

  return (
    <HeaderContext.Provider value={updateHeader}>
      <a
        href="#main-content"
        className="fixed left-1/2 top-[-100%] z-[9999] -translate-x-1/2 rounded-b-md bg-primary px-5 py-2.5 text-sm font-bold text-white no-underline transition-[top] duration-150 focus:top-0"
      >
        Aller au contenu principal
      </a>
      <div className="relative flex min-h-screen bg-[#0b3d24]">
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-secondary/40 blur-3xl" />
          <div className="absolute -right-40 top-1/3 h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-primary/50 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-shell flex-col bg-surface shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_30px_70px_-20px_rgba(0,0,0,0.6)] select-none sm:my-6 sm:h-[calc(100vh-3rem)] sm:min-h-0 sm:overflow-hidden sm:rounded-[2.5rem] sm:border-8 sm:border-[#111827]">
          <div
            className="absolute left-1/2 top-0 z-20 hidden h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-[#111827] sm:block"
            aria-hidden="true"
          />
          <ModeBanner />
          <TopBar
            title={header.title}
            showBack={header.showBack}
            liveMinute={header.liveMinute}
          />
          <main
            className="flex-1 w-full px-4 py-4 pb-20 sm:overflow-y-auto"
            id="main-content"
            tabIndex={-1}
          >
            <Outlet />
          </main>
          <BottomNav />
          <ChatBot />
        </div>
      </div>
    </HeaderContext.Provider>
  );
}
