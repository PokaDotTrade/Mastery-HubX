
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Layout from './components/Layout.tsx';
import Dashboard from './components/Dashboard.tsx';
import BudgetPlanner from './components/BudgetPlanner.tsx';
import { GardenSummary } from './components/EnvelopeChallenge.tsx';
import TradingJournal from './components/TradingJournal.tsx';
import SchedulePlanner from './components/SchedulePlanner.tsx';
import FutureLetters from './components/FutureLetters.tsx';
import HabitTracker from './components/HabitTracker.tsx';
import MasteryStack from './components/MasteryStack.tsx';
import CoachLive from './components/CoachLive.tsx';
import BibleScriptures from './components/BibleScriptures.tsx';
import { Tab, Win, Envelope, Trade, Strategy, TradingAccount, ScheduleTask, MasteryHabit, FutureLetter, Expense, Income, BudgetBucket, Skill, PipelineProject, Devotion } from './types.ts';
import { INITIAL_WINS, MASTERY_HABITS, BUDGET_BUCKETS, RECENT_TRADES, STRATEGIES, INITIAL_TASKS, INITIAL_SKILLS, INITIAL_PROJECTS, DEVOTIONS, CURRENCY_OPTIONS } from './constants.tsx';
import { getADHDCoachMessage } from './services/geminiService.ts';

const STORAGE_KEY = 'mastery_hub_v1_state';
const IDENTITY_KEY = 'mastery_hub_identity_pref_v1';
const SIDEBAR_COLLAPSED_KEY = 'mastery_hub_sidebar_collapsed_v1';

const INITIAL_ENVELOPES: Envelope[] = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  value: (i + 1) * 10,
  completed: false 
}));

const INITIAL_ACCOUNTS: TradingAccount[] = [
  { id: 'acc_1', name: 'Master Live', type: 'Live', balance: 5000, currency: '$', isPrimary: true },
  { id: 'acc_2', name: 'FTMO Challenge', type: 'Prop Firm', balance: 100000, currency: '$', isPrimary: false, phase: 'Phase 1', targetProfitPct: 10, dailyDrawdownPct: 5, maxDrawdownPct: 10, initialPhaseBalance: 100000 },
];

const INITIAL_LETTERS: FutureLetter[] = [
  { id: '1', title: 'To my version in 6 months', content: 'You have mastered the edge. Remember why you started: to build a life of total freedom. The NAS100 discipline was the key. Keep scaling.', createdAt: '2024-08-01', unlockDate: '2025-02-01', isLocked: false },
  { id: '2', title: 'End of Year Reflection', content: 'The discipline paid off. You managed to complete the 100 envelope challenge and your trading psychology is rock solid.', createdAt: '2025-01-15', unlockDate: '2025-12-31', isLocked: true },
];

const GREETING_POOLS = {
  standard: ["Hi, hello {NAME} 👋", "Welcome back, {NAME}", "Good to see you, {NAME}", "Let’s cook today, {NAME}", "Locked in, {NAME}?"],
  languages: ["Hola, {NAME} 🇪🇸", "Bonjour, {NAME} 🇫🇷", "Sawubona, {NAME} 🇿🇦", "Dumela, {NAME}", "Hallo, {NAME} 🇩🇪", "Ciao, {NAME} 🇮🇹", "Konnichiwa, {NAME} 🇯🇵", "Molo, {NAME}"],
  green: ["Looking good, {NAME} 🔥", "Clean execution, {NAME}", "Discipline paying off, {NAME}", "That’s how pros move, {NAME}"],
  drawdown: ["Stay sharp, {NAME}", "Protect the capital, {NAME}", "Reset. Refocus. Reload, {NAME}", "Process over emotion, {NAME}"],
  flat: ["Patience wins, {NAME}", "No rush, {NAME}", "Wait for your setup, {NAME}"]
};

