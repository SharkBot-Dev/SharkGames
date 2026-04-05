import React from "react";
import { Menu, X, Home, Earth, Users, Star, Clock, Sun } from "lucide-react";

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
    <div className="flex min-h-screen bg-[#313338] text-[#DBDEE1]">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[9998] bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-[9999] w-64 transform bg-[#2B2D31] p-4 transition-transform duration-300 ease-in-out md:translate-x-0 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex h-full flex-col overflow-y-auto scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mb-8 flex items-center justify-between px-2">
            <span className="text-xl font-black tracking-wider text-white">SharkGames</span>
            <button className="md:hidden" onClick={() => setSidebarOpen(false)}><X size={24} /></button>
          </div>

          <nav className="flex-1 space-y-2">
            <NavItem icon={Home} label="ホーム" id="home" />
            <NavItem icon={Earth} label="地震速報" id="quake" />
            <NavItem icon={Clock} label="現在時刻" id="clock" />
            <NavItem icon={Sun} label="天気予報" id="weather" />
            <NavItem icon={Star} label="ティアー表" id="tier" />
            <NavItem icon={Users} label="貢献者" id="contributors" />
          </nav>

          <div className="mt-auto flex items-center gap-3 rounded-xl bg-[#232428] p-3">
            <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} className="h-10 w-10 rounded-full" alt="me" />
            <div className="overflow-hidden">
              <p className="truncate text-sm font-bold text-white">{user.username}</p>
              <p className="text-xs text-[#B5BAC1]">Online</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:ml-64">
        <header className="flex items-center justify-between border-b border-black/20 bg-[#313338] px-4 py-3 md:hidden">
          <span className="font-bold text-white">SharkGames</span>
          <button onClick={() => setSidebarOpen(true)} className="rounded-md p-1 hover:bg-[#35373C]"><Menu size={28} /></button>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};