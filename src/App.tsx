import React, { useEffect, useState } from "react";
import { DiscordSDK } from "@discord/embedded-app-sdk";
import { Layout } from "./components/Layout";
import HomePage from "./pages/HomePage";
import QuakePage from "./pages/QuakePage";
import ContributorsPage from "./pages/ContributorsPage";

import TierSessionCard from "./sessions/TierSessionCard";
import ClockPage from "./pages/ClockPage";
import WeatherPage from "./pages/WeatherPage";
import BrowserSessionCard from "./sessions/BrowserSessionCard";

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

const App: React.FC = () => {
  const [auth, setAuth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const setup = async () => {
      try {
        await discordSdk.ready();

        const { code } = await discordSdk.commands.authorize({
          client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
          response_type: "code",
          scope: ["identify", "guilds"],
          prompt: "none"
        });

        const res = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const { access_token } = await res.json();

        const newAuth = await discordSdk.commands.authenticate({
          access_token
        });

        setAuth({ ...newAuth, access_token });

        const params = new URLSearchParams(window.location.search);
        const id = params.get("instance_id");

        if (id) {
          setInstanceId(id);
        } else {
          console.error("instance_id not found");
        }

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    setup();
  }, []);

  useEffect(() => {
    if (!instanceId) return;

    const socket = new WebSocket(
      `api/ws/${instanceId}`
    );

    socket.onopen = () => console.log("WS connected");

    socket.onclose = () => console.log("WS closed");

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [instanceId]);

  if (loading || !auth || !instanceId) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#313338] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#5865F2] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      isSidebarOpen={isSidebarOpen}
      setSidebarOpen={setSidebarOpen}
      user={auth.user}
    >
      {activeTab === "home" && <HomePage user={auth.user} />}
      {activeTab === "contributors" && <ContributorsPage />}
      {activeTab === "quake" && <QuakePage />}

      {activeTab === "tier" && (
        <TierSessionCard
          instanceId={instanceId}
          auth={auth}
          ws={ws}
          discordSdk={discordSdk}
        />
      )}

      {activeTab === "clock" && <ClockPage />}
      {activeTab === "weather" && <WeatherPage />}

      {activeTab === "browser" && (
        <BrowserSessionCard
          instanceId={instanceId}
          auth={auth}
          ws={ws}
          discordSdk={discordSdk}
        />
      )}
    </Layout>
  );
};

export default App;