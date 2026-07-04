import { useState } from "react";
import { Outlet } from "react-router-dom";
import HeaderState from "@interfaces/HeaderState";
import TopBar from "@organisms/TopBar";
import BottomNav from "@organisms/BottomNav";
import ChatBot from "@organisms/ChatBot";
import ModeBanner from "@organisms/ModeBanner";
import { useAuth } from "@context/AuthContext";
import AuthPage from "@pages/AuthPage";
import { HeaderContext } from "@context/HeaderContext";

export default function App() {
  const { user } = useAuth();
  const [header, setHeader] = useState<HeaderState>({
    title: "Coupe du Monde 2026",
    showBack: false,
    liveMinute: null,
  });

  function updateHeader(partial: Partial<HeaderState>) {
    setHeader((prev) => ({ ...prev, ...partial }));
  }

  if (!user) return <AuthPage />;

  return (
    <HeaderContext.Provider value={updateHeader}>
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>
      <div className="min-h-screen flex flex-col ">
        <ModeBanner />
        <TopBar
          title={header.title}
          showBack={header.showBack}
          liveMinute={header.liveMinute}
        />
        <main
          className="flex-1 w-full max-w-shell mx-auto px-4 py-4 "
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
