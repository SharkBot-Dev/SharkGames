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
    color: "#5865F2"
  }
];

export default () => {
  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Project Contributors</h1>
          <p className="mt-2 text-[#B5BAC1]">SharkGamesを支える素晴らしいメンバーを紹介します。</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {contributors.map((user) => (
            <div 
              key={user.id} 
              className="group overflow-hidden rounded-2xl bg-[#2B2D31] shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl border border-white/5"
            >
              <div 
                className="h-20 w-full opacity-80 transition-opacity group-hover:opacity-100" 
                style={{ backgroundColor: user.color }}
              ></div>
              
              <div className="relative px-5 pb-6">
                <img 
                  src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} 
                  className="-mt-10 h-20 w-20 rounded-full border-[6px] border-[#2B2D31] bg-[#2B2D31] shadow-lg" 
                  alt={user.username} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://cdn.discordapp.com/embed/avatars/0.png";
                  }}
                />
                
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white leading-tight">
                      {user.global_name || user.username}
                    </h2>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#B5BAC1] mt-1">
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

        <div className="mt-12 rounded-xl bg-[#2B2D31]/50 p-6 text-center border border-white/5">
          <p className="text-sm text-[#B5BAC1]">
            現在、追加のコントリビューターを募集中です。興味がある方はDiscordからご連絡ください。
          </p>
        </div>
      </div>
    </div>
  );
};