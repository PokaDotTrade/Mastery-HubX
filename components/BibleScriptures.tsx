
import React from 'react';
import { Devotion } from '../types';

interface BibleScripturesProps {
  heartedScriptures: Devotion[];
  onToggleHeart: (devotion: Devotion) => void;
}

const BibleScriptures: React.FC<BibleScripturesProps> = ({ heartedScriptures, onToggleHeart }) => {
  return (
    <div className="space-y-12 pt-4 pb-20 animate-fade-in-up">
      <section className="space-y-6">
        <div className="flex justify-between items-center px-1">
           <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Saved Insights</h2>
           <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{heartedScriptures.length} Total Verses</p>
        </div>

        {heartedScriptures.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {heartedScriptures.map((devotion, idx) => (
              <div 
                key={idx} 
                className="relative glass border-white/5 rounded-[40px] p-8 space-y-6 hover:border-emerald-400/20 hover:scale-[1.02] transition-all bg-white/[0.01] group animate-fade-in-up shadow-xl" 
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <button 
                  onClick={() => onToggleHeart(devotion)}
                  className="absolute top-8 right-8 size-10 glass rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 text-rose-500 shadow-lg"
                >
                  <span className="material-symbols-outlined text-xl filled-icon">favorite</span>
                </button>

                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20">
                    <span className="material-symbols-outlined text-xs text-emerald-400 filled-icon">menu_book</span>
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Mastery Verse</span>
                  </div>
                  <h3 className="text-2xl font-black text-white font-display tracking-tight leading-tight group-hover:text-emerald-400 transition-colors">{devotion.ref}</h3>
                  <p className="text-base font-bold text-slate-200 italic leading-relaxed">"{devotion.verse}"</p>
                </div>

                <div className="h-px w-12 bg-white/10"></div>
                
                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  {devotion.reflection}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 glass rounded-[48px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center bg-white/[0.01] animate-fade-in-up">
             <div className="size-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-slate-700">
                <span className="material-symbols-outlined text-5xl">favorite</span>
             </div>
             <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 text-center max-w-xs leading-relaxed">
                No scriptures saved yet. Heart a devotion in the hub to see it here ❤️
             </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default BibleScriptures;
