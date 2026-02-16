
import React, { useState } from 'react';
import { FutureLetter } from '../types';

interface FutureLettersProps {
  letters: FutureLetter[];
  onAddLetter: (letter: Omit<FutureLetter, 'id' | 'createdAt' | 'isLocked'>) => void;
  onDeleteLetter: (id: string) => void;
}

const FutureLetters: React.FC<FutureLettersProps> = ({ letters, onAddLetter, onDeleteLetter }) => {
  const [isComposing, setIsComposing] = useState(false);
  const [readingLetter, setReadingLetter] = useState<FutureLetter | null>(null);
  const [deleteLetterConfirmId, setDeleteLetterConfirmId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockDate, setUnlockDate] = useState('');

  const handleCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !unlockDate) return;
    
    onAddLetter({
      title,
      content,
      unlockDate
    });

    setIsComposing(false);
    setTitle('');
    setContent('');
    setUnlockDate('');
  };
  
  const handleExecuteLetterDeletion = () => {
    if (deleteLetterConfirmId) {
      onDeleteLetter(deleteLetterConfirmId);
      setDeleteLetterConfirmId(null);
    }
  };

  return (
    <div className="space-y-8 pt-4">
      {/* Hero Section */}
      <section className="bg-[#111a14] border border-white/5 rounded-[36px] p-10 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 size-64 bg-emerald-400/5 blur-[100px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 size-64 bg-emerald-400/10 blur-[100px] -ml-32 -mb-32"></div>

        <div className="relative z-10">
          <div className="size-20 bg-emerald-400/10 rounded-[28px] flex items-center justify-center text-emerald-400 mx-auto mb-6 shadow-xl border border-emerald-400/10">
            <span className="material-symbols-outlined text-5xl filled-icon">history_edu</span>
          </div>
          <h2 className="text-3xl font-black font-display tracking-tight text-white mb-3">Time-Locked Guidance</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-8 max-w-sm mx-auto font-medium">
            Transmit wisdom to your future self. <br/> Letters remain encrypted and locked until the moment you specify.
          </p>
          <button 
            onClick={() => setIsComposing(true)}
            className="px-10 py-4 bg-emerald-400 text-[#080d0a] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-400/20 active:scale-95 transition-all"
          >
            Create New Transmission
          </button>
        </div>
      </section>

      {/* Archive List */}
      <section>
        <div className="flex justify-between items-center mb-6 px-1">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Your Temporal Archive</h2>
          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{letters.length} Letters Encrypted</p>
        </div>
        
        <div className="grid gap-4">
          {letters.map(letter => {
            const isLocked = new Date(letter.unlockDate) > new Date();
            return (
              <div 
                key={letter.id} 
                className={`group relative p-6 rounded-[32px] border transition-all ${
                  isLocked 
                  ? 'bg-white/[0.02] border-white/5 opacity-60' 
                  : 'bg-[#111a14] border-emerald-400/20 shadow-lg shadow-emerald-400/5 hover:border-emerald-400/40'
                }`}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteLetterConfirmId(letter.id); }}
                  className="absolute top-4 right-4 z-10 size-8 rounded-full bg-rose-500/20 text-rose-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-rose-500 hover:text-white"
                  title={`Delete ${letter.title}`}
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-5">
                    <div className={`size-14 rounded-2xl flex items-center justify-center transition-all ${
                      isLocked ? 'bg-white/5 text-slate-700' : 'bg-emerald-400/10 text-emerald-400 shadow-[0_0_15px_rgba(48,232,110,0.2)]'
                    }`}>
                      <span className="material-symbols-outlined text-3xl">
                        {isLocked ? 'lock' : 'mark_email_read'}
                      </span>
                    </div>
                    <div>
                      <h4 className={`text-base font-black tracking-tight ${isLocked ? 'text-slate-500' : 'text-white'}`}>{letter.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">
                          Unlock: {new Date(letter.unlockDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <span className="size-1 bg-slate-800 rounded-full"></span>
                        <p className="text-[10px] text-slate-700 uppercase font-black tracking-widest">Sent: {new Date(letter.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  {!isLocked && (
                    <button 
                      onClick={() => setReadingLetter(letter)}
                      className="px-6 py-3 bg-emerald-400/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 hover:text-[#080d0a] transition-all active:scale-95"
                    >
                      Break Seal
                    </button>
                  )}

                  {isLocked && (
                    <div className="px-4 py-2 bg-white/5 rounded-xl flex items-center gap-2">
                       <span className="material-symbols-outlined text-sm text-slate-700">timer</span>
                       <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Encrypted</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {letters.length === 0 && (
            <div className="py-20 glass rounded-[40px] border-dashed border-white/5 flex flex-col items-center justify-center opacity-30">
               <span className="material-symbols-outlined text-6xl mb-4">hourglass_empty</span>
               <p className="text-xs font-black uppercase tracking-widest">No transmissions active</p>
            </div>
          )}
        </div>
      </section>

      {/* Composition Modal */}
      {isComposing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsComposing(false)}>
          <div className="w-full max-w-xl bg-[#111a14] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-2xl font-black font-display tracking-tight text-white">New Transmission</h2>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1">Target: The Future</p>
              </div>
              <button onClick={() => setIsComposing(false)} className="size-10 glass rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCommit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Mission Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Guidance for 2026 self..." 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full glass border-none rounded-2xl p-4 text-sm font-bold focus:ring-1 focus:ring-emerald-400 outline-none placeholder:text-slate-800 text-slate-200" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Unlock Date (Temporal Target)</label>
                <input 
                  type="date" 
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={unlockDate}
                  onChange={(e) => setUnlockDate(e.target.value)}
                  className="w-full glass border-none rounded-2xl p-4 text-sm font-bold focus:ring-1 focus:ring-emerald-400 outline-none text-slate-200 appearance-none bg-[#080d0a]/50" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Deep Reflection Message</label>
                <textarea 
                  required
                  placeholder="Speak truthfully. What does your future self need to remember about this exact moment?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-48 glass border-none rounded-3xl p-6 text-sm font-medium leading-relaxed focus:ring-1 focus:ring-emerald-400 outline-none placeholder:text-slate-800 text-slate-200 resize-none scroll-smooth"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-emerald-400 text-[#080d0a] font-black uppercase tracking-[0.2em] rounded-2xl active:scale-[0.98] transition-all shadow-xl shadow-emerald-400/20"
              >
                Commit to Time Capsule
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reading Modal */}
      {readingLetter && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setReadingLetter(null)}>
          <div className="w-full max-w-2xl bg-[#080d0a] border border-emerald-400/20 rounded-[40px] shadow-[0_0_100px_rgba(48,232,110,0.1)] p-12 relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Visual Flair */}
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <span className="material-symbols-outlined text-[200px] filled-icon">drafts</span>
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-12">
                <div className="space-y-1">
                  <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.3em]">Temporal Message</p>
                  <h2 className="text-4xl font-black font-display tracking-tight text-white">{readingLetter.title}</h2>
                  <p className="text-xs text-slate-600 font-bold mt-2">
                    Transmitted on {new Date(readingLetter.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button 
                  onClick={() => setReadingLetter(null)} 
                  className="size-12 bg-white/5 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-[36px] p-10 mb-10 min-h-[300px] flex items-center">
                <p className="text-xl font-medium text-slate-200 leading-relaxed italic text-center w-full">
                  "{readingLetter.content}"
                </p>
              </div>

              <div className="flex items-center justify-center gap-6">
                <div className="h-px flex-1 bg-white/5"></div>
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em]">The Past has Spoken</p>
                <div className="h-px flex-1 bg-white/5"></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {deleteLetterConfirmId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setDeleteLetterConfirmId(null)}>
          <div className="w-full max-w-md bg-[#111a14] border border-rose-500/20 rounded-[40px] shadow-2xl p-10 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-black font-display tracking-tight text-white">Confirm Deletion</h2>
              <p className="text-sm text-slate-400">Are you sure you want to permanently delete this future letter? This transmission will be lost forever.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => setDeleteLetterConfirmId(null)} className="py-4 bg-white/5 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all border border-white/5">Cancel</button>
              <button onClick={handleExecuteLetterDeletion} className="py-4 bg-rose-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-500/20 active:scale-95 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FutureLetters;