const App: React.FC = () => {
  // --- Initialization Helper ---
  const getInitialState = <T extends unknown>(key: string, fallback: T): T => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return fallback;
    try {
      const parsed = JSON.parse(saved);
      return parsed[key] !== undefined ? parsed[key] : fallback;
    } catch (e) {
      return fallback;
    }
  };

  const [preferredName, setPreferredName] = useState<string | null>(() => localStorage.getItem(IDENTITY_KEY));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('wins');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  });
  
  // Data State
  const [wins, setWins] = useState<Win[]>(() => getInitialState<Win[]>('wins', INITIAL_WINS));
  const [masteryHabits, setMasteryHabits] = useState<MasteryHabit[]>(() => getInitialState<MasteryHabit[]>('masteryHabits', MASTERY_HABITS));
  const [trades, setTrades] = useState<Trade[]>(() => getInitialState<Trade[]>('trades', RECENT_TRADES));
  const [strategies, setStrategies] = useState<Strategy[]>(() => getInitialState<Strategy[]>('strategies', STRATEGIES));
  const [accounts, setAccounts] = useState<TradingAccount[]>(() => getInitialState<TradingAccount[]>('accounts', INITIAL_ACCOUNTS));
  const [envelopes, setEnvelopes] = useState<Envelope[]>(() => getInitialState<Envelope[]>('envelopes', INITIAL_ENVELOPES));
  const [tasks, setTasks] = useState<ScheduleTask[]>(() => getInitialState<ScheduleTask[]>('tasks', INITIAL_TASKS));
  const [letters, setLetters] = useState<FutureLetter[]>(() => getInitialState<FutureLetter[]>('letters', INITIAL_LETTERS));
  const [currency, setCurrency] = useState(() => getInitialState<string>('currency', '$'));
  const [buckets, setBuckets] = useState<BudgetBucket[]>(() => getInitialState<BudgetBucket[]>('buckets', BUDGET_BUCKETS));
  const [expenses, setExpenses] = useState<Expense[]>(() => getInitialState<Expense[]>('expenses', []));
  const [incomeRecords, setIncomeRecords] = useState<Income[]>(() => getInitialState<Income[]>('incomeRecords', []));
  const [skills, setSkills] = useState<Skill[]>(() => getInitialState<Skill[]>('skills', INITIAL_SKILLS));
  const [projects, setProjects] = useState<PipelineProject[]>(() => getInitialState<PipelineProject[]>('projects', INITIAL_PROJECTS));
  const [heartedScriptures, setHeartedScriptures] = useState<Devotion[]>(() => getInitialState<Devotion[]>('heartedScriptures', []));
  const [budgetMantra, setBudgetMantra] = useState<string>(() => getInitialState<string>('budgetMantra', 'This budget builds my financial freedom.'));


  const [coachMessage, setCoachMessage] = useState("Focus on one small win at a time.");
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const coachTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New Identity State
  const [nameInput, setNameInput] = useState('');

  // --- Daily Reset Effect ---
  useEffect(() => {
    // On app load, determine "completed" status for today based on permanent history
    const today = new Date().toISOString().split('T')[0];
    setWins(prevWins => prevWins.map(win => ({
      ...win,
      completed: (win.completionHistory || []).includes(today)
    })));
    // The destructive daily reset is removed. LAST_VISIT_KEY is no longer needed for this.
  }, []);

  // --- Persistence Effect ---
  useEffect(() => {
    const stateToSave = {
      wins, masteryHabits, trades, strategies, accounts, envelopes, tasks, letters, currency, buckets, expenses, incomeRecords, skills, projects, heartedScriptures, budgetMantra
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [wins, masteryHabits, trades, strategies, accounts, envelopes, tasks, letters, currency, buckets, expenses, incomeRecords, skills, projects, heartedScriptures, budgetMantra]);

  // Identity Persistence
  useEffect(() => {
    if (preferredName) {
      localStorage.setItem(IDENTITY_KEY, preferredName);
    } else {
      localStorage.removeItem(IDENTITY_KEY);
    }
  }, [preferredName]);

  // Sidebar State Persistence
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  // --- Dynamic Greeting Logic ---
  const dynamicSubtext = useMemo(() => {
    if (activeTab !== 'wins') return "";

    const today = new Date().toISOString().split('T')[0];
    const todayTrades = trades.filter(t => t.time.startsWith(today));
    const todayPnL = todayTrades.reduce((sum, t) => sum + t.pnl, 0);
    
    let pool: string[] = [];
    const name = preferredName || "PDTrades";

    if (todayTrades.length > 0) {
      if (todayPnL > 0) pool = GREETING_POOLS.green;
      else if (todayPnL < 0) pool = GREETING_POOLS.drawdown;
      else pool = GREETING_POOLS.flat;
    } else {
      // Rotate through standard and languages for variety if no trades yet
      pool = [...GREETING_POOLS.standard, ...GREETING_POOLS.languages, ...GREETING_POOLS.flat];
    }
    
    const randomIdx = Math.floor(Math.random() * pool.length);
    return pool[randomIdx].replace(/{NAME}/g, name);
  }, [activeTab, trades, preferredName]);

  // --- Focus Level Logic ---
  const focusStats = useMemo(() => {
    const completedWins = wins.filter(w => w.completed).length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTrades = trades.length;
    const masteryProgress = masteryHabits.reduce((acc, h) => acc + h.progress, 0);

    const baseXP = 11250; 
    const earnedXP = 
      (completedWins * 100) + 
      (completedTasks * 150) + 
      (totalTrades * 500) + 
      (masteryProgress * 250);
      
    const totalXP = baseXP + earnedXP;

    const XP_PER_LEVEL = 1000;
    const level = Math.floor(totalXP / XP_PER_LEVEL);
    const currentXPInLevel = totalXP % XP_PER_LEVEL;

    return { level, xp: currentXPInLevel, xpToNext: XP_PER_LEVEL };
  }, [wins, tasks, trades, masteryHabits]);

  const toggleWin = useCallback((id: string) => {
    setWins(prev => prev.map(w => {
      if (w.id === id) {
        const isNowCompleted = !w.completed;
        const today = new Date().toISOString().split('T')[0];
        let newHistory = w.completionHistory || [];

        if (isNowCompleted) {
          if (!newHistory.includes(today)) {
            newHistory = [...newHistory, today];
          }
        } else {
          newHistory = newHistory.filter(date => date !== today);
        }

        return { 
          ...w, 
          completed: isNowCompleted,
          streak: isNowCompleted ? w.streak + 1 : Math.max(0, w.streak - 1),
          completionHistory: newHistory
        };
      }
      return w;
    }));
  }, []);

  const incrementMasteryHabit = useCallback((id: string) => {
    setMasteryHabits(prev => prev.map(h => {
      if (h.id === id) {
        const nextProgress = h.progress < h.total ? h.progress + 1 : 0;
        return { ...h, progress: nextProgress };
      }
      return h;
    }));
  }, []);

  const updateMasteryHabit = useCallback((id: string, updates: Partial<MasteryHabit>) => {
    setMasteryHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  }, []);

  const toggleHeartedScripture = useCallback((devotion: Devotion) => {
    setHeartedScriptures(prev => {
      const exists = prev.some(s => s.ref === devotion.ref);
      if (exists) {
        return prev.filter(s => s.ref !== devotion.ref);
      } else {
        return [...prev, devotion];
      }
    });
  }, []);

  const addLetter = useCallback((newLetter: Omit<FutureLetter, 'id' | 'createdAt' | 'isLocked'>) => {
    const letter: FutureLetter = {
      ...newLetter,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
      isLocked: new Date(newLetter.unlockDate) > new Date()
    };
    setLetters(prev => [letter, ...prev]);
  }, []);
  
  const deleteLetter = useCallback((id: string) => {
    setLetters(prev => prev.filter(l => l.id !== id));
  }, []);

  const toggleEnvelope = useCallback((id: number) => {
    setEnvelopes(prev => prev.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
  }, []);
  
  const addBucket = useCallback((bucket: BudgetBucket) => {
    setBuckets(prev => [...prev, bucket]);
  }, []);

  const deleteBucket = useCallback((id: string) => {
    setBuckets(prev => prev.filter(b => b.id !== id));
  }, []);

  const handleUpdateBucket = useCallback((id: string, updates: Partial<BudgetBucket>) => {
    setBuckets(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const handleAddTrade = useCallback((newTrade: Trade) => {
    setTrades(prev => [newTrade, ...prev]);
    if (newTrade.accountId) {
      setAccounts(prev => prev.map(acc => 
        acc.id === newTrade.accountId 
        ? { ...acc, balance: acc.balance + newTrade.pnl } 
        : acc
      ));
    }
  }, []);

  const handleDeleteTrade = useCallback((id: string) => {
    setTrades(prev => {
      const tradeToDelete = prev.find(t => t.id === id);
      if (!tradeToDelete) return prev;
      
      if (tradeToDelete.accountId) {
        setAccounts(accs => accs.map(acc => 
          acc.id === tradeToDelete.accountId 
          ? { ...acc, balance: acc.balance - tradeToDelete.pnl } 
          : acc
        ));
      }
      return prev.filter(t => t.id !== id);
    });
  }, []);

  const handleUpdateStrategy = useCallback((id: string, updates: Partial<Strategy>) => {
    setStrategies(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const handleSelectAccount = useCallback((id: string) => {
    setAccounts(prev => prev.map(acc => ({
      ...acc,
      isPrimary: acc.id === id
    })));
  }, []);

  const handleUpdateAccount = useCallback((id: string, updates: Partial<TradingAccount>) => {
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...updates } : acc));
  }, []);

  const handleDeleteAccount = useCallback((id: string) => {
    // 1. Locate and remove the account using the verified unique ID pattern
    setAccounts(prev => {
      const remaining = prev.filter(acc => acc.id !== id);
      
      // 2. Intelligence: If the deleted desk was the primary/active one, auto-switch to first available
      if (remaining.length > 0 && !remaining.some(a => a.isPrimary)) {
        return remaining.map((acc, idx) => 
          idx === 0 ? { ...acc, isPrimary: true } : acc
        );
      }
      return remaining;
    });

    // 3. System Protocol: Purge all trade execution archives associated with the deleted desk
    setTrades(prev => prev.filter(trade => trade.accountId !== id));
  }, []);

  const handleCommence = () => {
    if (!nameInput.trim()) return;
    setPreferredName(nameInput.trim());
    setIsAuthenticated(true);
  };

  const handleNewUser = () => {
    setPreferredName(null);
    localStorage.removeItem(IDENTITY_KEY);
    setNameInput('');
  };

  const handleTerminateSession = () => {
    setIsAuthenticated(false);
  };

  // AI Coach triggering
  useEffect(() => {
    if (coachTimeoutRef.current) clearTimeout(coachTimeoutRef.current);
    coachTimeoutRef.current = setTimeout(async () => {
      setIsCoachLoading(true);
      const completed = wins.filter(w => w.completed).length;
      const msg = await getADHDCoachMessage(completed, wins.length);
      setCoachMessage(msg);
      setIsCoachLoading(false);
    }, 1500);
    return () => { if (coachTimeoutRef.current) clearTimeout(coachTimeoutRef.current); };
  }, [wins]);

  const renderContent = () => {
    switch (activeTab) {
      case 'wins':
        return (
          <div className="space-y-12">
            <Dashboard 
              wins={wins} 
              toggleWin={toggleWin} 
              habits={masteryHabits} 
              incrementMasteryHabit={incrementMasteryHabit}
              updateMasteryHabit={updateMasteryHabit}
              coachMessage={isCoachLoading ? "Coach is analyzing your progress..." : coachMessage}
              letters={letters}
              accounts={accounts}
              trades={trades}
              tasks={tasks}
              currency={currency}
              heartedScriptures={heartedScriptures}
              onToggleHeart={toggleHeartedScripture}
            />
            <div className="border-t border-white/5 pt-10">
               <GardenSummary envelopes={envelopes} currency={currency} />
            </div>
          </div>
        );
      case 'mastery':
        return (
          <MasteryStack 
            skills={skills} 
            onAddSkill={(s) => setSkills(p => [...p, s])}
            onUpdateSkill={(id, u) => setSkills(p => p.map(s => s.id === id ? { ...s, ...u } : s))}
            onDeleteSkill={(id) => setSkills(p => p.filter(s => s.id !== id))}
            onAddPracticeEntry={(skillId, entry) => {
              setSkills(prevSkills => 
                prevSkills.map(skill => {
                  if (skill.id === skillId) {
                    return {
                      ...skill,
                      streak: (skill.streak || 0) + 1,
                      practiceLog: [entry, ...(skill.practiceLog || [])],
                    };
                  }
                  return skill;
                })
              );
            }}
          />
        );
      case 'habits':
        return <HabitTracker habits={wins} onAddHabit={(h) => setWins(p => [...p, { ...h, id: Date.now().toString(), completed: false, streak: 0 }])} onToggleHabit={toggleWin} onDeleteHabit={(id) => setWins(p => p.filter(w => w.id !== id))} />;
      case 'budget':
        return (
          <BudgetPlanner 
            buckets={buckets} 
            onAddBucket={addBucket}
            onDeleteBucket={deleteBucket}
            onUpdateBucket={handleUpdateBucket}
            envelopes={envelopes} 
            toggleEnvelope={toggleEnvelope} 
            currency={currency} 
            setCurrency={setCurrency}
            expenses={expenses}
            setExpenses={setExpenses}
            incomeRecords={incomeRecords}
            setIncomeRecords={setIncomeRecords}
            budgetMantra={budgetMantra}
            setBudgetMantra={setBudgetMantra}
          />
        );
      case 'trading':
        return (
          <TradingJournal 
            trades={trades} 
            strategies={strategies} 
            accounts={accounts}
            onAddTrade={handleAddTrade} 
            onDeleteTrade={handleDeleteTrade}
            onAddStrategy={(s) => setStrategies(prev => [s, ...prev])}
            onDeleteStrategy={(id) => setStrategies(prev => prev.filter(s => s.id !== id))}
            onUpdateStrategy={handleUpdateStrategy}
            onAddAccount={(a) => setAccounts(p => [...p, a])}
            onDeleteAccount={handleDeleteAccount}
            onSelectAccount={handleSelectAccount}
            onUpdateAccount={handleUpdateAccount}
          />
        );
      case 'schedule':
        return (
          <SchedulePlanner 
            tasks={tasks} 
            onAddTask={(t) => setTasks(prev => [...prev, t])} 
            onToggleTask={(id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))} 
            onDeleteTask={(id) => setTasks(prev => prev.filter(t => t.id !== id))} 
          />
        );
      case 'future':
        return <FutureLetters letters={letters} onAddLetter={addLetter} onDeleteLetter={deleteLetter} />;
      case 'scriptures':
        return <BibleScriptures heartedScriptures={heartedScriptures} onToggleHeart={toggleHeartedScripture} />;
      case 'coach':
        return (
          <CoachLive 
            appContext={{
              completedWins: wins.filter(w => w.completed).length,
              totalWins: wins.length,
              activeHabits: masteryHabits.map(h => `${h.label}: ${h.progress}/${h.total}`),
              focusLevel: focusStats.level,
              recentTradeResult: trades.length > 0 ? trades[0].status : "No trades yet"
            }} 
          />
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'wins': return `Welcome ${preferredName || 'PDTrades'}`;
      case 'mastery': return '';
      case 'habits': return 'Habit Engine';
      case 'budget': return 'Visual Budget Planner';
      case 'trading': return 'Trading Performance';
      case 'schedule': return 'Daily Schedule';
      case 'future': return 'Focus & Future';
      case 'scriptures': return 'Saved Bible Scriptures ❤️';
      case 'coach': return 'Live Mastery Coach';
      default: return 'Daily Wins';
    }
  };

  const getDescription = () => {
    if (activeTab === 'wins') return dynamicSubtext;
    switch (activeTab) {
      case 'mastery': return '';
      case 'habits': return 'Calibrate your daily operating protocols for peak neurological performance.';
      case 'budget': return 'Visualize liquidity and secure capital allocation for long-term freedom.';
      case 'trading': return 'Audit execution quality and monitor systemic growth across all desks.';
      case 'schedule': return 'Synchronize your temporal resources with high-value objectives.';
      case 'future': return 'Transmit critical insights across time to secure your future self.';
      case 'scriptures': return 'A personalized collection of verses that have grounded your journey.';
      default: return 'Small daily iterations produce massive yearly transformation.';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#080d0a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 size-[500px] bg-emerald-400/5 blur-[120px] rounded-full pointer-events-none -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 size-[500px] bg-emerald-400/5 blur-[120px] rounded-full pointer-events-none -ml-48 -mb-48"></div>

        <div className="relative z-10 flex flex-col items-center max-w-md w-full animate-in zoom-in-95 duration-700">
          <div className="size-32 bg-[#111a14] rounded-[40px] flex items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(48,232,110,0.2)] border border-white/5 mb-10">
            <svg viewBox="0 0 100 100" className="w-full h-full p-4" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 10 L85 30 V70 L50 90 L15 70 V30 L50 10Z" fill="none" stroke="#30e86e" strokeWidth="4" />
              <path d="M30 60 L50 35 L70 60" fill="none" stroke="#30e86e" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M30 75 L50 50 L70 75" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
            </svg>
          </div>

          <div className="text-center space-y-4 mb-12">
            <h1 className="text-5xl font-black font-display tracking-tighter">Mastery<span className="text-emerald-400">Hub</span></h1>
            <p className="text-slate-500 font-medium leading-relaxed">Systemic architecture for high-performance individuals. Your data is waiting locally.</p>
          </div>

          {preferredName ? (
            <div className="w-full space-y-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="glass p-8 rounded-[36px] border-emerald-400/20 text-center mb-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Identity Locked</p>
                <h2 className="text-3xl font-black text-white tracking-tight">Continue as {preferredName}?</h2>
              </div>
              <button 
                onClick={() => setIsAuthenticated(true)}
                className="w-full py-6 bg-emerald-400 text-[#080d0a] font-black uppercase tracking-[0.3em] rounded-[24px] shadow-2xl shadow-emerald-400/20 active:scale-95 transition-all flex items-center justify-center gap-3 group"
              >
                Continue
                <span className="material-symbols-outlined filled-icon group-hover:translate-x-1 transition-transform">login</span>
              </button>
              <button 
                onClick={handleNewUser}
                className="w-full py-4 text-slate-500 font-black uppercase tracking-[0.2em] rounded-[24px] hover:text-white transition-all text-xs"
              >
                New User
              </button>
            </div>
          ) : (
            <div className="w-full space-y-6 animate-in fade-in duration-500">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-4">Preferred Name</label>
                  <input 
                    type="text" 
                    placeholder="What should we call you?" 
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full glass border-none rounded-2xl p-5 text-sm font-bold focus:ring-1 focus:ring-emerald-400 outline-none text-slate-100 placeholder:text-slate-800" 
                  />
                </div>
              </div>
              
              <button 
                onClick={handleCommence}
                disabled={!nameInput.trim()}
                className="w-full py-6 bg-emerald-400 text-[#080d0a] font-black uppercase tracking-[0.3em] rounded-[24px] shadow-2xl shadow-emerald-400/20 active:scale-95 transition-all flex items-center justify-center gap-3 group disabled:opacity-30"
              >
                Commence Session
              </button>
            </div>
          )}

          <p className="mt-8 text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">Encrypted Local Protocol v1.8</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        title={getTitle()}
        description={getDescription()}
        focusLevel={focusStats.level}
        focusXP={focusStats.xp}
        xpToNext={focusStats.xpToNext}
        onLogout={handleTerminateSession}
        isSidebarCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
      >
        {renderContent()}
      </Layout>
    </>
  );
};

export default App;
