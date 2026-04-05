import { useEffect, useState } from "react";
import TierPage from "../pages/TierPage";
import { Star } from "lucide-react";

export default ({ discordSdk, instanceId, auth, ws }: any) => {
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const users = await discordSdk.commands.getInstanceConnectedParticipants();
        if (users && users.participants) {
           setParticipants(users.participants);
        }
      } catch (e) {
        console.error("参加者の取得に失敗:", e);
      }
    };

    fetchParticipants();

    const handler = (data: any) => {
      if (data && data.participants) {
        setParticipants(data.participants);
      }
    };

    discordSdk.subscribe("ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE", handler);

    return () => {
      discordSdk.unsubscribe("ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE", handler);
    };
  }, [instanceId]);

  return (
    <div className="flex h-screen flex-col bg-[#313338] text-[#DBDEE1]">
      <header className="flex items-center justify-between bg-[#2B2D31] px-4 py-3 shadow-lg border-b border-black/20">
        <div className="flex items-center gap-2">
          <div className="bg-red-500 p-1.5 rounded-lg">
            <Star size={20} className="text-white fill-current" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">ティアー表メーカー</h1>
            <p className="text-[10px] text-[#B5BAC1] mt-1">マルチプレイに対応</p>
          </div>
        </div>
        <div className="p-2 flex gap-2 flex-wrap">
          {participants.length > 0 ? (
            participants.map((p: any) => (
              <div key={p.id} className="flex items-center gap-1.5 text-xs bg-[#383a40] hover:bg-[#404249] px-2 py-1 rounded-full border border-gray-700 transition-colors">
                <img 
                  src={p.avatar ? `https://cdn.discordapp.com/avatars/${p.id}/${p.avatar}.png` : "https://cdn.discordapp.com/embed/avatars/0.png"} 
                  className="w-4 h-4 rounded-full"
                  alt=""
                />
                <span className="font-medium">{p.username}</span>
              </div>
            ))
          ) : (
            <span className="text-xs text-gray-500 p-1">参加者を取得中...</span>
          )}
        </div>
      </header>

      <div className="p-4 md:p-8 h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 bg-[#2b2d31] text-white font-sans">
        <TierPage
          sessionId={instanceId}
          ws={ws}
          userOAuthToken={auth.access_token}
          currentUserId={auth.user.id}
          currentUsername={auth.user.username}
          currentUserIcon={`https://cdn.discordapp.com/avatars/${auth.user.id}/${auth.user.avatar}.png`}
        />
      </div>
    </div>
  )
};