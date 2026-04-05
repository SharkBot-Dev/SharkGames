import React, { useRef, useEffect } from "react";
import { Menu, X, Home, Earth, Users, Star, Clock, Sun, WebcamIcon } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  user: any;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, isSidebarOpen, setSidebarOpen, user 
}) => {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    const edgeThreshold = 40;
    const swipeThreshold = 50;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        touchStartX.current = e.touches[0]!.clientX;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        touchEndX.current = e.touches[0]!.clientX;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        touchEndX.current = e.changedTouches[0]!.clientX;
      }

      if (touchStartX.current === null || touchEndX.current === null) return;

      const distance = touchEndX.current - touchStartX.current;

      if (!isSidebarOpen && touchStartX.current < edgeThreshold && distance > swipeThreshold) {
        setSidebarOpen(true);
      } else if (isSidebarOpen && distance < -swipeThreshold) {
        setSidebarOpen(false);
      }

      touchStartX.current = null;
      touchEndX.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isSidebarOpen, setSidebarOpen]);

  const NavItem = ({ icon: Icon, label, id }: any) => (
    <button 
      onClick={() => {
        setActiveTab(id);
        setSidebarOpen(false);
      }}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
        activeTab === id ? "bg-[#5865F2] text-white" : "text-[#B5BAC1] hover:bg-[#35373C] hover:text-[#DBDEE1]"
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-[#313338] text-[#DBDEE1] overflow-x-hidden">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm md:hidden transition-opacity" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-[9999] w-64 transform bg-[#2B2D31] p-4 shadow-2xl transition-transform duration-300 ease-out md:translate-x-0 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex h-full flex-col">
          <div className="mb-8 flex items-center justify-between px-2">
            <span className="text-xl font-black tracking-wider text-white">SharkGames</span>
            <button 
              className="rounded-full p-1 text-[#B5BAC1] hover:bg-[#35373C] hover:text-white md:hidden" 
              onClick={() => setSidebarOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
            <NavItem icon={Home} label="ホーム" id="home" />
            <div className="my-2 h-[1px] bg-[#35373C]" />
            <NavItem icon={Earth} label="地震速報" id="quake" />
            <NavItem icon={Clock} label="現在時刻" id="clock" />
            <NavItem icon={Sun} label="天気予報" id="weather" />
            <div className="my-2 h-[1px] bg-[#35373C]" />
            <NavItem icon={Star} label="ティアー表" id="tier" />
            <NavItem icon={WebcamIcon} label="ブラウザ" id="browser" />
            <div className="my-2 h-[1px] bg-[#35373C]" />
            <NavItem icon={Users} label="貢献者" id="contributors" />
          </nav>

          <div className="mt-auto flex items-center gap-3 rounded-xl bg-[#232428] p-3">
            <img 
              src={`https://cdn.discordapp.com/avatars/${user?.id}/${user?.avatar}.png`} 
              className="h-8 w-8 rounded-full bg-[#313338]" 
              alt="avatar" 
              onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn.discordapp.com/embed/avatars/0.png"; }} 
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{user?.username || "Guest"}</p>
              <p className="text-[10px] text-[#B5BAC1]">Online</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:ml-64">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-black/20 bg-[#313338]/95 backdrop-blur px-4 py-3 md:hidden">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="rounded-md p-1 text-[#B5BAC1] hover:bg-[#35373C] hover:text-white transition-colors"
              aria-label="Open menu"
            >
              <Menu size={26} />
            </button>
            <span className="font-bold text-white">SharkGames</span>
          </div>
          <div className="w-8" /> 
        </header>

        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
};