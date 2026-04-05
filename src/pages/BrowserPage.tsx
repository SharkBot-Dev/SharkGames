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
  currentUserIcon
}: Props) => {
  const [inputUrl, setInputUrl] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const [activeUser, setActiveUser] = useState<string | null>(null);
  const [activeUserAvatar, setActiveUserAvatar] = useState<string | null>(null);
  
  const [loading, setLoading] = useState<boolean>(false);
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
      ws.send(JSON.stringify({
        type: "browser_sync",
        clientId: clientId.current
      }));
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

  const sendUpdate = (img: string, type: "browser_update" | "browser_sync_all" = "browser_update") => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: type,
        clientId: clientId.current,
        payload: {
          image: img,
          userId: currentUserId,
          username: currentUsername,
          iconURL: currentUserIcon,
        }
      }));
    }
  };

  const handleFetchImage = async () => {
    if (!inputUrl.trim()) {
      setError("URLを入力してください");
      return;
    }

    if (!isValidUrl(inputUrl)) {
      setError("正しいURL形式 (https://...) で入力してください");
      return;
    }

    setLoading(true);
    setError(null);

    const apiUrl = '/securl/jx/get_page_jx.php';
    const params = new URLSearchParams();
    params.append('url', inputUrl);
    params.append('waitTime', '1');
    params.append('browserWidth', '1280'); 
    params.append('browserHeight', '720');

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: params,
      });

      if (!response.ok) throw new Error('通信エラー');

      const result = await response.json();
      if (result.img) {
        const fullUrl = `/securl${result.img}`;
        
        setImageUrl(fullUrl);
        setActiveUser(currentUsername);
        setActiveUserAvatar(currentUserIcon as any);
        currentImageRef.current = fullUrl;
        
        sendUpdate(fullUrl);
      } else {
        throw new Error('画像が生成できませんでした');
      }
    } catch (err) {
      setError('取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4 gap-6">
      <div className="flex flex-col md:flex-row gap-3 mb-8 bg-[#2b2d31] p-4 rounded-xl border border-gray-700">
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFetchImage()}
          placeholder="共有したいURLを入力 (https://...)"
          className="flex-1 p-2.5 rounded-lg bg-[#383a40] border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
        />
        <button
          onClick={handleFetchImage}
          disabled={loading}
          className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
            loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
          }`}
        >
          {loading ? '取得中...' : 'アクセスする'}
        </button>
      </div>

      {error && <div className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg border border-red-100">{error}</div>}

      <div className="flex items-center gap-3 min-h-[40px]">
        {activeUser ? (
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100 animate-fade-in">
            <img 
              src={activeUserAvatar || ""} 
              alt={activeUser}
              className="w-6 h-6 rounded-full object-cover border border-indigo-200"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn.discordapp.com/embed/avatars/0.png"; }}
            />
            <span className="text-sm font-bold text-gray-700">
              {activeUser} <span className="font-normal text-gray-500 italic">が共有中</span>
            </span>
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic font-light">待機中...</div>
        )}
      </div>

      <div className="relative w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
        {imageUrl ? (
          <>
            <img 
              src={imageUrl} 
              className="w-full h-full object-contain transition-opacity duration-700" 
              alt="Shared screen"
            />
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md p-1 pr-3 rounded-full border border-white/20">
              <img 
                src={activeUserAvatar || ""} 
                className="w-8 h-8 rounded-full border-2 border-white object-cover"
                alt="operator"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn.discordapp.com/embed/avatars/0.png"; }}
              />
              <div className="flex flex-col leading-none">
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-tighter">Shared By</span>
                <span className="text-xs text-white font-medium truncate max-w-[80px]">{activeUser}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 flex-col gap-4">
            <div className="text-5xl opacity-20">🌐</div>
            <p className="font-medium tracking-widest text-sm uppercase">URLを入力して始めましょう！</p>
          </div>
        )}
        
        {loading && (
          <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-[2px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full shadow-xl"></div>
              <span className="text-white text-[10px] font-black tracking-[0.2em] drop-shadow-md">取得しています...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedBrowser;