import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import TierPage from "../pages/TierPage";

export default ({ discordSdk, instanceId, auth, ws, clientId }: any) => {
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const users = await discordSdk.commands.getInstanceConnectedParticipants();
        if (users?.participants) {
          setParticipants(users.participants);
        }
      } catch (e) {
        console.error("参加者の取得に失敗しました", e);
      }
    };

    fetchParticipants();

    const handler = (data: any) => {
      if (data?.participants) {
        setParticipants(data.participants);
      }
    };

    discordSdk.subscribe("ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE", handler);

    return () => {
      discordSdk.unsubscribe("ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE", handler);
    };
  }, [discordSdk, instanceId]);

  return (
    <div className="flex min-h-screen flex-col bg-[#313338] text-[#DBDEE1]">
      <header className="flex flex-col gap-3 border-b border-black/20 bg-[#2B2D31] px-4 py-3 shadow-lg md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-red-500 p-1.5">
            <Star size={20} className="fill-current text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none text-white">Tier表メーカー</h1>
            <p className="mt-1 text-[10px] text-[#B5BAC1]">
              参加者と一緒にランク表を作れます
            </p>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:justify-end md:pb-0">
          {participants.length > 0 ? (
            participants.map((p: any) => (
              <div
                key={p.id}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-gray-700 bg-[#383a40] px-2 py-1 text-xs transition-colors hover:bg-[#404249]"
              >
                <img
                  src={
                    p.avatar
                      ? `https://cdn.discordapp.com/avatars/${p.id}/${p.avatar}.png`
                      : "https://cdn.discordapp.com/embed/avatars/0.png"
                  }
                  className="h-4 w-4 rounded-full"
                  alt=""
                />
              </div>
            ))
          ) : (
            <span className="p-1 text-xs text-gray-500">参加者を取得中...</span>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#2b2d31] p-4 font-sans text-white md:p-8">
        <TierPage
          sessionId={instanceId}
          discordSdk={discordSdk}
          ws={ws}
          userOAuthToken={auth.access_token}
          currentUserId={auth.user.id}
          currentUsername={auth.user.username}
          currentUserIcon={`https://cdn.discordapp.com/avatars/${auth.user.id}/${auth.user.avatar}.png`}
          clientId={clientId}
        />
      </div>
    </div>
  );
};
