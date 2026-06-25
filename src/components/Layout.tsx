import React, { useEffect, useRef } from "react";
import {
  Clock,
  Earth,
  Home,
  Menu,
  Star,
  Sun,
  Users,
  WebcamIcon,
  X,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  user: any;
}

const navGroups = [
  [
    { icon: Home, label: "ホーム", shortLabel: "ホーム", id: "home" },
  ],
  [
    { icon: Earth, label: "地震情報", shortLabel: "地震", id: "quake" },
    { icon: Clock, label: "現在時刻", shortLabel: "時計", id: "clock" },
    { icon: Sun, label: "天気予報", shortLabel: "天気", id: "weather" },
  ],
  [
    { icon: Star, label: "Tier表", shortLabel: "Tier", id: "tier" },
    { icon: WebcamIcon, label: "共有ブラウザ", shortLabel: "共有", id: "browser" },
  ],
  [
    { icon: Users, label: "貢献者", shortLabel: "貢献者", id: "contributors" },
  ],
];

const navItems = navGroups.flat();

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setSidebarOpen,
  user,
}) => {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const activeItem = navItems.find((item) => item.id === activeTab) ?? navItems[0];
  const bottomItems = navItems.filter((item) =>
    ["home", "quake", "tier", "browser"].includes(item.id)
  );

  useEffect(() => {
    const edgeThreshold = 40;
    const swipeThreshold = 50;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartX.current = e.touches[0]!.clientX;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchEndX.current = e.touches[0]!.clientX;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length > 0) {
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

  const openTab = (id: string) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  const NavItem = ({ icon: Icon, label, id }: (typeof navItems)[number]) => (
    <button
      onClick={() => openTab(id)}
      className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
        activeTab === id
          ? "bg-[#5865F2] text-white"
          : "text-[#B5BAC1] hover:bg-[#35373C] hover:text-[#DBDEE1]"
      }`}
      aria-current={activeTab === id ? "page" : undefined}
    >
      <Icon size={21} aria-hidden="true" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[#313338] text-[#DBDEE1]">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[9999] w-72 transform bg-[#2B2D31] p-4 shadow-2xl transition-transform duration-300 ease-out md:w-64 md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="メインメニュー"
      >
        <div className="flex h-full flex-col">
          <div className="mb-5 flex items-center justify-between px-2">
            <span className="text-xl font-black tracking-wide text-white">SharkGames</span>
            <button
              className="min-h-10 min-w-10 rounded-lg text-[#B5BAC1] transition-colors hover:bg-[#35373C] hover:text-white md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="メニューを閉じる"
            >
              <X size={24} className="mx-auto" />
            </button>
          </div>

          <p className="mb-3 px-2 text-xs font-medium text-[#B5BAC1] md:hidden">
            画面下のタブ、またはこのメニューから移動できます。
          </p>

          <nav className="flex-1 space-y-2 overflow-y-auto">
            {navGroups.map((group, index) => (
              <div key={index} className="space-y-1">
                {index > 0 && <div className="my-2 h-px bg-[#35373C]" />}
                {group.map((item) => (
                  <NavItem key={item.id} {...item} />
                ))}
              </div>
            ))}
          </nav>

          <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#232428] p-3">
            <img
              src={`https://cdn.discordapp.com/avatars/${user?.id}/${user?.avatar}.png`}
              className="h-8 w-8 rounded-full bg-[#313338]"
              alt=""
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://cdn.discordapp.com/embed/avatars/0.png";
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{user?.username || "Guest"}</p>
              <p className="text-[10px] text-[#B5BAC1]">オンライン</p>
            </div>
          </div>
        </div>
      </aside>

      {!isSidebarOpen && (
        <div
          className="fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 rounded-r-full bg-[#5865F2]/40 px-1.5 py-4 text-[10px] font-bold text-white/80 md:hidden"
          aria-hidden="true"
        >
          MENU
        </div>
      )}

      <div className="flex flex-1 flex-col md:ml-64">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-black/20 bg-[#313338]/95 px-3 py-2.5 backdrop-blur md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-[#DBDEE1] transition-colors hover:bg-[#35373C] hover:text-white"
            aria-label="メニューを開く"
          >
            <Menu size={24} />
            <span className="text-sm font-bold">メニュー</span>
          </button>
          <div className="min-w-0 px-2 text-center">
            <p className="truncate text-sm font-bold text-white">{activeItem.label}</p>
            <p className="text-[10px] text-[#B5BAC1]">左端スワイプでも開けます</p>
          </div>
        </header>

        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-black/30 bg-[#232428]/98 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
          {bottomItems.map(({ icon: Icon, id, shortLabel, label }) => (
            <button
              key={id}
              onClick={() => openTab(id)}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-bold transition-colors ${
                activeTab === id ? "bg-[#5865F2] text-white" : "text-[#B5BAC1] active:bg-[#35373C]"
              }`}
              aria-label={label}
              aria-current={activeTab === id ? "page" : undefined}
            >
              <Icon size={21} aria-hidden="true" />
              <span>{shortLabel}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
