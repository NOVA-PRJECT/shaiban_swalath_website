import React, { useEffect, useState } from 'react';

const ProgressCircle = ({ current, goal }) => {
  const [animatedCount, setAnimatedCount] = useState(0);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate percentage but ensure it's at least 1% if there is any count 
  // so the gold line is always visible once someone starts.
  const percentage = current > 0 ? Math.max((current / goal) * 100, 2) : 0;
  const offset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    let start = animatedCount;
    const end = current;
    if (start === end) return;

    const duration = 2000; // Slower, more majestic animation
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smoother "landing" on the number
      const easeOutQuad = (t) => t * (2 - t);
      const val = Math.floor(easeOutQuad(progress) * (end - start) + start);
      
      setAnimatedCount(val);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [current]);

  // Updated: More encouraging number format
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  return (
  <div className="relative flex items-center justify-center py-4"> {/* Reduced padding */}
    <div className="absolute w-32 h-32 rounded-full bg-[#D4AF37]/5 blur-2xl"></div>
    
    <svg className="w-40 h-40 transform -rotate-90"> {/* Slightly smaller SVG */}
      <circle
        cx="80" cy="80" r={radius}
        stroke="currentColor" strokeWidth="6" fill="transparent"
        className="text-white/5"
      />
      <circle
        cx="80" cy="80" r={radius}
        stroke="#D4AF37" strokeWidth="8" fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-in-out"
      />
    </svg>
    
    {/* Refined Center Text Logic */}
<div className="absolute inset-0 flex flex-col items-center justify-center">
  {/* 1. The Number (Top) */}
  <span className="text-2xl font-black text-white leading-none tracking-tighter">
    {formatNumber(animatedCount)}
  </span>
  
  {/* 2. The Label (Middle) */}
  <span className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-widest mt-1">
    പൂർത്തിയായത്
  </span>

  {/* 3. The Goal (Bottom) */}
  <div className="h-[1px] w-6 bg-white/20 my-1"></div>
  <span className="text-[7px] text-white/40 font-medium">
    ലക്ഷ്യം: 10 ലക്ഷം
  </span>
</div>

  </div>
);
};

export default ProgressCircle;
