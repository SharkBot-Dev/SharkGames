interface Contributor {
  id: string;
  username: string;
  global_name: string;
  avatar: string;
  role: string;
  description: string;
  color: string;
}

const contributors: Contributor[] = [
  {
    id: "1335428061541437531",
    username: "kametailang0541",
    global_name: "サメちゃん",
    avatar: "03430ab2dfb21780772a5b7a6a46788e",
    role: "Owner",
    description: "SharkGamesを最初に作りました。",
    color: "#5865F2",
  },
];

export default () => {
  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Project Contributors
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#B5BAC1]">
            SharkGamesを支えているメンバーを紹介します。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {contributors.map((user) => (
            <div
              key={user.id}
              className="group overflow-hidden rounded-xl border border-white/5 bg-[#2B2D31] shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl"
            >
              <div
                className="h-20 w-full opacity-80 transition-opacity group-hover:opacity-100"
                style={{ backgroundColor: user.color }}
              />

              <div className="relative px-5 pb-6">
                <img
                  src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                  className="-mt-10 h-20 w-20 rounded-full border-[6px] border-[#2B2D31] bg-[#2B2D31] shadow-lg"
                  alt=""
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://cdn.discordapp.com/embed/avatars/0.png";
                  }}
                />

                <div className="mt-3">
                  <h2 className="text-xl font-bold leading-tight text-white">
                    {user.global_name || user.username}
                  </h2>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#B5BAC1]">
                    {user.role}
                  </p>

                  <div className="mt-4 rounded-lg bg-[#1E1F22] p-3 text-sm text-[#DBDEE1]">
                    {user.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-white/5 bg-[#2B2D31]/50 p-5 text-center">
          <p className="text-sm leading-6 text-[#B5BAC1]">
            追加のコントリビューターも歓迎しています。興味がある方はDiscordから連絡してください。
          </p>
        </div>
      </div>
    </div>
  );
};
