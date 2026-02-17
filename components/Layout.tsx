
import React from 'react';
import { Tab } from '../types.ts';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  title: string;
  description?: string;
  focusLevel: number;
  focusXP: number;
  xpToNext: number;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, title, description, focusLevel, focusXP, xpToNext, onLogout
}) => {
  const progressPercentage = (focusXP / xpToNext) * 100;

  return (
    <div className="min-h-screen bg-[#080d0a] text-[#f8faf9] flex justify-center">
      <div className="w-full max-w-[1440px] flex flex-col md:flex-row relative">
        
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 glass md:hidden w-full">
          <div className="flex items-center justify-between p-5">
            <button className="p-2 rounded-xl bg-white/5 border border-white/5 active:scale-95 transition-transform" onClick={onLogout}>
              <span className="material-symbols-outlined text-rose-500">logout</span>
            </button>
            <h1 className="text-sm font-bold tracking-tight font-display uppercase">{title}</h1>
            <button className="p-2 rounded-xl bg-white/5 border border-white/5 active:scale-95 transition-transform" onClick={() => setActiveTab('coach')}>
              <span className={`material-symbols-outlined ${activeTab === 'coach' ? 'text-emerald-400 filled-icon' : 'text-slate-500'}`}>psychology</span>
            </button>
          </div>
        </header>

        {/* Desktop Sidebar - Persistent & Spacious */}
        <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 border-r border-white/5 p-8 space-y-8 bg-[#080d0a] shrink-0">
          <div className="flex items-center gap-4 mb-4">
            <div className="size-12 bg-[#111a14] rounded-[18px] flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(48,232,110,0.15)] shrink-0 border border-white/5">
              <svg viewBox="0 0 100 100" className="w-full h-full p-2.5" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 10 L85 30 V70 L50 90 L15 70 V30 L50 10Z" fill="none" stroke="#30e86e" strokeWidth="4" />
                <path d="M30 60 L50 35 L70 60" fill="none" stroke="#30e86e" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M30 75 L50 50 L70 75" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black font-display tracking-tight leading-none">Mastery<span className="text-emerald-400 block">Hub</span></h1>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 whitespace-nowrap">PDTrades.JournalX</p>
            </div>
          </div>
          
          <nav className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar">
            <DesktopNavItem icon="grid_view" label="Dashboard" active={activeTab === 'wins'} onClick={() => setActiveTab('wins')} />
            <DesktopNavItem icon="calendar_today" label="Agenda" active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} />
            <DesktopNavItem icon="monitoring" label="Trade Journal" active={activeTab === 'trading'} onClick={() => setActiveTab('trading')} />
            <DesktopNavItem icon="checklist" label="Habit Engine" active={activeTab === 'habits'} onClick={() => setActiveTab('habits')} />
            <DesktopNavItem icon="layers" label="Skill Stack" active={activeTab === 'mastery'} onClick={() => setActiveTab('mastery')} />
            <DesktopNavItem icon="account_balance_wallet" label="Visual Budget" active={activeTab === 'budget'} onClick={() => setActiveTab('budget')} />
            <DesktopNavItem icon="auto_stories" label="Future Letters" active={activeTab === 'future'} onClick={() => setActiveTab('future')} />
            <DesktopNavItem icon="favorite" label="Bible Scriptures" active={activeTab === 'scriptures'} onClick={() => setActiveTab('scriptures')} />
            <div className="h-px bg-white/5 my-2 mx-4"></div>
            <DesktopNavItem icon="psychology" label="Live Coach" active={activeTab === 'coach'} onClick={() => setActiveTab('coach')} />
          </nav>

          <div className="mt-auto space-y-4">
             <div className="p-6 glass rounded-[32px] border-emerald-400/10">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Focus Level</p>
                  <span className="text-[10px] text-emerald-400 font-black px-2 py-0.5 rounded-md bg-emerald-400/10">LVL {focusLevel}</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(48,232,110,0.5)] transition-all duration-700 ease-out" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{xpToNext - focusXP} XP TO NEXT</p>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{focusXP} / {xpToNext}</p>
                </div>
              </div>
              
              <button 
                onClick={onLogout}
                className="w-full flex items-center gap-4 p-4 rounded-[20px] transition-all hover:bg-rose-500/5 group text-slate-500 hover:text-rose-400"
              >
                <div className="p-2 rounded-xl bg-white/5 transition-all group-hover:bg-rose-500/10">
                  <span className="material-symbols-outlined text-2xl">power_settings_new</span>
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest">Terminate Link</span>
              </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 pb-32 md:pb-12 md:pt-12 px-5 md:px-12 lg:px-16 overflow-y-auto no-scrollbar">
          <div className="max-w-[1100px] mx-auto">
            <div className="hidden md:block mb-12">
               <h1 className="text-4xl font-black font-display tracking-tight text-white">{title}</h1>
               <p className="text-slate-500 text-base mt-3 font-medium max-w-xl leading-relaxed">
                 {description || "Small daily iterations produce massive yearly transformation. Stay consistent, stay disciplined."}
               </p>
            </div>
            {children}
          </div>
        </main>

        {/* Mobile Floating Nav */}
        <div className="fixed bottom-6 left-0 w-full flex justify-center px-6 z-50 md:hidden pointer-events-none">
          <nav className="w-full max-w-md glass rounded-[32px] p-2 flex justify-between items-center shadow-2xl pointer-events-auto">
            <div className="flex-1 flex justify-around">
              <NavItem icon="grid_view" label="Hub" active={activeTab === 'wins'} onClick={() => setActiveTab('wins')} />
              <NavItem icon="layers" label="Stack" active={activeTab === 'mastery'} onClick={() => setActiveTab('mastery')} />
              <NavItem icon="favorite" label="Bible" active={activeTab === 'scriptures'} onClick={() => setActiveTab('scriptures')} />
            </div>
            
            <div className="flex-1 flex justify-around">
              <NavItem icon="account_balance_wallet" label="Money" active={activeTab === 'budget'} onClick={() => setActiveTab('budget')} />
              <NavItem icon="monitoring" label="Trade" active={activeTab === 'trading'} onClick={() => setActiveTab('trading')} />
              <NavItem icon="psychology" label="Coach" active={activeTab === 'coach'} onClick={() => setActiveTab('coach')} />
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }: { icon: string, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all ${active ? 'text-emerald-400' : 'text-slate-500 opacity-60'}`}
  >
    <span className={`material-symbols-outlined text-2xl ${active ? 'filled-icon' : ''}`} style={{ fontVariationSettings: active ? "'FILL' 1" : "" }}>
      {icon}
    </span>
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const DesktopNavItem = ({ icon, label, active, onClick }: { icon: string, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-5 p-4 rounded-[24px] transition-all group ${active ? 'bg-emerald-400/10 text-emerald-400 shadow-[inset_0_0_15px_rgba(48,232,110,0.05)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
  >
    <div className={`p-2 rounded-xl transition-all ${active ? 'bg-emerald-400/10' : 'bg-transparent group-hover:bg-white/5'}`}>
      <span className={`material-symbols-outlined text-2xl ${active ? 'filled-icon' : ''}`} style={{ fontVariationSettings: active ? "'FILL' 1" : "" }}>
        {icon}
      </span>
    </div>
    <span className="text-[13px] font-bold font-body uppercase tracking-[0.15em]">{label}</span>
  </button>
);

export default Layout;