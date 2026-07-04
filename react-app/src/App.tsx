import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import HeaderState from "@interfaces/HeaderState";
import TopBar from "@organisms/TopBar";
import BottomNav from "@organisms/BottomNav";
import ChatBot from "@organisms/ChatBot";
import ModeBanner from "@organisms/ModeBanner";
import { useAuth } from "@context/AuthContext";
import AuthPage from "@pages/AuthPage";
import { HeaderContext } from "@context/HeaderContext";
import { resolveHeader } from "@utils/headerRoutes";

export default function App() {
  const { user } = useAuth();
  const location = useLocation();
  const [override, setOverride] = useState<Partial<HeaderState>>({});

  useEffect(() => {
    setOverride({});
  }, [location.pathname]);

  function updateHeader(partial: Partial<HeaderState>) {
    setOverride((prev) => ({ ...prev, ...partial }));
  }

  if (!user) return <AuthPage />;

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
      <div className="min-h-screen flex flex-col select-none">
        <ModeBanner />
        <TopBar
          title={header.title}
          showBack={header.showBack}
          liveMinute={header.liveMinute}
        />
        <main
          className="flex-1 w-full max-w-shell mx-auto px-4 py-4 pb-20"
          id="main-content"
          tabIndex={-1}
        >
          <Outlet />
        </main>
        <BottomNav />
        <ChatBot />
      </div>
    </HeaderContext.Provider>
  );
}
