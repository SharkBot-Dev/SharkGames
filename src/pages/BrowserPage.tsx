import { useEffect, useRef, useState } from "react";

interface Props {
  sessionId: string;
  ws: WebSocket | null;
  userOAuthToken: string;
  currentUserId: string;
  currentUsername: string;
  currentUserIcon?: string;
}

const SharedBrowser = ({
  ws,
  currentUserId,
  currentUsername,
  currentUserIcon,
}: Props) => {
  const [inputUrl, setInputUrl] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<string | null>(null);
  const [activeUserAvatar, setActiveUserAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientId = useRef(crypto.randomUUID());
  const currentImageRef = useRef<string | null>(null);

  const isValidUrl = (urlString: string) => {
    try {
      const url = new URL(urlString);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "browser_update":
          case "browser_sync_all":
            if (data.clientId !== clientId.current || data.type === "browser_sync_all") {
              setImageUrl(data.payload.image);
              setActiveUser(data.payload.username);
              setActiveUserAvatar(data.payload.iconURL);
              currentImageRef.current = data.payload.image;
            }
            break;

          case "browser_sync":
            if (currentImageRef.current && data.clientId !== clientId.current) {
              sendUpdate(currentImageRef.current, "browser_sync_all");
            }
            break;
        }
      } catch (e) {
        console.error("WS message parse error", e);
      }
    };

    const requestSync = () => {
      ws.send(
        JSON.stringify({
          type: "browser_sync",
          clientId: clientId.current,
        })
      );
    };

    ws.addEventListener("message", handleMessage);

    if (ws.readyState === WebSocket.OPEN) {
      requestSync();
    } else {
      ws.addEventListener("open", requestSync, { once: true });
    }

    return () => {
      ws.removeEventListener("message", handleMessage);
    };
  }, [ws]);

  const sendUpdate = (
    img: string,
    type: "browser_update" | "browser_sync_all" = "browser_update"
  ) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type,
          clientId: clientId.current,
          payload: {
            image: img,
            userId: currentUserId,
            username: currentUsername,
            iconURL: currentUserIcon,
          },
        })
      );
    }
  };

  const handleFetchImage = async () => {
    if (!inputUrl.trim()) {
      setError("URLを入力してください。");
      return;
    }

    if (!isValidUrl(inputUrl)) {
      setError("https:// から始まる正しいURLを入力してください。");
      return;
    }

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.append("url", inputUrl);
    params.append("waitTime", "1");
    params.append("browserWidth", "1280");
    params.append("browserHeight", "720");

    try {
      const response = await fetch("/securl/jx/get_page_jx.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: params,
      });

      if (!response.ok) throw new Error("通信エラー");

      const result = await response.json();
      if (result.img) {
        const fullUrl = `/securl${result.img}`;

        setImageUrl(fullUrl);
        setActiveUser(currentUsername);
        setActiveUserAvatar(currentUserIcon ?? null);
        currentImageRef.current = fullUrl;

        sendUpdate(fullUrl);
      } else {
        throw new Error("画像を作成できませんでした");
      }
    } catch (err) {
      setError("ページの取得に失敗しました。時間をおいてもう一度試してください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-5 p-0 md:p-4">
      <div className="w-full rounded-xl border border-gray-700 bg-[#232428] p-4">
        <label className="flex flex-col gap-2 text-sm font-bold text-[#DBDEE1]">
          みんなに見せたいページのURL
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFetchImage()}
              placeholder="https://example.com"
              className="min-h-12 flex-1 rounded-lg border border-gray-600 bg-[#383a40] p-3 font-normal text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
              inputMode="url"
            />
            <button
              onClick={handleFetchImage}
              disabled={loading}
              className={`min-h-12 rounded-lg px-6 py-3 font-bold text-white shadow-lg transition-all ${
                loading ? "bg-gray-500" : "bg-[#5865F2] hover:bg-[#4752c4] active:scale-95"
              }`}
            >
              {loading ? "取得中..." : "表示する"}
            </button>
          </div>
        </label>
        <p className="mt-2 text-xs leading-5 text-[#B5BAC1]">
          入力したURLの画面を画像として取得し、参加者全員に共有します。
        </p>
      </div>

      {error && (
        <div className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex min-h-10 items-center gap-3">
        {activeUser ? (
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#232428] px-3 py-1.5 shadow-sm">
            <img
              src={activeUserAvatar || "https://cdn.discordapp.com/embed/avatars/0.png"}
              alt=""
              className="h-6 w-6 rounded-full border border-indigo-200 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://cdn.discordapp.com/embed/avatars/0.png";
              }}
            />
            <span className="text-sm font-bold text-white">
              {activeUser} <span className="font-normal text-[#B5BAC1]">が共有中</span>
            </span>
          </div>
        ) : (
          <div className="text-sm text-gray-400">URLの入力を待っています</div>
        )}
      </div>

      <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-gray-900 shadow-2xl aspect-video">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              className="h-full w-full object-contain transition-opacity duration-700"
              alt="共有中のページ"
            />
            <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full border border-white/20 bg-black/60 p-1 pr-3 backdrop-blur-md">
              <img
                src={activeUserAvatar || "https://cdn.discordapp.com/embed/avatars/0.png"}
                className="h-8 w-8 rounded-full border-2 border-white object-cover"
                alt=""
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://cdn.discordapp.com/embed/avatars/0.png";
                }}
              />
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-bold uppercase text-indigo-300">共有者</span>
                <span className="max-w-20 truncate text-xs font-medium text-white">{activeUser}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-gray-500">
            <p className="text-sm font-bold uppercase tracking-wider">URLを入力して開始</p>
            <p className="text-xs leading-5 text-gray-400">
              スマホでは上の入力欄にURLを貼り付けて「表示する」を押してください。
            </p>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-indigo-900/40 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent shadow-xl" />
              <span className="text-xs font-black tracking-widest text-white drop-shadow-md">
                取得しています...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedBrowser;
