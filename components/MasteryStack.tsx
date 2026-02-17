
import React, { useState, useMemo } from 'react';
import { Skill, PracticeEntry } from '../types';

interface MasteryStackProps {
  skills: Skill[];
  onAddSkill: (skill: Skill) => void;
  onUpdateSkill: (id: string, updates: Partial<Skill>) => void;
  onDeleteSkill: (id: string) => void;
  onAddPracticeEntry: (skillId: string, entry: PracticeEntry) => void;
}

const PREDEFINED_ICONS = ['monitoring', 'architecture', 'security', 'psychology', 'menu_book', 'bolt', 'terminal', 'payments'];
const COLOR_PALETTE = [
  { key: 'primary', hex: '#30e86e', bg: 'bg-emerald-400/10', text: 'text-emerald-400', border: 'border-emerald-400/20' },
  { key: 'emerald', hex: '#3b82f6', bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
  { key: 'amber', hex: '#fbbf24', bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' }
];

const MasteryStack: React.FC<MasteryStackProps> = ({ skills, onAddSkill, onUpdateSkill, onDeleteSkill, onAddPracticeEntry }) => {
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [deleteSkillConfirmId, setDeleteSkillConfirmId] = useState<string | null>(null);

  // New Skill Form State
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillIcon, setNewSkillIcon] = useState(PREDEFINED_ICONS[0]);
  const [newSkillColor, setNewSkillColor] = useState(COLOR_PALETTE[0].key);
  const [newSkillGoal, setNewSkillGoal] = useState('');
  const [newSkillTargetTime, setNewSkillTargetTime] = useState('');

  // New Log Form State
  const [logSkillId, setLogSkillId] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logTimeSpent, setLogTimeSpent] = useState('');
  const [logAchievements, setLogAchievements] = useState('');

  const calculateProgress = (skill: Skill) => {
    const totalTime = skill.practiceLog.reduce((sum, log) => sum + (log.timeSpent || 0), 0);
    return skill.targetTime > 0 ? (totalTime / skill.targetTime) * 100 : 0;
  };

  // Categorize skills based on efficiency
  const activeSkills = useMemo(() => skills.filter(s => calculateProgress(s) < 100), [skills]);
  const masteredSkills = useMemo(() => skills.filter(s => calculateProgress(s) >= 100), [skills]);

  // Overall Skills Mastered summary header logic
  const masteredCount = masteredSkills.length;

  const handleCreateSkill = () => {
    if (!newSkillName.trim()) return;
    onAddSkill({
      id: Date.now().toString(),
      skillName: newSkillName,
      icon: newSkillIcon,
      targetTime: parseInt(newSkillTargetTime) || 0,
      color: newSkillColor,
      startDate: new Date().toISOString().split('T')[0],
      goal: newSkillGoal,
      streak: 0,
      practiceLog: []
    });
    setNewSkillName('');
    setNewSkillGoal('');
    setNewSkillTargetTime('');
    setIsAddingSkill(false);
  };
  
  const handleExecuteSkillDeletion = () => {
    if (deleteSkillConfirmId) {
      onDeleteSkill(deleteSkillConfirmId);
      setDeleteSkillConfirmId(null);
    }
  };

  const handleCreateLog = () => {
    if (!logSkillId || !logNotes) return;
    onAddPracticeEntry(logSkillId, {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      notes: logNotes,
      timeSpent: parseInt(logTimeSpent) || 0,
      achievements: logAchievements
    });
    setLogNotes('');
    setLogTimeSpent('');
    setLogAchievements('');
    setIsAddingLog(false);
  };

  // Aggregated logs for the Growth Log section
  const allLogs = skills
    .flatMap(s => (s.practiceLog || []).map(l => ({ ...l, skillName: s.skillName, color: s.color })))
    .sort((a, b) => b.date.localeCompare(a.date));

  const renderSkillCard = (skill: Skill, index: number) => {
    const totalTimePracticed = skill.practiceLog.reduce((sum, entry) => sum + (entry.timeSpent || 0), 0);
    const progress = skill.targetTime > 0 ? Math.min(100, (totalTimePracticed / skill.targetTime) * 100) : 0;
    const remainingTime = Math.max(0, skill.targetTime - totalTimePracticed);

    const colorObj = COLOR_PALETTE.find(c => c.key === skill.color) || COLOR_PALETTE[0];

    return (
      <div 
        key={skill.id} 
        className="group relative glass p-10 rounded-[56px] border-white/5 flex flex-col gap-8 transition-all duration-700 hover:border-white/10 hover:bg-white/[0.02] hover:scale-[1.02] shadow-2xl overflow-hidden animate-fade-in-up"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        {/* Visual Flair Background */}
        <div className={`absolute -right-10 -top-10 size-48 blur-[80px] opacity-10 transition-opacity group-hover:opacity-30 ${colorObj.text.replace('text-', 'bg-')}`}></div>

        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-6">
            <div className={`size-20 rounded-[28px] flex items-center justify-center shrink-0 shadow-2xl border transition-all duration-700 group-hover:scale-110 group-hover:rotate-3 ${colorObj.bg} ${colorObj.border}`}>
              <span className={`material-symbols-outlined text-4xl filled-icon ${colorObj.text}`}>{skill.icon}</span>
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">{skill.skillName}</h3>
              <div className="flex items-center gap-3 mt-2">
                 <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Since {skill.startDate}</span>
                 <span className="size-1 bg-slate-800 rounded-full"></span>
                 <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-orange-500 filled-icon animate-pulse">local_fire_department</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase">{skill.streak || 0} Day Streak</span>
                 </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-black tracking-tighter ${colorObj.text}`}>{remainingTime}m</div>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Time to Mastery</p>
          </div>
        </div>

        {/* PROGRESS VISUALIZATION */}
        <div className="space-y-4 relative z-10">
           <div className="flex justify-between items-end">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Efficiency Path</p>
              <p className="text-[10px] font-black text-white bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{progress.toFixed(0)}% In Progress</p>
           </div>
           <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-[2px]">
              <div 
                className={`h-full rounded-full transition-all duration-[1.5s] ease-out ${colorObj.text.replace('text-', 'bg-')} shadow-[0_0_15px_rgba(255,255,255,0.1)]`} 
                style={{ width: `${progress}%` }}
              ></div>
           </div>
        </div>

        <div className="bg-[#080d0a]/60 rounded-[32px] p-6 border border-white/5 relative z-10 group-hover:border-white/20 transition-colors">
           <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Mastery Objective</p>
           <p className="text-sm text-slate-200 font-bold leading-relaxed italic">"{skill.goal || 'Continual refinement of existing capabilities.'}"</p>
        </div>

        <div className="flex justify-between items-center pt-2 relative z-10">
           <div className="flex gap-4">
              <button 
                onClick={() => {
                  const newGoal = prompt("Adjust Strategy Goal:", skill.goal || "");
                  if (newGoal !== null) onUpdateSkill(skill.id, { goal: newGoal });
                }}
                className="text-[10px] font-black text-slate-500 uppercase hover:text-white transition-colors tracking-[0.15em] flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">target</span>
                Adjust Goal
              </button>
           </div>
           
           <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setDeleteSkillConfirmId(skill.id);
              }}
              className="size-8 rounded-xl bg-white/5 text-slate-500 flex items-center justify-center transition-all border border-white/5 hover:bg-rose-500 hover:text-white shadow-sm"
              title="Delete Skill Protocol"
           >
              <span className="material-symbols-outlined text-lg">delete</span>
           </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-16 pt-4 pb-20 animate-fade-in-up">
      {deleteSkillConfirmId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setDeleteSkillConfirmId(null)}>
          <div className="w-full max-w-md bg-[#111a14] border border-rose-500/20 rounded-[40px] shadow-2xl p-10 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-black font-display tracking-tight text-white">Confirm Deletion</h2>
              <p className="text-sm text-slate-400">Are you sure you want to permanently delete this skill protocol? All associated practice logs will also be removed.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => setDeleteSkillConfirmId(null)} className="py-4 bg-white/5 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all border border-white/5">Cancel</button>
              <button onClick={handleExecuteSkillDeletion} className="py-4 bg-rose-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-500/20 active:scale-95 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Overall Skills Mastered summary header at the top */}
      <section className="px-1">
        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600">
          Overall Skills Mastered: <span className="text-emerald-400">{masteredCount}</span>
        </h2>
      </section>

      {/* ADD NEW SKILL: Initialization Terminal */}
      <section className="space-y-8">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600">Initialization Terminal</h2>
          <button 
            onClick={() => setIsAddingSkill(!isAddingSkill)}
            className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all active:scale-95 shadow-xl ${isAddingSkill ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-400 text-[#080d0a] border-emerald-400 shadow-emerald-400/20'}`}
          >
            {isAddingSkill ? 'Cancel Setup' : 'Add New Skill'}
          </button>
        </div>

        {isAddingSkill && (
          <div className="glass p-10 rounded-[48px] border-emerald-400/20 bg-emerald-400/[0.01] animate-fade-in-up shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Skill Identity</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Technical Analysis" 
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    className="w-full glass border-none rounded-[24px] p-6 text-sm font-bold focus:ring-1 focus:ring-emerald-400 outline-none text-white bg-[#0d120f]/50" 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Target Goal</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 90% Accuracy" 
                    value={newSkillGoal}
                    onChange={(e) => setNewSkillGoal(e.target.value)}
                    className="w-full glass border-none rounded-[24px] p-6 text-sm font-bold focus:ring-1 focus:ring-emerald-400 outline-none text-white bg-[#0d120f]/50" 
                  />
                </div>
              </div>
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Target Time (minutes)</label>
                     <input 
                        type="number" 
                        placeholder="e.g. 1200" 
                        value={newSkillTargetTime}
                        onChange={(e) => setNewSkillTargetTime(e.target.value)}
                        className="w-full glass border-none rounded-[24px] p-6 text-sm font-bold focus:ring-1 focus:ring-emerald-400 outline-none text-white bg-[#0d120f]/50" 
                     />
                   </div>
                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Visual Anchor</label>
                     <div className="flex flex-wrap gap-2 pt-1">
                        {PREDEFINED_ICONS.map(icon => (
                           <button 
                              key={icon} 
                              onClick={() => setNewSkillIcon(icon)}
                              className={`size-12 rounded-xl border flex items-center justify-center transition-all ${newSkillIcon === icon ? 'bg-emerald-400 text-black border-emerald-400' : 'bg-white/5 text-slate-600 border-white/5 hover:text-white'}`}
                           >
                              <span className="material-symbols-outlined text-xl">{icon}</span>
                           </button>
                        ))}
                     </div>
                   </div>
                </div>
                <button 
                  onClick={handleCreateSkill}
                  className="w-full py-6 bg-emerald-400 text-[#080d0a] font-black uppercase tracking-[0.3em] rounded-[24px] shadow-2xl shadow-emerald-400/30 active:scale-95 transition-all mt-4"
                >
                  Commit to Protocol
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SKILLS GRID: Active Specializations */}
      <section className="space-y-10">
        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 px-1">Active Specializations</h2>
        {activeSkills.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {activeSkills.map((skill, index) => renderSkillCard(skill, index))}
          </div>
        ) : (
          <div className="py-12 glass rounded-[40px] border-dashed border-white/10 flex flex-col items-center justify-center opacity-30">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">No active specializations in progress</p>
          </div>
        )}
      </section>

      {/* SKILLS GRID: Overall Skills Mastered (Completed Specializations) */}
      <section className="space-y-10">
        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 px-1">Overall Skills Mastered</h2>
        {masteredSkills.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {masteredSkills.map((skill, index) => renderSkillCard(skill, index))}
          </div>
        ) : (
          <div className="py-12 glass rounded-[40px] border-dashed border-white/10 flex flex-col items-center justify-center opacity-30">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Zero skills archived at 100% efficiency</p>
          </div>
        )}
      </section>

      {/* LOGS SECTION */}
      <section className="space-y-8">
        <div className="flex justify-between items-center px-1">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600">Practice Archives</h2>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Unified Execution Logs</p>
          </div>
          <button 
            onClick={() => setIsAddingLog(!isAddingLog)}
            className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all active:scale-95 shadow-xl ${isAddingLog ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-blue-500 text-white border-blue-500 shadow-blue-500/20'}`}
          >
            {isAddingLog ? 'Abort Session' : 'Log New Session'}
          </button>
        </div>

        {isAddingLog && (
          <div className="glass p-10 rounded-[48px] border-blue-500/20 animate-fade-in-up shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Protocol Target</label>
                  <select 
                    value={logSkillId} 
                    onChange={(e) => setLogSkillId(e.target.value)}
                    className="w-full glass border-none rounded-2xl p-5 text-sm font-bold text-white bg-[#0d120f] outline-none appearance-none cursor-pointer focus:ring-1 focus:ring-blue-400"
                  >
                    <option value="">Select Specialization...</option>
                    {skills.map(s => <option key={s.id} value={s.id}>{s.skillName}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Duration (minutes)</label>
                    <input type="number" placeholder="e.g. 45" value={logTimeSpent} onChange={(e) => setLogTimeSpent(e.target.value)} className="w-full glass border-none rounded-2xl p-5 text-sm font-bold focus:ring-1 focus:ring-blue-400 outline-none text-white bg-[#0d120f]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Key Win</label>
                    <input type="text" placeholder="Achievement..." value={logAchievements} onChange={(e) => setLogAchievements(e.target.value)} className="w-full glass border-none rounded-2xl p-5 text-sm font-bold focus:ring-1 focus:ring-emerald-400 outline-none text-white bg-[#0d120f]" />
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Session Notes</label>
                  <textarea 
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    placeholder="Specific observations or technical improvements..."
                    className="w-full h-32 glass border-none rounded-3xl p-6 text-sm font-medium focus:ring-1 focus:ring-blue-400 outline-none text-slate-200 resize-none bg-[#0d120f]"
                  />
                </div>
                <button onClick={handleCreateLog} className="w-full py-5 bg-blue-500 text-white font-black uppercase tracking-[0.3em] rounded-[24px] shadow-2xl shadow-blue-500/30 active:scale-95 transition-all">Archive Data Block</button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6">
          {allLogs.map((entry, index) => {
            const colorObj = COLOR_PALETTE.find(c => c.key === entry.color) || COLOR_PALETTE[0];
            return (
              <div 
                key={entry.id} 
                className="glass p-8 rounded-[40px] border-white/5 bg-white/[0.01] hover:bg-white/[0.02] hover:scale-[1.01] transition-all group shadow-xl animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`size-3 rounded-full ${colorObj.text.replace('text-', 'bg-')} shadow-[0_0_10px_rgba(255,255,255,0.2)]`}></div>
                      <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${colorObj.text}`}>{entry.skillName}</span>
                      <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">{entry.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black text-slate-500 uppercase bg-white/5 px-4 py-1.5 rounded-xl border border-white/5 tracking-widest">{entry.timeSpent}m</span>
                       <div className="size-2 rounded-full bg-blue-500/20"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Observations</p>
                      <p className="text-base text-slate-300 font-medium leading-relaxed italic">"{entry.notes}"</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Archived Achievement</p>
                      <div className="bg-emerald-400/5 border border-emerald-400/10 p-5 rounded-[24px]">
                        <p className="text-sm text-emerald-400 font-black leading-relaxed">{entry.achievements || 'Systemic improvement realized.'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {allLogs.length === 0 && (
            <div className="py-24 glass rounded-[56px] border-dashed border-white/10 flex flex-col items-center justify-center opacity-30 shadow-inner">
               <div className="size-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-slate-700">
                  <span className="material-symbols-outlined text-5xl">history_edu</span>
               </div>
               <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-500">No session archives found</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MasteryStack;
