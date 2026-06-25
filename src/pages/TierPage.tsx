import React, { useEffect, useRef, useState } from "react";
import { snapdom } from "@zumer/snapdom";

type TierEntry = {
  id: string;
  text: string;
  rank: "S" | "A" | "B" | "C" | "D";
  userId: string;
  username: string;
  iconURL?: string;
};

const rankOrder: TierEntry["rank"][] = ["S", "A", "B", "C", "D"];

const rankColors: Record<TierEntry["rank"], { bg: string }> = {
  S: { bg: "bg-yellow-400/30" },
  A: { bg: "bg-blue-400/30" },
  B: { bg: "bg-green-400/30" },
  C: { bg: "bg-purple-400/30" },
  D: { bg: "bg-red-400/30" },
};

export default ({
  sessionId,
  discordSdk,
  ws,
  userOAuthToken,
  currentUserId,
  currentUsername,
  currentUserIcon,
}: {
  sessionId: string;
  discordSdk: any;
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
      ws.send(
        JSON.stringify({
          type: "tier_sync",
          clientId: clientId.current,
        })
      );
    };

    ws.addEventListener("message", handleMessage);

    if (ws.readyState === WebSocket.OPEN) {
      sendSyncRequest();
    } else {
      ws.addEventListener("open", sendSyncRequest);
    }

    return () => {
      ws.removeEventListener("message", handleMessage);
      ws.removeEventListener("open", sendSyncRequest);
    };
  }, [sessionId, ws]);

  const handleShare = async () => {
    if (!tierTableRef.current) return;

    try {
      const blob = await snapdom.toBlob(tierTableRef.current, {
        scale: 2,
        backgroundColor: "#2b2d31",
        type: "png",
      });

      if (!blob) throw new Error("画像の作成に失敗しました");

      const imageFile = new File([blob], "tier-list.png", { type: "image/png" });
      const body = new FormData();
      body.append("file", imageFile);

      const attachmentResponse = await fetch(
        `https://discord.com/api/v10/applications/${import.meta.env.VITE_DISCORD_CLIENT_ID}/attachment`,
        {
          method: "POST",
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
      await discordSdk.commands.openShareMomentDialog({
        mediaUrl: attachmentJson.attachment.url,
      });
    } catch (error) {
      console.error("共有エラー:", error);
      discordSdk.commands.captureLog({
        level: "error",
        message: String(error),
      });
    }
  };

  const sendUpdate = (updatedEntries: TierEntry[]) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "tier_update",
          clientId: clientId.current,
          payload: { entries: updatedEntries },
        })
      );
    }
  };

  const handleInvite = async () => {
    try {
      await discordSdk.commands.openInviteDialog();
    } catch (e) {
      console.error("招待に失敗しました", e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newEntry: TierEntry = {
      id: crypto.randomUUID(),
      text: inputText.trim(),
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
    const filtered = entries.filter((entry) => entry.id !== id);
    setEntries(filtered);
    sendUpdate(filtered);
  };

  const groupedByRank: Record<TierEntry["rank"], TierEntry[]> = {
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
  };
  entries.forEach((entry) => groupedByRank[entry.rank].push(entry));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tier表メーカー</h1>
          <p className="mt-1 text-sm text-[#B5BAC1]">
            項目を書いてランクを選び、「追加」を押してください。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            onClick={handleShare}
            className="min-h-11 rounded-lg bg-gray-600 px-4 py-2 text-sm font-bold transition-colors hover:bg-gray-700 disabled:opacity-50"
          >
            画像で共有
          </button>
          <button
            onClick={handleInvite}
            className="min-h-11 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold transition-colors hover:bg-green-700"
          >
            友だちを招待
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-6 flex flex-col gap-3 rounded-xl border border-gray-700 bg-[#232428] p-4 sm:flex-row"
      >
        <label className="flex flex-1 flex-col gap-1 text-sm font-bold text-[#DBDEE1]">
          追加する項目
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="例: サメ、マグロ、イルカ"
            className="min-h-12 rounded-lg border border-gray-600 bg-[#383a40] p-3 font-normal text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
          />
        </label>
        <div className="grid grid-cols-[1fr_auto] gap-2 sm:flex">
          <label className="flex flex-col gap-1 text-sm font-bold text-[#DBDEE1]">
            ランク
            <select
              value={inputRank}
              onChange={(e) => setInputRank(e.target.value as TierEntry["rank"])}
              className="min-h-12 rounded-lg border border-gray-600 bg-[#383a40] p-3 font-bold text-white"
            >
              {rankOrder.map((rank) => (
                <option key={rank} value={rank}>
                  {rank}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="self-end rounded-lg bg-[#5865F2] px-6 py-3 font-bold transition-colors hover:bg-[#4752c4]"
          >
            追加
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-700 bg-[#2b2d31]" ref={tierTableRef}>
        {rankOrder.map((rank) => (
          <div key={rank} className="flex min-h-20 border-b border-gray-700 last:border-0">
            <div className={`flex w-16 items-center justify-center text-2xl font-black md:w-24 ${rankColors[rank].bg}`}>
              {rank}
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-3 p-3 md:p-4">
              {groupedByRank[rank].length === 0 ? (
                <span className="ml-2 text-sm font-bold text-white/20">まだありません</span>
              ) : (
                groupedByRank[rank].map((entry) => (
                  <div
                    key={entry.id}
                    className="relative min-w-[112px] max-w-full rounded-lg border border-gray-600 bg-[#3a3c41] p-3 pr-10"
                  >
                    <div className="break-all text-sm md:text-base">{entry.text}</div>
                    <div className="mt-2 flex items-center gap-1">
                      <img
                        src={entry.iconURL || "https://cdn.discordapp.com/embed/avatars/0.png"}
                        className="h-4 w-4 rounded-full"
                        alt=""
                      />
                      <span className="max-w-20 truncate text-[10px] text-gray-400">
                        {entry.username}
                      </span>
                    </div>
                    {entry.userId === currentUserId && (
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#232428] text-lg font-bold text-red-300 transition-colors hover:bg-red-500 hover:text-white"
                        aria-label={`${entry.text}を削除`}
                      >
                        x
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
