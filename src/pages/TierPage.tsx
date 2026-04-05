import React, { useEffect, useRef, useState } from "react";
import { DiscordSDK } from "@discord/embedded-app-sdk";
import { domToBlob } from 'modern-screenshot';

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

type TierEntry = {
  id: string;
  text: string;
  rank: "S" | "A" | "B" | "C" | "D";
  userId: string;
  username: string;
  iconURL?: string;
};

const rankOrder: TierEntry["rank"][] = ["S", "A", "B", "C", "D"];

const rankColors: Record<TierEntry["rank"], { text: string; bg: string }> = {
  S: { text: "text-yellow-800", bg: "bg-yellow-400/30" },
  A: { text: "text-blue-800", bg: "bg-blue-400/30" },
  B: { text: "text-green-800", bg: "bg-green-400/30" },
  C: { text: "text-purple-800", bg: "bg-purple-400/30" },
  D: { text: "text-red-800", bg: "bg-red-400/30" },
};

export default ({
  sessionId,
  ws,
  userOAuthToken,
  currentUserId,
  currentUsername,
  currentUserIcon
}: {
  sessionId: string;
  ws: WebSocket | null;
  userOAuthToken: string;
  currentUserId: string;
  currentUsername: string;
  currentUserIcon?: string;
}) => {
  const [inputText, setInputText] = useState("");
  const [inputRank, setInputRank] = useState<TierEntry["rank"]>("S");
  const [entries, setEntries] = useState<TierEntry[]>([]);
  const clientId = useRef(crypto.randomUUID());
  const tierTableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ws) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (
                    (data.type === "tier_update" && data.clientId !== clientId.current) ||
                    data.type === "sync_all"
                ) {
                    setEntries(data.payload.entries);
                }
            } catch (e) {
                console.error("WS message parse error", e);
            }
        };

        const sendSyncRequest = () => {
            ws.send(JSON.stringify({
                type: "tier_sync",
                clientId: clientId.current
            }));
        };

        ws.addEventListener("message", handleMessage);

        if (ws.readyState === WebSocket.OPEN) {
            sendSyncRequest();
        } else {
            ws.addEventListener("open", sendSyncRequest);
        }

        sendSyncRequest();

        return () => {
            ws.removeEventListener("message", handleMessage);
            ws.removeEventListener("open", sendSyncRequest);
        };
    }, [ws]);

  const handleShare = async () => {
    if (!tierTableRef.current) return;

    try {
      const blob = await domToBlob(tierTableRef.current, {
        scale: 2,
      });
      if (!blob) return;

      const imageFile = new File([blob], 'tier-list.png', { type: 'image/png' });

      const body = new FormData();
      body.append('file', imageFile);

      const attachmentResponse = await fetch(
        `https://discord.com/api/v10/applications/${import.meta.env.VITE_DISCORD_CLIENT_ID}/attachment`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${userOAuthToken}`, 
          },
          body,
        }
      );

      if (!attachmentResponse.ok) {
        throw new Error(`Upload failed: ${attachmentResponse.statusText}`);
      }

      const attachmentJson = await attachmentResponse.json();

      const mediaUrl = attachmentJson.attachment.url;

      await discordSdk.commands.openShareMomentDialog({ mediaUrl });

    } catch (error) {
      console.error("共有エラー:", error);
      alert("画像のアップロードまたは共有に失敗しました。");
    }
  };

  const sendUpdate = (updatedEntries: TierEntry[]) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "tier_update",
          clientId: clientId.current,
          payload: { entries: updatedEntries }
        })
      );
    }
  };

  const handleInvite = async () => {
    try {
      await discordSdk.commands.openInviteDialog();
    } catch (e) {
      console.error("招待失敗", e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newEntry: any = {
      id: crypto.randomUUID(),
      text: inputText,
      rank: inputRank,
      userId: currentUserId,
      username: currentUsername,
      iconURL: currentUserIcon,
    };

    const newEntries = [...entries, newEntry];
    setEntries(newEntries);
    sendUpdate(newEntries);
    setInputText("");
  };

  const handleDelete = (id: string) => {
    const filtered = entries.filter((e) => e.id !== id);
    setEntries(filtered);
    sendUpdate(filtered);
  };

  const groupedByRank: Record<TierEntry["rank"], TierEntry[]> = {
    S: [], A: [], B: [], C: [], D: []
  };
  entries.forEach((entry) => groupedByRank[entry.rank].push(entry));

  return (
      <div>
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Tier表メーカー
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
            >
              共有する
            </button>
            <button
              onClick={handleInvite}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
            >
              招待リンクを共有
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col md:flex-row gap-3 mb-8 bg-[#2b2d31] p-4 rounded-xl border border-gray-700"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Tierに追加する項目..."
            className="flex-1 p-2.5 rounded-lg bg-[#383a40] border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
          />
          <div className="flex gap-2">
            <select
              value={inputRank}
              onChange={(e) => setInputRank(e.target.value as TierEntry["rank"])}
              className="p-2.5 rounded-lg bg-[#383a40] border border-gray-600 font-bold"
            >
              {rankOrder.map((rank) => (
                <option key={rank} value={rank}>{rank}</option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-[#5865F2] hover:bg-[#4752c4] px-6 py-2.5 rounded-lg font-bold transition-colors"
            >
              追加
            </button>
          </div>
        </form>

        <div className="bg-[#2b2d31] rounded-xl overflow-hidden border border-gray-700" ref={tierTableRef}>
          {rankOrder.map((rank) => (
            <div key={rank} className="flex border-b border-gray-700 last:border-0 min-h-[80px]">
              <div className={`w-16 md:w-24 flex items-center justify-center font-black text-2xl ${rankColors[rank].bg}`}>
                {rank}
              </div>
              <div className="flex-1 p-4 flex flex-wrap gap-3 items-center">
                {groupedByRank[rank].length === 0 ? (
                  <span className="text-white/10 font-bold ml-2">EMPTY</span>
                ) : (
                  groupedByRank[rank].map((entry) => (
                    <div key={entry.id} className="group relative bg-[#3a3c41] border border-gray-600 rounded-lg p-2 pr-8 min-w-[100px]">
                      <div className="break-all">{entry.text}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <img
                          src={entry.iconURL || "https://cdn.discordapp.com/embed/avatars/0.png"}
                          className="w-4 h-4 rounded-full"
                          alt=""
                        />
                        <span className="text-[10px] text-gray-400 truncate max-w-[60px]">
                          {entry.username}
                        </span>
                      </div>
                      {entry.userId === currentUserId && (
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-red-400 bg-[#2b2d31] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
  );
};