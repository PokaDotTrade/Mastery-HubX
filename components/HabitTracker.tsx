
import React, { useState, useMemo } from 'react';
import { Win } from '../types';

interface HabitTrackerProps {
  habits: Win[];
  onAddHabit: (habit: Omit<Win, 'id' | 'completed' | 'streak'>) => void;
  onToggleHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
}

const PREDEFINED_ICONS = [
  'bolt', 'water_drop', 'self_improvement', 'fitness_center', 'edit_note', 'menu_book'
];

const DAYS_SHORT = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const HabitTracker: React.FC<HabitTrackerProps> = ({ habits, onAddHabit, onToggleHabit, onDeleteHabit }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(PREDEFINED_ICONS[0]);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const currentDayProgress = useMemo(() => {
    if (habits.length === 0) return 0;
    const completedCount = habits.filter(h => h.completed).length;
    return (completedCount / habits.length) * 100;
  }, [habits]);

  const weekData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();

    return DAYS_SHORT.map((day, idx) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (dayOfWeek - idx));
      const dateStr = date.toISOString().split('T')[0];

      let completedCount = 0;
      let totalCount = habits.length;

      if (date <= today) {
        if (date.getTime() === today.getTime()) {
          completedCount = habits.filter(h => h.completed).length;
        } else {
          completedCount = habits.filter(h => (h.completionHistory || []).includes(dateStr)).length;
        }
      } else {
        totalCount = 0;
      }
      
      const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
      
      return {
        day,
        date: date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }).replace('/', '.'),
        progress,
        completed: completedCount,
        total: totalCount,
        isToday: idx === dayOfWeek
      };
    });
  }, [habits]);

  const weeklyAverage = useMemo(() => {
    const todayIndex = new Date().getDay();
    const relevantDays = weekData.slice(0, todayIndex + 1);
    if (relevantDays.length === 0) return 0;
    const relevantSum = relevantDays.reduce((acc, d) => acc + d.progress, 0);
    return Math.round(relevantSum / relevantDays.length);
  }, [weekData]);
  
  const bestHabitOfTheWeek = useMemo(() => {
    if (habits.length === 0) return null;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    let bestHabit: Win | null = null;
    let maxCount = 0;

    for (const habit of habits) {
      const recentCompletions = (habit.completionHistory || [])
        .filter(dateStr => dateStr >= sevenDaysAgoStr);
      
      if (recentCompletions.length > maxCount) {
        maxCount = recentCompletions.length;
        bestHabit = habit;
      }
    }
    
    return maxCount > 0 ? { ...bestHabit, count: maxCount } : null;
  }, [habits]);

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    onAddHabit({
      label: newLabel,
      icon: selectedIcon,
      color: 'emerald'
    });
    setNewLabel('');
    setSelectedIcon(PREDEFINED_ICONS[0]);
    setIsAdding(false);
  };

  return (
    <div className="space-y-10 pt-4 animate-fade-in-up">
      <section className="bg-[#121814] rounded-[40px] p-8 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden glass hover:scale-[1.03] active:scale-[0.98]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10 md:gap-16">
          <div className="flex-1 w-full space-y-6">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-center md:text-left">Daily Progress</p>
            <div className="flex items-end justify-between gap-3 h-28 max-w-sm px-2">
              {weekData.map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
                  <div className="w-full bg-white/5 rounded-md relative h-full overflow-hidden">
                    <div 
                      className={`absolute bottom-0 w-full transition-all duration-1000 ease-out rounded-t-sm ${data.isToday ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-slate-700/40'}`}
                      style={{ height: `${Math.max(data.progress > 0 ? 6 : 0, data.progress)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setIsStatusModalOpen(true)}
            className="shrink-0 flex flex-col items-center gap-6 group cursor-pointer"
          >
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] group-hover:text-orange-400 transition-colors">Weekly Average</p>
            <div className="relative size-36 flex items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 144 144">
                <circle cx="72" cy="72" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                <circle 
                  cx="72" cy="72" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  strokeDasharray={377} strokeDashoffset={377 - (377 * weeklyAverage) / 100}
                  className="text-slate-700 group-hover:text-orange-400 transition-colors duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="size-24 rounded-full bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center shadow-inner">
                    <span className="text-4xl font-black text-white">{weeklyAverage}%</span>
                 </div>
              </div>
            </div>
          </button>

          <button onClick={() => setIsStatusModalOpen(true)} className="hidden lg:flex items-center gap-4 bg-white/5 p-4 pr-6 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors">
             <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <span className="material-symbols-outlined filled-icon">local_fire_department</span>
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Status</p>
                <p className="text-sm font-black text-white">Daily</p>
             </div>
          </button>
        </div>
      </section>

      <section className="relative -mx-5 px-5">
        <div className="scroll-chassis gap-4">
          {weekData.map((data, i) => (
            <div 
              key={i} 
              className={`min-w-[170px] flex-shrink-0 bg-[#121814] rounded-[36px] p-6 flex flex-col items-center gap-5 border transition-all duration-200 scroll-snap-align-start hover:scale-[1.03] active:scale-[0.98] animate-fade-in-up ${
                data.isToday 
                ? 'border-emerald-500 shadow-[0_0_40px_rgba(48,232,110,0.1)] z-10 mx-1' 
                : 'border-white/5 opacity-40 hover:opacity-100'
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="text-center space-y-1">
                <h4 className={`text-base font-black uppercase tracking-[0.1em] ${data.isToday ? 'text-emerald-400' : 'text-slate-200'}`}>{data.day}</h4>
                <p className="text-[10px] font-bold text-slate-500">{data.date}</p>
              </div>

              <div className="relative size-24 flex items-center justify-center">
                <svg className="size-full -rotate-90" viewBox="0 0 112 112">
                  <circle cx="56" cy="56" r="45" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                  <circle 
                    cx="56" cy="56" r="45" stroke="currentColor" strokeWidth="8" fill="transparent" 
                    strokeDasharray={283} strokeDashoffset={283 - (283 * data.progress) / 100}
                    className="text-orange-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-black text-white">{Math.round(data.progress)}%</span>
                </div>
              </div>

              <div className="text-center">
                 <p className="text-xl font-black text-orange-500 leading-none">
                   {data.completed}<span className="text-slate-700 text-xs mx-1">/</span><span className="text-slate-600 text-xs">{data.total}</span>
                 </p>
                 <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mt-1">Wins</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-8 pb-12">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Protocol Management</h2>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-400/10 text-emerald-400 rounded-2xl border border-emerald-400/20 text-[10px] font-black uppercase tracking-widest hover:scale-[1.03] active:scale-[0.98] transition-all shadow-xl shadow-emerald-400/5"
          >
            <span className="material-symbols-outlined text-lg">{isAdding ? 'close' : 'add'}</span>
            {isAdding ? 'Abort' : 'New Habit'}
          </button>
        </div>

        {isAdding && (
          <div className="glass p-10 rounded-[40px] border-emerald-400/20 animate-fade-in-up shadow-2xl mb-10 hover:scale-[1.03] active:scale-[0.98]">
            <div className="max-w-xl mx-auto space-y-8">
              <div className="space-y-3 text-center">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Establish New Objective</label>
                <input 
                  type="text" 
                  placeholder="e.g. 5am High-Performance Block"
                  className="w-full bg-[#0d120f] border-white/5 rounded-2xl p-6 text-lg font-black text-center focus:ring-1 focus:ring-emerald-400 outline-none text-slate-100 placeholder:text-slate-800"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-4 justify-center">
                {PREDEFINED_ICONS.map(icon => (
                  <button 
                    key={icon} 
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={`size-14 rounded-2xl border transition-all flex items-center justify-center hover:scale-[1.03] active:scale-[0.98] ${selectedIcon === icon ? 'bg-emerald-400 text-[#080d0a] border-emerald-400 shadow-lg shadow-emerald-400/20' : 'bg-white/5 border-white/5 text-slate-500 hover:text-emerald-400'}`}
                  >
                    <span className="material-symbols-outlined">{icon}</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={handleAdd}
                className="w-full py-5 bg-emerald-400 text-[#080d0a] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-400/20 active:scale-[0.98] transition-all hover:scale-[1.03]"
              >
                Archive to Permanent Ledger
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {habits.map((habit, index) => (
            <div 
              key={habit.id} 
              className={`bg-[#121814] border border-white/5 p-8 rounded-[36px] flex items-center justify-between transition-all duration-200 group hover:border-emerald-400/30 hover:scale-[1.03] active:scale-[0.98] animate-fade-in-up ${habit.completed ? 'opacity-40 shadow-none' : 'shadow-xl'}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-6">
                <div className={`size-16 rounded-[24px] flex items-center justify-center transition-all bg-emerald-400/10 text-emerald-400 border border-emerald-400/10 group-hover:scale-110`}>
                   <span className={`material-symbols-outlined text-4xl ${habit.completed ? 'filled-icon' : ''}`}>{habit.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">{habit.label}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="size-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Streak: {habit.streak} Days</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => onDeleteHabit(habit.id)}
                  className="size-12 rounded-2xl bg-white/5 text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 transition-all flex items-center justify-center hover:scale-[1.03] active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
                <button 
                  onClick={() => onToggleHabit(habit.id)}
                  className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-xl hover:scale-[1.03] ${
                    habit.completed 
                    ? 'bg-emerald-400 text-[#080d0a] shadow-emerald-400/20' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {habit.completed ? 'Mission Success' : 'Execute Mission'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isStatusModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsStatusModalOpen(false)}>
          <div className="w-full max-w-md bg-[#111a14] border border-orange-500/20 rounded-[40px] shadow-2xl p-10 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="text-center space-y-8">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">📊 Today’s Progress</p>
                <h2 className="text-6xl font-black font-display tracking-tighter text-orange-400">{Math.round(currentDayProgress)}%</h2>
              </div>
              <div className="h-px bg-white/10 w-2/3 mx-auto"></div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">🏆 Best Habit This Week</p>
                {bestHabitOfTheWeek ? (
                  <div className="flex items-center justify-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="material-symbols-outlined text-emerald-400 text-2xl">{bestHabitOfTheWeek.icon}</span>
                    <h3 className="text-xl font-black text-white">{bestHabitOfTheWeek.label}</h3>
                    <span className="text-xs font-bold text-slate-500">({bestHabitOfTheWeek.count} times)</span>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 italic">No habits executed this week.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitTracker;
