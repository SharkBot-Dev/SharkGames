export default ({ user }: any) => {
  const userColor = user.accent_color
    ? `#${user.accent_color.toString(16).padStart(6, "0")}`
    : "#5865F2";

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 overflow-hidden rounded-xl bg-[#2B2D31] shadow-2xl">
          <div className="h-24" style={{ backgroundColor: userColor }} />

          <div className="relative px-5 pb-6">
            <img
              src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
              className="-mt-12 h-24 w-24 rounded-full border-[6px] border-[#2B2D31] shadow-lg"
              alt=""
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://cdn.discordapp.com/embed/avatars/0.png";
              }}
            />
            <div className="mt-4">
              <h2 className="text-2xl font-bold text-white">
                {user.global_name || user.username}
              </h2>
              <p className="mt-1 text-[#B5BAC1]">SharkGamesへようこそ。</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/5 bg-[#2B2D31] p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#B5BAC1]">
              スマホ操作
            </h3>
            <p className="mt-2 text-lg font-bold text-white">
              下のタブで主要機能へ移動できます。
            </p>
            <p className="mt-2 text-sm leading-6 text-[#B5BAC1]">
              ほかのページは左上の「メニュー」から開けます。画面左端から右へスワイプしてもメニューを表示できます。
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#2B2D31] p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#B5BAC1]">
              ステータス
            </h3>
            <p className="mt-2 text-2xl font-bold text-white">利用できます</p>
            <p className="mt-2 text-sm leading-6 text-[#B5BAC1]">
              地震情報、天気、Tier表、共有ブラウザをこのアプリ内で使えます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
