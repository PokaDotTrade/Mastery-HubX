
import React, { useState, useMemo } from 'react';
import { ScheduleTask, Priority } from '../types';

interface SchedulePlannerProps {
  tasks: ScheduleTask[];
  onToggleTask: (id: string) => void;
  onAddTask: (task: ScheduleTask) => void;
  onDeleteTask: (id: string) => void;
}

const SchedulePlanner: React.FC<SchedulePlannerProps> = ({ tasks, onToggleTask, onAddTask, onDeleteTask }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('General');
  
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const priorityOrder: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

  // Generate 14 days around today for the calendar strip
  const calendarDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    for (let i = -2; i < 12; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      dates.push({
        fullDate: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday: d.toISOString().split('T')[0] === today.toISOString().split('T')[0]
      });
    }
    return dates;
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => (t.date || new Date().toISOString().split('T')[0]) === selectedDate)
      .sort((a, b) => {
        if (a.timeStart !== b.timeStart) return a.timeStart.localeCompare(b.timeStart);
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }, [tasks, selectedDate]);

  const datesWithTasks = useMemo(() => {
    const set = new Set();
    tasks.forEach(t => set.add(t.date || new Date().toISOString().split('T')[0]));
    return set;
  }, [tasks]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    onAddTask({
      id: Date.now().toString(),
      title,
      timeStart: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      priority,
      completed: false,
      category: category || 'General',
      date: selectedDate
    });
    setTitle('');
    setTime('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-12 pt-4 animate-fade-in-up">
      
      {/* Visual Reference Calendar Strip */}
      <section className="relative -mx-5 px-5">
        <div className="scroll-chassis gap-4 pb-8 no-scrollbar">
          {calendarDates.map((d, i) => {
            const isSelected = d.fullDate === selectedDate;
            const hasTask = datesWithTasks.has(d.fullDate);
            
            return (
              <button
                key={d.fullDate}
                onClick={() => setSelectedDate(d.fullDate)}
                className={`min-w-[85px] py-6 rounded-[28px] flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative border-2 hover:scale-105 animate-fade-in-up ${
                  isSelected 
                  ? 'bg-[#30e86e] border-[#30e86e] text-[#080d0a] shadow-[0_0_30px_rgba(48,232,110,0.4)] scale-105 z-10' 
                  : 'bg-[#111a14] border-white/5 text-slate-500 hover:border-white/10'
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className={`text-[10px] font-black tracking-widest ${isSelected ? 'text-[#080d0a]/60' : 'text-slate-600'}`}>
                  {d.dayName}
                </span>
                <span className={`text-3xl font-black tracking-tighter ${isSelected ? 'text-[#080d0a]' : 'text-slate-200'}`}>
                  {d.dayNum}
                </span>
                <span className={`text-[10px] font-black ${isSelected ? 'text-[#080d0a]/60' : 'text-slate-600'}`}>
                  {d.monthName}
                </span>
                
                {/* Visual Reward: Task Indicator */}
                {hasTask && (
                  <div className={`absolute bottom-3 size-1.5 rounded-full ${isSelected ? 'bg-[#080d0a]/30' : 'bg-[#30e86e]/40'}`}></div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Header & Add Button */}
      <section>
        <div className="flex justify-between items-center mb-8 px-1">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Daily Protocol</h2>
            <p className="text-lg font-black text-white mt-1">
              {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-3 px-6 py-3 bg-emerald-400 text-[#080d0a] rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-400/20 hover:scale-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-xl">{isAdding ? 'close' : 'add'}</span>
            {isAdding ? 'Abort' : 'New Mission'}
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleAdd} className="glass p-10 rounded-[40px] border-emerald-400/20 mb-12 space-y-8 animate-fade-in-up">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Objective Title</label>
              <input 
                type="text" 
                placeholder="What is the mission?"
                className="w-full glass border-none rounded-2xl p-5 text-base font-bold focus:ring-1 focus:ring-emerald-400 outline-none text-slate-100 placeholder:text-slate-800 bg-transparent"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Criticality</label>
                <div className="flex p-1 bg-white/5 rounded-2xl gap-1">
                  {(['urgent', 'high', 'medium', 'low'] as Priority[]).map(p => (
                    <button 
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                        priority === p 
                        ? (p === 'urgent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/10' : p === 'high' ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/10' : 'bg-emerald-400 text-black shadow-lg shadow-emerald-400/10') 
                        : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Time</label>
                <input 
                  type="time" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full glass border-none rounded-2xl p-5 text-base font-bold focus:ring-1 focus:ring-emerald-400 outline-none text-slate-200 appearance-none bg-transparent"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-6 bg-emerald-400 text-[#080d0a] font-black uppercase tracking-[0.3em] rounded-3xl shadow-2xl shadow-emerald-400/30 active:scale-95 transition-all hover:scale-[1.01]"
            >
              Archive Mission
            </button>
          </form>
        )}
      </section>

      {/* Task List with Enhanced ADHD-Friendly Styling */}
      <section className="space-y-10">
        {(['urgent', 'high', 'medium', 'low'] as Priority[]).map(pGroup => {
          const groupTasks = filteredTasks.filter(t => t.priority === pGroup);
          if (groupTasks.length === 0) return null;

          return (
            <div key={pGroup} className="space-y-6">
              <div className="flex items-center gap-4 px-1">
                <div className={`h-[1px] flex-1 ${
                  pGroup === 'urgent' ? 'bg-rose-500/30' : 
                  pGroup === 'high' ? 'bg-amber-400/30' : 
                  pGroup === 'medium' ? 'bg-blue-400/30' : 'bg-slate-700/30'
                }`}></div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">{pGroup} Sector</h3>
                <div className={`h-[1px] flex-1 ${
                  pGroup === 'urgent' ? 'bg-rose-500/30' : 
                  pGroup === 'high' ? 'bg-amber-400/30' : 
                  pGroup === 'medium' ? 'bg-blue-400/30' : 'bg-slate-700/30'
                }`}></div>
              </div>
              
              <div className="space-y-4">
                {groupTasks.map((task, index) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onToggle={() => onToggleTask(task.id)} 
                    onDelete={() => onDeleteTask(task.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="py-32 flex flex-col items-center justify-center opacity-30 animate-fade-in-up">
            <div className="size-24 rounded-full border-4 border-dashed border-white/10 flex items-center justify-center mb-6">
               <span className="material-symbols-outlined text-5xl">event_available</span>
            </div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-center">No agenda items for this day.</p>
            <p className="text-[10px] font-medium text-slate-500 mt-2">The desk is clear. Enjoy the focus.</p>
          </div>
        )}
      </section>
    </div>
  );
};

const TaskCard: React.FC<{ task: ScheduleTask, onToggle: () => void, onDelete: () => void }> = ({ task, onToggle, onDelete }) => {
  const isUrgent = task.priority === 'urgent';
  
  return (
    <div className={`group relative glass rounded-[36px] p-8 flex items-center justify-between border-white/5 transition-all hover:border-white/10 hover:scale-[1.01] animate-fade-in-up ${task.completed ? 'opacity-30 grayscale blur-[0.5px]' : 'hover:translate-x-1'}`}>
      {isUrgent && !task.completed && (
        <div className="absolute inset-0 bg-rose-500/[0.03] rounded-[36px] animate-pulse pointer-events-none"></div>
      )}
      
      <div className="flex items-center gap-8 relative z-10">
        <button 
          onClick={onToggle}
          className={`size-14 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 ${
            task.completed ? 'bg-emerald-400 text-[#080d0a] shadow-lg shadow-emerald-400/20' : 'bg-white/5 text-slate-600 hover:text-emerald-400'
          }`}
        >
          <span className="material-symbols-outlined font-black text-2xl">
            {task.completed ? 'done_all' : 'circle'}
          </span>
        </button>
        
        <div>
          <div className="flex items-center gap-4">
            <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${
              task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-500' :
              task.priority === 'high' ? 'bg-amber-400/20 text-amber-400' : 'bg-emerald-400/10 text-emerald-400'
            }`}>
              {task.timeStart}
            </span>
            <p className={`text-xl font-black tracking-tight group-hover:text-emerald-400 transition-colors ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
              {task.title}
            </p>
          </div>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mt-2 ml-1">{task.category}</p>
        </div>
      </div>

      <button 
        onClick={onDelete}
        className="size-12 rounded-2xl bg-white/5 text-slate-700 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/10 hover:text-rose-500 flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-2xl">delete</span>
      </button>
    </div>
  );
};

export default SchedulePlanner;
