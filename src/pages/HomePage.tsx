export default ({ user }: any) => {
  const userColor = user.accent_color ? `#${user.accent_color.toString(16).padStart(6, '0')}` : '#5865F2';

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-300">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 overflow-hidden rounded-2xl bg-[#2B2D31] shadow-2xl">
          <div 
            className="h-24" 
            style={{ backgroundColor: userColor }}
          ></div>
          
          <div className="relative px-6 pb-6">
            <img 
              src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} 
              className="-mt-12 h-24 w-24 rounded-full border-[6px] border-[#2B2D31] shadow-lg" 
              alt="avatar" 
              onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn.discordapp.com/embed/avatars/0.png"; }}
            />
            <div className="mt-4">
              <h2 className="text-2xl font-bold text-white">{user.global_name || user.username}</h2>
              <p className="text-[#B5BAC1]">SharkGamesへようこそ！</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-[#2B2D31] p-6 shadow-sm border border-white/5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#B5BAC1]">注意点</h3>
            <p className="mt-2 text-3xl font-bold text-white">現在開発中です。</p>
          </div>
        </div>
      </div>
    </div>
  );
};