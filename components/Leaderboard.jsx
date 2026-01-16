import React from 'react';

const Leaderboard = ({ topProfiles = [] }) => {
  // Safe helper to get a profile or a placeholder
  const getProfile = (index) => {
    return topProfiles && topProfiles[index] 
      ? topProfiles[index] 
      : { full_name: '---', total_count: 0 };
  };

  // Podium order: [2nd, 1st, 3rd]
  const secondPlace = getProfile(1);
  const firstPlace = getProfile(0);
  const thirdPlace = getProfile(2);

  return (
    <div className="max-w-xs mx-auto grid grid-cols-3 gap-3 items-end text-center text-white/90 pb-6 mt-4">
      
      {/* 2nd Place */}
      <div className="flex flex-col items-center pb-2 animate-in slide-in-from-bottom-2 duration-500">
        <p className="text-[10px] text-white/40 mb-1 font-bold uppercase tracking-widest">2nd</p>
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-1 shadow-inner">
          <span className="text-sm font-bold text-white/60">
            {secondPlace.full_name.charAt(0)}
          </span>
        </div>
        <p className="text-[11px] font-semibold truncate w-full px-1">{secondPlace.full_name}</p>
        <p className="text-[10px] text-[#D4AF37]/80 font-mono">{secondPlace.total_count.toLocaleString()}</p>
      </div>

{/* 1st Place (The Champion) */}
<div className="bg-white/5 rounded-t-[32px] py-4 border-t-2 border-x border-white/10 shadow-2xl relative flex flex-col items-center scale-110 z-10">
  {/* Changed: Use w-full and text-center to ensure crown is perfectly centered */}
  <div className="absolute -top-5 w-full text-center text-2xl drop-shadow-lg">👑</div>
  
  <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#D4AF37] to-[#8C6D1F] p-0.5 mb-1 shadow-lg">
    <div className="w-full h-full rounded-full bg-[#064E3B] flex items-center justify-center">
       <span className="text-xl font-black text-[#D4AF37]">
         {firstPlace.full_name.charAt(0)}
       </span>
    </div>
  </div>
  
  {/* Ensure names and counts are centered and don't overlap */}
  <p className="text-[11px] font-black truncate w-full px-1 text-center leading-tight">
    {firstPlace.full_name}
  </p>
  <p className="text-[10px] text-[#D4AF37] font-black">
    {firstPlace.total_count.toLocaleString()}
  </p>
</div>


      {/* 3rd Place */}
      <div className="flex flex-col items-center pb-2 animate-in slide-in-from-bottom-2 duration-500 delay-150">
        <p className="text-[10px] text-white/40 mb-1 font-bold uppercase tracking-widest">3rd</p>
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-1 shadow-inner">
          <span className="text-sm font-bold text-white/60">
            {thirdPlace.full_name.charAt(0)}
          </span>
        </div>
        <p className="text-[11px] font-semibold truncate w-full px-1">{thirdPlace.full_name}</p>
        <p className="text-[10px] text-[#D4AF37]/80 font-mono">{thirdPlace.total_count.toLocaleString()}</p>
      </div>
      
    </div>
  );
};

export default Leaderboard;
