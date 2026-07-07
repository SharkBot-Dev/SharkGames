import React, { useEffect, useState } from "react";

const checkWinner = (squares: (string | null)[]) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i] as any;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: lines[i] };
    }
  }
  if (squares.every(square => square !== null)) {
    return { winner: "Draw", line: [] };
  }
  return null;
};

const getParticipantName = (participant: any, fallback: string) =>
  participant?.global_name ||
  participant?.display_name ||
  participant?.displayName ||
  participant?.username ||
  participant?.user?.global_name ||
  participant?.user?.username ||
  fallback;

const getParticipantId = (participant: any) => participant?.id || participant?.user?.id;

export default ({
  sessionId,
  discordSdk,
  ws,
  userOAuthToken,
  currentUserId,
  currentUsername,
  currentUserIcon,
  clientId,
  participants,
}: {
  sessionId: string;
  discordSdk: any;
  ws: WebSocket | null;
  userOAuthToken: string;
  currentUserId: string;
  currentUsername: string;
  currentUserIcon?: string;
  clientId: string;
  participants: any[];
}) => {
  const [entries, setEntries] = useState<(string | null)[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState<boolean>(false);

  const playerO = participants[0];
  const playerX = participants[1];
  const playerOName = getParticipantName(playerO, "O");
  const playerXName = getParticipantName(playerX, "X");
  const getRoleName = (role: "O" | "X") => (role === "O" ? playerOName : playerXName);

  let myRole: "O" | "X" | "Spectator" = "Spectator";
  if (playerO && currentUserId === getParticipantId(playerO)) {
    myRole = "O";
  } else if (playerX && currentUserId === getParticipantId(playerX)) {
    myRole = "X";
  }

  const currentTurnMark = xIsNext ? "X" : "O";

  const isMyTurn = myRole === currentTurnMark;

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (
          (data.type === "ox_update" && data.clientId !== clientId) ||
          data.type === "ox_sync_all"
        ) {
          if (Array.isArray(data.payload?.entries)) {
            const [board, nextPlayer] = data.payload.entries;
            if (Array.isArray(board)) setEntries(board);
            if (typeof nextPlayer === "boolean") setXIsNext(nextPlayer);
          }
        }
      } catch (e) {
        console.error("WS message parse error", e);
      }
    };

    const sendSyncRequest = () => {
      ws.send(
        JSON.stringify({
          type: "ox_sync",
          clientId,
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
  }, [clientId, sessionId, ws]);

  const sendUpdate = (updatedBoard: (string | null)[], nextTurn: boolean) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "ox_update",
          clientId,
          payload: { entries: [updatedBoard, nextTurn] },
        })
      );
    }
  };

  const handleClick = (index: number) => {
    if (checkWinner(entries) || entries[index] || !isMyTurn) return;

    const newBoard = [...entries];
    newBoard[index] = myRole;
    const nextTurn = !xIsNext;

    setEntries(newBoard);
    setXIsNext(nextTurn);

    sendUpdate(newBoard, nextTurn);
  };

  const handleReset = () => {
    if (myRole === "Spectator") return;

    const resetBoard = Array(9).fill(null);
    const resetTurn = false;
    setEntries(resetBoard);
    setXIsNext(resetTurn);
    sendUpdate(resetBoard, resetTurn);
  };

  const handleInvite = async () => {
    try {
      await discordSdk.commands.openInviteDialog();
    } catch (e) {
      console.error("招待に失敗しました", e);
    }
  };

  const gameResult = checkWinner(entries);
  let statusText = "";
  if (gameResult) {
    statusText = gameResult.winner === "Draw" ? "引き分けです！" : `勝者: ${getRoleName(gameResult.winner as "O" | "X")}`;
  } else {
    statusText = `次の手番: ${getRoleName(currentTurnMark)}`;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 text-white select-none">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#2e3035] pb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#B5BAC1]">あなたの状態:</span>
          {myRole === "O" && <span className="px-3 py-1 bg-[#5865F2] rounded-full text-xs font-bold">{playerOName} (先攻)</span>}
          {myRole === "X" && <span className="px-3 py-1 bg-[#f23f43] rounded-full text-xs font-bold">{playerXName} (後攻)</span>}
          {myRole === "Spectator" && <span className="px-3 py-1 bg-[#4e5058] text-[#dbdee1] rounded-full text-xs font-bold">👀 観戦モード</span>}
          
          {!gameResult && myRole !== "Spectator" && (
            <span className={`text-xs ml-2 ${isMyTurn ? "text-[#23a55a] font-bold animate-pulse" : "text-[#gray-400]"}`}>
              {isMyTurn ? "（あなたの番です！）" : "（相手の番を待っています）"}
            </span>
          )}
        </div>

        <button
          onClick={handleInvite}
          className="w-full sm:w-auto px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium rounded-md transition text-sm shadow"
        >
          友達を招待
        </button>
      </div>

      <div className="flex flex-col items-center justify-center mt-8">
        <div className="mb-4 text-lg font-semibold bg-[#2b2d31] px-6 py-2 rounded-full border border-[#313338] shadow-inner">
          <span className={gameResult && gameResult.winner !== "Draw" ? "text-[#23a55a] font-bold" : ""}>
            {statusText}
          </span>
        </div>

        {participants.length < 2 && (
          <div className="mb-4 text-xs text-[#f23f43] bg-[#f23f43]/10 px-4 py-1.5 rounded border border-[#f23f43]/20">
            対戦相手が足りません。もう1人参加するとゲームを開始できます。
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 w-full max-w-[320px] aspect-square bg-[#1e1f22] p-2 rounded-xl border border-[#313338] shadow-xl">
          {entries.map((square, index) => {
            const isWinningSquare = gameResult?.line?.includes(index);
            const canClick = isMyTurn && !square && !gameResult;

            return (
              <button
                key={index}
                onClick={() => handleClick(index)}
                disabled={!canClick}
                className={`flex items-center justify-center text-4xl font-extrabold rounded-lg transition-all duration-150
                  ${isWinningSquare 
                    ? "bg-[#23a55a] text-white" 
                    : "bg-[#313338] text-[#dbdee1]"
                  }
                  ${canClick ? "hover:bg-[#35373c] active:scale-95 active:bg-[#3b3e45] cursor-pointer" : "cursor-not-allowed opacity-80"}
                  ${square === "O" && !isWinningSquare ? "text-[#5865F2]" : ""}
                  ${square === "X" && !isWinningSquare ? "text-[#f23f43]" : ""}
                `}
                style={{ contentVisibility: "auto" }}
              >
                {square}
              </button>
            );
          })}
        </div>

        {myRole !== "Spectator" && (
          <button
            onClick={handleReset}
            className="mt-6 px-6 py-2.5 bg-[#4e5058] hover:bg-[#6d6f78] text-white font-medium rounded-md transition text-sm shadow active:scale-98"
          >
            盤面をリセット
          </button>
        )}
      </div>
    </div>
  );
};
