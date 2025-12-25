import React from 'react';

export const AkhaPattern: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`flex overflow-hidden h-4 w-full ${className}`}>
      {/* Simulation of geometric embroidery using CSS shapes */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 flex">
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-b-[16px] border-b-red-600 border-r-[8px] border-r-transparent"></div>
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[16px] border-t-slate-800 border-r-[8px] border-r-transparent"></div>
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-b-[16px] border-b-zinc-300 border-r-[8px] border-r-transparent"></div>
        </div>
      ))}
    </div>
  );
};

export const SectionDivider: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center gap-4 my-6">
    <div className="h-[2px] bg-red-800 flex-1 opacity-20"></div>
    <div className="flex flex-col items-center">
        <span className="text-red-900 font-bold uppercase tracking-widest text-xs mb-1">Akha Dictionary</span>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
    </div>
    <div className="h-[2px] bg-red-800 flex-1 opacity-20"></div>
  </div>
);