
import React, { useMemo } from 'react';
import { Envelope } from '../types';
import { CURRENCY_OPTIONS } from '../constants.tsx';

interface GardenSummaryProps {
  envelopes: Envelope[];
  currency: string;
  onPlantNowClick?: () => void;
}

export const GardenSummary: React.FC<GardenSummaryProps> = ({ envelopes, currency }) => {
  const filledCount = envelopes.filter(e => e.completed).length;
  const totalPossibleEnvelopes = envelopes.length;
  const totalPossibleSavings = envelopes.reduce((sum, e) => sum + e.value, 0);
  const progressPercentage = totalPossibleEnvelopes > 0 ? (filledCount / totalPossibleEnvelopes) * 100 : 0;
  const isComplete = progressPercentage >= 100;

  const growthStage = useMemo(() => {
    if (isComplete) return { emoji: '🌺', label: 'Fully Bloomed!' };
    if (progressPercentage >= 76) return { emoji: '🌴', label: `${filledCount} of ${totalPossibleEnvelopes} Envelopes Filled` };
    if (progressPercentage >= 51) return { emoji: '🌳', label: `${filledCount} of ${totalPossibleEnvelopes} Envelopes Filled` };
    if (progressPercentage >= 26) return { emoji: '🌿', label: `${filledCount} of ${totalPossibleEnvelopes} Envelopes Filled` };
    return { emoji: '🌱', label: `${filledCount} of ${totalPossibleEnvelopes} Envelopes Filled` };
  }, [progressPercentage, filledCount, totalPossibleEnvelopes, isComplete]);

  return (
    <section 
      className={`
        bg-gradient-to-br from-[#1a3324]/80 to-[#111a14] 
        rounded-[40px] p-8 md:p-10 border border-emerald-400/10 
        relative overflow-hidden transition-all duration-500 shadow-2xl shadow-emerald-900/20 
        ${isComplete ? 'animate-pulse-once' : ''}
      `}
    >
      <div className="flex justify-between items-start mb-10">
        <div>
          <h2 className="text-3xl font-black text-white font-display tracking-tight">🌿 Garden of Savings</h2>
          <p className={`text-sm font-bold mt-2 transition-colors duration-500 ${isComplete ? 'text-amber-300' : 'text-emerald-400/90'}`}>
            {growthStage.label}
          </p>
        </div>
        
        <div 
          className={`
            size-20 bg-emerald-400/5 rounded-[28px] flex items-center justify-center 
            text-5xl shadow-inner border border-emerald-400/10 transition-all duration-500
            ${isComplete ? 'scale-110 rotate-6' : ''}
          `}
        >
          {growthStage.emoji}
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-4 w-full bg-black/20 rounded-full overflow-hidden p-1 border border-white/5">
          <div 
            className={`
              h-full rounded-full transition-all duration-1000 ease-out-expo
              ${isComplete ? 'bg-gradient-to-r from-amber-400 to-rose-400' : 'bg-emerald-400'}
            `}
            style={{ 
              width: `${progressPercentage}%`,
              boxShadow: isComplete ? '0 0 20px rgba(251, 146, 60, 0.6)' : '0 0 15px rgba(48, 232, 110, 0.4)'
            }}
          ></div>
        </div>

        <div className="flex justify-between items-center px-1 pt-2">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Planting</span>
          <span className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em]">
            Goal: {currency}{totalPossibleSavings.toLocaleString()}
          </span>
        </div>
      </div>
      
      <div 
        className={`
          absolute -right-24 -bottom-24 size-64 blur-[100px] pointer-events-none rounded-full transition-all duration-1000
          ${isComplete ? 'bg-amber-400/20' : 'bg-emerald-400/10'}
        `}
      ></div>
    </section>
  );
};

interface EnvelopeGridProps {
  envelopes: Envelope[];
  currency: string;
  toggleEnvelope: (id: number) => void;
}

export const EnvelopeGrid: React.FC<EnvelopeGridProps> = ({ envelopes, currency, toggleEnvelope }) => {
  const completedEnvelopes = envelopes.filter(e => e.completed);
  const totalSaved = completedEnvelopes.reduce((sum, e) => sum + e.value, 0);
  const nextTargetId = envelopes.find(e => !e.completed)?.id;

  return (
    <section className="space-y-10">
      <div className="flex justify-between items-end px-1">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-white font-display">Your Journey</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            {completedEnvelopes.length} milestones reached • <span className="text-emerald-400">{currency}{totalSaved.toLocaleString()}</span> currently locked
          </p>
        </div>
      </div>

      {/* Grid of Envelopes */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 pb-12">
        {envelopes.map(e => {
          const isCompleted = e.completed;
          const isNext = e.id === nextTargetId;
          
          const icon = isCompleted ? 'mail' : 'drafts';
          const iconColorClass = 'text-emerald-400';
          
          const cardBgClass = isCompleted ? 'bg-[#1a3324]' : 'bg-emerald-400/5';
          const cardBorderClass = isCompleted ? 'border-emerald-400' : 'border-emerald-400/20';

          return (
            <button
              key={e.id}
              onClick={() => toggleEnvelope(e.id)}
              className={`relative flex flex-col items-center justify-center gap-3 p-5 rounded-[24px] border-2 transition-all group aspect-square shadow-xl ${cardBgClass} ${cardBorderClass} ${
                isNext ? 'ring-1 ring-emerald-400/40 ring-offset-2 ring-offset-[#080d0a]' : ''
              } hover:-translate-y-1 active:scale-95`}
            >
              <div className="relative">
                <span className={`material-symbols-outlined text-4xl transition-all ${iconColorClass} filled-icon`}>
                  {icon}
                </span>
                
                {/* Every envelope gets a bouncing star */}
                <div className="absolute -top-1 -right-1">
                  <span className="material-symbols-outlined text-emerald-400 text-xs animate-bounce">star</span>
                </div>
                
                {isCompleted && (
                  <>
                    {/* Tick icon */}
                    <div className="absolute -top-1 -right-4 bg-emerald-400 rounded-full p-0.5 border-2 border-[#1a3324] z-10">
                      <span className="material-symbols-outlined text-[10px] text-[#080d0a] font-black leading-none">check</span>
                    </div>
                    {/* Leaf icon */}
                    <div className="absolute -bottom-2 -right-3">
                      <span className="material-symbols-outlined text-emerald-400 text-lg filled-icon animate-pulse">eco</span>
                    </div>
                  </>
                )}

                {isNext && !isCompleted && (
                  <div className="absolute -bottom-2 -right-2">
                    <span className="material-symbols-outlined text-emerald-400 text-sm filled-icon animate-bounce">arrow_drop_down</span>
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className={`text-[10px] font-black uppercase tracking-tighter text-emerald-400`}>
                  Lvl {e.id}: {currency}{e.value}
                </p>
              </div>
            </button>
          );
        })}

        <button className="relative flex flex-col items-center justify-center gap-2 p-5 rounded-[24px] border-2 border-emerald-400/20 border-dashed bg-emerald-400/5 hover:bg-emerald-400/10 transition-all group aspect-square">
          <div className="size-10 rounded-full border-2 border-emerald-400 flex items-center justify-center text-emerald-400">
            <span className="material-symbols-outlined font-black">add</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">More...</p>
        </button>
      </div>
    </section>
  );
};
