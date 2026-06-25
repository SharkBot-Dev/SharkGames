import React, { useEffect, useState } from "react";
import { DiscordSDK } from "@discord/embedded-app-sdk";
import { Layout } from "./components/Layout";
import HomePage from "./pages/HomePage";
import ContributorsPage from "./pages/ContributorsPage";
import TierSessionCard from "./sessions/TierSessionCard";
import ClockPage from "./pages/ClockPage";
import WeatherPage from "./pages/WeatherPage";

const createLocalDiscordSdk = () => ({
  commands: {
    getInstanceConnectedParticipants: async () => ({ participants: [] }),
    openInviteDialog: async () => undefined,
    openShareMomentDialog: async () => undefined,
    captureLog: async () => undefined,
  },
  subscribe: () => undefined,
  unsubscribe: () => undefined,
});

const App: React.FC = () => {
  const [auth, setAuth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [discordSdk, setDiscordSdk] = useState<any>(null);

  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const setup = async () => {
      try {
        const sdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);
        setDiscordSdk(sdk);

        await sdk.ready();

        const { code } = await sdk.commands.authorize({
          client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
          response_type: "code",
          scope: ["identify", "guilds"],
          prompt: "none",
        });

        const res = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const { access_token } = await res.json();

        const newAuth = await sdk.commands.authenticate({
          access_token,
        });

        setAuth({ ...newAuth, access_token });

        const params = new URLSearchParams(window.location.search);
        const id = params.get("instance_id");

        if (id) {
          setInstanceId(id);
        } else {
          console.error("instance_id not found");
        }

        const argsResponse = await fetch(`/api/getargs/${newAuth.user.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (argsResponse.ok) {
          const argsResponseData = await argsResponse.json();
          const args = argsResponseData.args;
          console.log("取得した引数:", args);

          if (args.home) {
            setActiveTab(args.home);
          }
        }
      } catch (e) {
        console.warn("Discord外で起動したため、ローカル確認モードで表示します。", e);
        setDiscordSdk(createLocalDiscordSdk());
        setAuth({
          access_token: "",
          user: {
            id: "local-user",
            username: "LocalUser",
            global_name: "Local User",
            avatar: "",
            accent_color: 0x5865F2,
          },
        });
        setInstanceId("local-dev");
      } finally {
        setLoading(false);
      }
    };

    setup();
  }, []);

  useEffect(() => {
    if (!instanceId || instanceId === "local-dev") return;

    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const socket = new WebSocket(`api/ws/${instanceId}`);

    const runPolling = () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "polling",
            clientId: "client_heartbeat",
            payload: {
              lastSyncTime: new Date().toISOString(),
            },
          })
        );
      }
    };

    socket.onopen = () => {
      console.log("WS Connected");
      pollInterval = setInterval(runPolling, 5000);
    };

    socket.onclose = () => console.log("WS closed");

    setWs(socket);

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      socket.close();
    };
  }, [instanceId]);

  if (loading || !auth || !instanceId || !discordSdk) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#313338] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#5865F2] border-t-transparent" />
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
    </Layout>
  );
};

export default App;
