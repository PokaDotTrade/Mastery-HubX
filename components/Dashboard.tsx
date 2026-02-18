
import React, { useState, useMemo, useEffect } from 'react';
import { Win, MasteryHabit, FutureLetter, TradingAccount, Trade, ScheduleTask, Devotion } from '../types.ts';
import { DEVOTIONS } from '../constants.tsx';
import VoiceButton from './VoiceButton.tsx';

interface DashboardProps {
  wins: Win[];
  toggleWin: (id: string) => void;
  habits: MasteryHabit[];
  incrementMasteryHabit: (id: string) => void;
  updateMasteryHabit: (id: string, updates: Partial<MasteryHabit>) => void;
  coachMessage: string;
  letters: FutureLetter[];
  accounts: TradingAccount[];
  trades: Trade[];
  tasks: ScheduleTask[];
  currency: string;
  heartedScriptures: Devotion[];
  onToggleHeart: (devotion: Devotion) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  wins, toggleWin, habits, incrementMasteryHabit, updateMasteryHabit, coachMessage,
  letters, accounts, trades, tasks, currency, heartedScriptures, onToggleHeart
}) => {
  const completedCount = wins.filter(w => w.completed).length;
  const [editingHabit, setEditingHabit] = useState<MasteryHabit | null>(null);
  const [subjectInput, setSubjectInput] = useState('');
  const [durationInput, setDurationInput] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const dailyDevotion = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return DEVOTIONS[dayOfYear % DEVOTIONS.length];
  }, []);

  const isHearted = useMemo(() => {
    return heartedScriptures.some(s => s.ref === dailyDevotion.ref);
  }, [heartedScriptures, dailyDevotion]);

  const upcomingLetter = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return letters.find(l => {
      const unlock = new Date(l.unlockDate);
      unlock.setHours(0, 0, 0, 0);
      const diffTime = unlock.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays === 5;
    });
  }, [letters]);

  const agendaHighlight = useMemo(() => {
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const mins = currentTime.getMinutes().toString().padStart(2, '0');
    const nowStr = `${hours}:${mins}`;

    const active = tasks.find(t => 
      !t.completed && 
      t.timeStart <= nowStr && 
      (t.timeEnd ? t.timeEnd > nowStr : true && t.timeStart === nowStr)
    );

    const upcoming = tasks
      .filter(t => !t.completed && t.timeStart > nowStr)
      .sort((a, b) => a.timeStart.localeCompare(b.timeStart))[0];

    let timeUntilNext = "";
    if (upcoming) {
      const [uH, uM] = upcoming.timeStart.split(':').map(Number);
      const [cH, cM] = [currentTime.getHours(), currentTime.getMinutes()];
      const diffMin = (uH * 60 + uM) - (cH * 60 + cM);
      const h = Math.floor(diffMin / 60);
      const m = diffMin % 60;
      timeUntilNext = h > 0 ? `${h}h ${m}m` : `${m}m`;
    }

    return { active, upcoming, timeUntilNext };
  }, [tasks, currentTime]);

  const accountStats = useMemo(() => {
    return accounts.map(acc => {
      const accTrades = trades.filter(t => t.accountId === acc.id);
      const winCount = accTrades.filter(t => t.pnl > 0).length;
      const totalTrades = accTrades.length;
      const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
      const totalPnL = accTrades.reduce((s, t) => s + t.pnl, 0);
      
      const initialBalance = acc.initialPhaseBalance || (acc.balance - totalPnL);
      const targetProfitPct = acc.targetProfitPct || 10;
      const targetAmount = initialBalance * (1 + targetProfitPct / 100);
      const progress = Math.min(100, Math.max(0, (totalPnL / (targetAmount - initialBalance)) * 100));

      return {
        ...acc,
        winRate,
        netProfit: totalPnL,
        progress,
        tradeCount: totalTrades
      };
    }).sort((a, b) => b.netProfit - a.netProfit);
  }, [accounts, trades]);

  const getIconColorClasses = (color: string) => {
    const themeColors: Record<string, string> = {
      blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      orange: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
      emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
      purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    };
    return themeColors[color] || 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
  };

  const handleEditClick = (e: React.MouseEvent, habit: MasteryHabit) => {
    e.stopPropagation();
    setEditingHabit(habit);
    setSubjectInput(habit.subject || '');
    setDurationInput(habit.duration?.toString() || '45');
  };

  const handleSaveEdit = () => {
    if (editingHabit) {
      updateMasteryHabit(editingHabit.id, {
        subject: subjectInput,
        duration: parseInt(durationInput) || 45
      });
      setEditingHabit(null);
    }
  };

  return (
    <div className="space-y-12 pt-4">
      {upcomingLetter && (
        <section className="animate-fade-in-up">
           <div className="relative group overflow-hidden glass border-amber-400/30 rounded-3xl p-5 flex items-center gap-6 shadow-[0_0_30px_rgba(251,191,36,0.1)] hover:scale-[1.03] active:scale-[0.98]">
              <div className="absolute inset-0 bg-amber-400/[0.03] animate-pulse"></div>
              <div className="size-12 bg-amber-400/20 rounded-2xl flex items-center justify-center text-amber-400 shrink-0">
                 <span className="material-symbols-outlined filled-icon animate-bounce">history_edu</span>
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-0.5">Temporal Awareness Active</p>
                 <h4 className="text-sm font-bold text-white truncate">Your Future Letter unlocks in 5 days.</h4>
              </div>
              <div className="text-right shrink-0">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md border border-white/5">T-Minus 120h</span>
              </div>
           </div>
        </section>
      )}

      <section className="relative overflow-hidden group animate-fade-in-up">
        <div className="absolute inset-0 bg-amber-500/5 blur-3xl opacity-30 pointer-events-none"></div>
        <div className="relative glass border-amber-500/10 rounded-[48px] p-10 lg:p-14 flex flex-col items-center text-center gap-10 shadow-[0_40px_80px_rgba(251,191,36,0.05)] hover:scale-[1.03] active:scale-[0.98]">
          <button 
            onClick={() => onToggleHeart(dailyDevotion)}
            className="absolute top-10 right-10 size-12 glass rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group/heart"
          >
             <span className={`material-symbols-outlined text-2xl transition-colors ${isHearted ? 'text-rose-500 filled-icon' : 'text-slate-600 group-hover/heart:text-rose-400'}`}>
                favorite
             </span>
          </button>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-amber-500/20"></div>
              <span className="text-[11px] font-black text-amber-500 uppercase tracking-[0.4em]">Daily Devotions</span>
              <div className="h-px w-8 bg-amber-500/20"></div>
            </div>
          </div>

          <div className="max-w-3xl space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-black font-display tracking-tight text-white leading-tight">
                {dailyDevotion.ref}
              </h2>
              <p className="text-xl lg:text-2xl font-bold text-slate-200 italic leading-relaxed">
                "{dailyDevotion.verse}"
              </p>
            </div>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent mx-auto"></div>
            <p className="text-base lg:text-lg text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
              {dailyDevotion.reflection}
            </p>
          </div>

          <div className="flex items-center gap-6 opacity-40">
             <span className="material-symbols-outlined text-amber-500/40">auto_awesome</span>
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.6em]">Grounded. Safe. Uplifting.</p>
             <span className="material-symbols-outlined text-amber-500/40">auto_awesome</span>
          </div>
        </div>
      </section>

      <section className="animate-fade-in-up">
        <div className="flex justify-between items-center mb-6 px-1">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Daily Agenda Highlight</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
          </div>
        </div>

        {tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`glass p-8 rounded-[40px] border-white/5 relative overflow-hidden group min-h-[160px] flex flex-col justify-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] ${agendaHighlight.active ? 'border-emerald-400/30 shadow-[0_0_40px_rgba(48,232,110,0.05)]' : 'opacity-40 grayscale'}`}>
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <span className={`material-symbols-outlined text-5xl ${agendaHighlight.active ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}`}>timer_play</span>
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Status: Currently Active</p>
              {agendaHighlight.active ? (
                <div>
                  <h3 className="text-3xl font-black text-white tracking-tight leading-tight">{agendaHighlight.active.title}</h3>
                  <div className="flex items-center gap-3 mt-4">
                     <span className="px-3 py-1 bg-emerald-400/10 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-400/20">Active Now</span>
                     <span className="text-[11px] font-black text-slate-500 uppercase">{agendaHighlight.active.timeStart} {agendaHighlight.active.timeEnd ? `- ${agendaHighlight.active.timeEnd}` : ''}</span>
                  </div>
                </div>
              ) : (
                <h3 className="text-xl font-black text-slate-600 tracking-tight uppercase">No active mission</h3>
              )}
            </div>

            <div className={`glass p-8 rounded-[40px] border-white/5 relative overflow-hidden group min-h-[160px] flex flex-col justify-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] ${agendaHighlight.upcoming ? '' : 'opacity-40 grayscale'}`}>
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <span className="material-symbols-outlined text-5xl text-blue-500">upcoming</span>
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Protocol: Upcoming Next</p>
              {agendaHighlight.upcoming ? (
                <div>
                  <h3 className="text-3xl font-black text-white tracking-tight leading-tight">{agendaHighlight.upcoming.title}</h3>
                  <div className="flex items-center gap-3 mt-4">
                     <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-400/20">In {agendaHighlight.timeUntilNext}</span>
                     <span className="text-[11px] font-black text-slate-500 uppercase">Start: {agendaHighlight.upcoming.timeStart}</span>
                  </div>
                </div>
              ) : (
                <h3 className="text-xl font-black text-slate-600 tracking-tight uppercase">No upcoming tasks today</h3>
              )}
            </div>
          </div>
        ) : (
          <div className="py-12 glass rounded-[40px] border-dashed border-white/5 flex flex-col items-center justify-center bg-white/[0.01] hover:scale-[1.03] active:scale-[0.98]">
            <span className="material-symbols-outlined text-4xl text-slate-700 mb-2">event_busy</span>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">No agenda items today</p>
          </div>
        )}
      </section>

      <section className="animate-fade-in-up">
        <div className="flex justify-between items-center mb-6 px-1">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Global Trading Intelligence</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-lg border border-emerald-400/10 uppercase tracking-widest">Active Archives</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accountStats.map(acc => {
             const isPositive = acc.netProfit >= 0;
             return (
               <div key={acc.id} className={`glass p-8 rounded-[40px] border-white/5 relative overflow-hidden group transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] ${isPositive ? 'hover:shadow-[0_20px_40px_rgba(48,232,110,0.08)]' : 'hover:shadow-[0_20px_40px_rgba(244,63,94,0.08)]'}`}>
                  <div className={`absolute top-0 right-0 size-32 blur-[60px] opacity-10 transition-opacity group-hover:opacity-30 ${isPositive ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  <div className="flex justify-between items-start mb-10 relative">
                     <div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${acc.type === 'Prop Firm' ? 'bg-blue-500/20 text-blue-400 border border-blue-400/10' : 'bg-white/5 text-slate-400 border border-white/5'}`}>{acc.type}</span>
                        <h3 className="text-2xl font-black mt-3 text-white tracking-tight font-display group-hover:text-emerald-400 transition-colors">{acc.name}</h3>
                     </div>
                     <div className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`material-symbols-outlined text-3xl ${isPositive ? 'text-emerald-400' : 'text-rose-500'}`}>
                              {isPositive ? 'trending_up' : 'trending_down'}
                          </span>
                          <p className={`text-3xl font-black tracking-tighter ${isPositive ? 'text-emerald-400' : 'text-rose-500'}`}>
                              {acc.currency}{Math.abs(acc.netProfit).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Global P&L Data</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6 mb-10 relative">
                     <div className="space-y-1">
                        <p className="text-xs font-black text-white">{acc.winRate.toFixed(1)}%</p>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">Win Rate</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-xs font-black text-white">{acc.tradeCount}</p>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">Executions</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-xs font-black text-white">{acc.currency}{acc.balance.toLocaleString()}</p>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">Net Equity</p>
                     </div>
                  </div>
                  <div className="space-y-3 relative">
                     <div className="flex justify-between items-end">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Objective Progression</p>
                        <span className="text-[9px] font-black text-white">{acc.progress.toFixed(1)}%</span>
                     </div>
                     <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${isPositive ? 'bg-emerald-400 shadow-[0_0_10px_rgba(48,232,110,0.4)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]'}`} 
                          style={{ width: `${acc.progress}%` }}
                        />
                     </div>
                  </div>
               </div>
             );
          })}
        </div>
      </section>

      <div className="lg:grid lg:grid-cols-12 lg:gap-10 space-y-12 lg:space-y-0">
        <section className="lg:col-span-7">
          <div className="flex justify-between items-center mb-6 px-1">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Today's Operating Wins</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-4 py-1.5 rounded-xl border border-emerald-400/10 uppercase tracking-widest">
                {completedCount} / {wins.length} Done
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            {wins.map((win, index) => {
              const iconColorClass = getIconColorClasses(win.color);
              return (
                <button
                  key={win.id}
                  onClick={() => toggleWin(win.id)}
                  className={`flex flex-col items-start gap-4 p-6 rounded-[32px] border transition-all duration-200 animate-fade-in-up text-left group relative overflow-hidden hover:scale-[1.03] active:scale-[0.98] ${
                    win.completed 
                    ? 'bg-emerald-400/10 border-emerald-400/40 text-emerald-400 shadow-[0_0_20px_rgba(48,232,110,0.05)]' 
                    : 'bg-white/[0.02] border-white/5 text-slate-300 hover:border-white/10'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`p-3 rounded-2xl border transition-all duration-500 group-hover:scale-110 ${iconColorClass}`}>
                    {win.customIcon ? (
                      <img src={win.customIcon} alt="" className="size-6 object-contain" />
                    ) : (
                      <span className={`material-symbols-outlined text-2xl ${win.completed ? 'filled-icon' : ''}`} style={{ fontVariationSettings: win.completed ? "'FILL' 1" : "" }}>
                        {win.icon}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className={`text-sm font-black uppercase tracking-[0.15em] ${win.completed ? 'text-emerald-400' : 'text-slate-200'}`}>{win.label}</span>
                    <p className="text-[10px] opacity-50 font-bold mt-1 tracking-wide">{win.completed ? 'Mission Archived' : 'Awaiting Data'}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-5">
          <div className="flex justify-between items-center mb-6 px-1">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Mastery Blocks</h2>
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest bg-blue-400/10 px-3 py-1 rounded-lg">High Value Sessions</p>
          </div>
          <div className="grid gap-5">
            {habits.map((habit, index) => (
              <button 
                key={habit.id} 
                onClick={() => incrementMasteryHabit(habit.id)}
                className="w-full p-7 rounded-[32px] glass group hover:scale-[1.03] active:scale-[0.98] transition-all text-left relative border-white/5 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`size-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${habit.color === 'blue' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/10' : 'bg-amber-500/10 text-amber-500 border border-amber-500/10'}`}>
                      <span className="material-symbols-outlined text-3xl filled-icon">{habit.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-black tracking-tight flex items-center gap-2 text-white">
                        {habit.label}
                        <span onClick={(e) => handleEditClick(e, habit)} className="material-symbols-outlined text-slate-600 text-sm hover:text-emerald-400 cursor-pointer transition-colors p-1">settings</span>
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {habit.subject ? (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-emerald-400/20 text-emerald-400 tracking-widest uppercase truncate max-w-[120px]">
                            {habit.subject}
                          </span>
                        ) : (
                          <span onClick={(e) => handleEditClick(e, habit)} className="text-[8px] font-black px-2 py-0.5 rounded-md bg-white/5 text-slate-500 tracking-widest uppercase hover:text-emerald-400 transition-colors">Target Subject</span>
                        )}
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-white/5 text-slate-600 tracking-widest uppercase">
                          {habit.duration}m Blocks
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-2xl font-black ${habit.color === 'blue' ? 'text-blue-500' : 'text-amber-500'}`}>
                      {habit.progress}<span className="text-slate-800 mx-1 text-lg">/</span>{habit.total}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  {[...Array(habit.total)].map((_, i) => (
                    <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-700 ${i < habit.progress ? (habit.color === 'blue' ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]' : 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]') : 'bg-white/5'}`}></div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {editingHabit && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setEditingHabit(null)}>
          <div className="w-full max-w-md bg-[#111a14] border border-white/10 rounded-[40px] shadow-2xl p-10 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black font-display tracking-tight text-white">Mission Briefing</h2>
              <button onClick={() => setEditingHabit(null)} className="size-10 glass rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Target Skill Area</label>
                <input 
                  type="text" 
                  placeholder="e.g. System Architecture, Market Analysis..." 
                  value={subjectInput} 
                  onChange={(e) => setSubjectInput(e.target.value)} 
                  className="w-full glass border-none rounded-2xl p-5 text-sm font-bold focus:ring-1 focus:ring-emerald-400 outline-none placeholder:text-slate-800 text-slate-100 bg-transparent" 
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Block Duration (m)</label>
                <input 
                  type="number" 
                  placeholder="45" 
                  value={durationInput} 
                  onChange={(e) => setDurationInput(e.target.value)} 
                  className="w-full glass border-none rounded-2xl p-5 text-sm font-bold focus:ring-1 focus:ring-emerald-400 outline-none text-slate-100 placeholder:text-slate-800 bg-transparent" 
                />
              </div>

              <button 
                onClick={handleSaveEdit}
                className="w-full py-5 bg-emerald-400 text-[#080d0a] font-black uppercase tracking-[0.2em] rounded-2xl active:scale-[0.98] transition-all shadow-2xl shadow-emerald-400/20"
              >
                Update Mastery Focus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
