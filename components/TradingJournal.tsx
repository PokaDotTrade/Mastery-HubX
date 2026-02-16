
import React, { useState, useMemo, useRef } from 'react';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid, LineChart, Line } from 'recharts';
import { Trade, Strategy, TradingAccount } from '../types';
// @ts-ignore - Browser compatible jsPDF
import { jsPDF } from 'jspdf';
import { CURRENCY_OPTIONS } from '../constants.tsx';

interface TradingJournalProps {
  trades: Trade[];
  strategies: Strategy[];
  accounts: TradingAccount[];
  onAddTrade?: (trade: Trade) => void;
  onDeleteTrade?: (id: string) => void;
  onAddStrategy?: (strategy: Strategy) => void;
  onDeleteStrategy?: (id: string) => void;
  onAddAccount?: (account: TradingAccount) => void;
  onDeleteAccount?: (id: string) => void;
  onSelectAccount?: (id: string) => void;
  onUpdateAccount?: (id: string, updates: Partial<TradingAccount>) => void;
}

type SubTab = 'dashboard' | 'calendar' | 'execution' | 'playbook';
type ChartView = 'daily' | 'monthly';

const TradingJournal: React.FC<TradingJournalProps> = ({ 
  trades, 
  strategies, 
  accounts, 
  onAddTrade, 
  onDeleteTrade,
  onAddAccount, 
  onDeleteAccount,
  onSelectAccount,
  onUpdateAccount,
  onAddStrategy,
  onDeleteStrategy
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('dashboard');
  const [chartView, setChartView] = useState<ChartView>('daily');
  const [dailyTargetRate, setDailyTargetRate] = useState(5); 
  const [startingCapital, setStartingCapital] = useState<number | null>(null);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteAccountConfirmId, setDeleteAccountConfirmId] = useState<string | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());


  // Playbook Extension State
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [isAddingStrategy, setIsAddingStrategy] = useState(false);
  const [newStrategyName, setNewStrategyName] = useState('');
  const [newStrategyConditions, setNewStrategyConditions] = useState('');
  const [newStrategyRisk, setNewStrategyRisk] = useState('');
  const [newStrategyTag, setNewStrategyTag] = useState('Scalp');
  const [newStrategyModelImage, setNewStrategyModelImage] = useState<string | null>(null);
  const strategyModelInputRef = useRef<HTMLInputElement>(null);

  // New Account Modal State
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<'Live' | 'Prop Firm' | 'Demo'>('Live');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccCurrency, setNewAccCurrency] = useState('$');
  const [newAccPhase, setNewAccPhase] = useState<'Phase 1' | 'Phase 2' | 'Funded'>('Phase 1');
  const [newAccTarget, setNewAccTarget] = useState('');
  const [newAccDailyDD, setNewAccDailyDD] = useState('');
  const [newAccMaxDD, setNewAccMaxDD] = useState('');
  const [newPhase1Target, setNewPhase1Target] = useState('');
  const [newPhase2Target, setNewPhase2Target] = useState('');
  const [newPhase3Target, setNewPhase3Target] = useState('');

  const handleAddAccountSubmit = () => {
    if (!newAccName || !newAccBalance) return;
    
    const balance = parseFloat(newAccBalance);
    const newAccount: TradingAccount = {
      id: Date.now().toString(),
      name: newAccName,
      type: newAccType,
      balance: balance,
      currency: newAccCurrency,
      isPrimary: accounts.length === 0,
    };

    if (newAccType === 'Prop Firm') {
      newAccount.phase = newAccPhase;
      newAccount.targetProfitPct = parseFloat(newAccTarget) || 10;
      newAccount.dailyDrawdownPct = parseFloat(newAccDailyDD) || 5;
      newAccount.maxDrawdownPct = parseFloat(newAccMaxDD) || 10;
      newAccount.initialPhaseBalance = balance;
      if (newPhase1Target) newAccount.phase1Target = parseFloat(newPhase1Target);
      if (newPhase2Target) newAccount.phase2Target = parseFloat(newPhase2Target);
      if (newPhase3Target) newAccount.phase3Target = parseFloat(newPhase3Target);
    }

    onAddAccount?.(newAccount);
    setIsAddingAccount(false);
    
    setNewAccName('');
    setNewAccBalance('');
    setNewAccType('Live');
    setNewAccTarget('');
    setNewAccDailyDD('');
    setNewAccMaxDD('');
    setNewPhase1Target('');
    setNewPhase2Target('');
    setNewPhase3Target('');
  };

  const handleStrategyModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewStrategyModelImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddStrategySubmit = () => {
    if (!newStrategyName.trim()) return;
    const newStrat: Strategy = {
      id: `strat_${Date.now()}`,
      title: newStrategyName,
      description: 'Defined algorithmic edge.',
      tag: newStrategyTag,
      image: newStrategyModelImage || 'https://images.unsplash.com/photo-1611974717482-5813e33b00f7?q=80&w=2000&auto=format&fit=crop',
      modelImage: newStrategyModelImage || undefined,
      notes: newStrategyConditions,
      riskModel: newStrategyRisk
    };
    onAddStrategy?.(newStrat);
    setIsAddingStrategy(false);
    setNewStrategyName('');
    setNewStrategyConditions('');
    setNewStrategyRisk('');
    setNewStrategyModelImage(null);
  };

  const activeAccount = useMemo(() => {
    if (accounts.length === 0) return null;
    return accounts.find(a => a.isPrimary) || accounts[0];
  }, [accounts]);

  const filteredTrades = useMemo(() => {
    if (!activeAccount) return [];
    return [...trades]
      .filter(t => t.accountId === activeAccount.id)
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [trades, activeAccount]);

  const monthlyStats = useMemo(() => {
    const monthTrades = filteredTrades.filter(t => {
      const tradeDate = new Date(t.time);
      return tradeDate.getFullYear() === calendarDate.getFullYear() && tradeDate.getMonth() === calendarDate.getMonth();
    });

    const totalTrades = monthTrades.length;
    if (totalTrades === 0) {
      return { totalTrades: 0, winRate: 0, totalPnl: 0, bestDayPnl: 0, worstDayPnl: 0, avgR: 0 };
    }

    const wins = monthTrades.filter(t => t.pnl > 0).length;
    const winRate = (wins / totalTrades) * 100;
    const totalPnl = monthTrades.reduce((sum, t) => sum + t.pnl, 0);

    const dailyPnl: { [key: string]: number } = {};
    monthTrades.forEach(t => {
      const day = new Date(t.time).toISOString().split('T')[0];
      dailyPnl[day] = (dailyPnl[day] || 0) + t.pnl;
    });
    
    const pnlValues = Object.values(dailyPnl);
    const bestDayPnl = Math.max(0, ...pnlValues);
    const worstDayPnl = Math.min(0, ...pnlValues);

    const parseRR = (rrStr: string = '1:0') => {
      const parts = rrStr.split(':');
      if (parts.length < 2) return 0;
      const val = parseFloat(parts[1]);
      return isNaN(val) ? 0 : val;
    };
    const totalR = monthTrades.reduce((sum, t) => sum + (t.status === 'Win' ? parseRR(t.rr) : -1), 0);
    const avgR = totalR / totalTrades;

    return { totalTrades, winRate, totalPnl, bestDayPnl, worstDayPnl, avgR };
  }, [filteredTrades, calendarDate]);

  const weeklyStats = useMemo(() => {
    const monthTrades = filteredTrades.filter(t => {
        const tradeDate = new Date(t.time);
        return tradeDate.getFullYear() === calendarDate.getFullYear() && tradeDate.getMonth() === calendarDate.getMonth();
    });

    const getWeekOfMonth = (date: Date) => {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        const dayOfMonth = date.getDate();
        return Math.ceil((dayOfMonth + firstDay) / 7);
    };

    const weeklyData: { [key: number]: { pnl: number, days: Set<string> } } = { 1: {pnl: 0, days: new Set()}, 2: {pnl: 0, days: new Set()}, 3: {pnl: 0, days: new Set()}, 4: {pnl: 0, days: new Set()}, 5: {pnl: 0, days: new Set()} };

    monthTrades.forEach(trade => {
        const tradeDate = new Date(trade.time);
        const week = getWeekOfMonth(tradeDate);
        if (weeklyData[week]) {
            weeklyData[week].pnl += trade.pnl;
            weeklyData[week].days.add(tradeDate.toISOString().split('T')[0]);
        }
    });
    
    const totalMonthPnl = monthTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalMonthDays = new Set(monthTrades.map(t => new Date(t.time).toISOString().split('T')[0])).size;

    const result = Object.keys(weeklyData).slice(0, 4).map(weekNumStr => {
        const weekNum = parseInt(weekNumStr);
        return {
            week: `Week ${weekNum}`,
            pnl: weeklyData[weekNum].pnl,
            days: weeklyData[weekNum].days.size,
        };
    });
    
    return {
        weeks: result,
        totalPnl: totalMonthPnl,
        totalDays: totalMonthDays
    };
  }, [filteredTrades, calendarDate]);


  const propFirmIntel = useMemo(() => {
    if (!activeAccount || activeAccount.type !== 'Prop Firm') return null;
    const initialBalance = activeAccount.initialPhaseBalance || activeAccount.balance;
    let targetProfitPercent = activeAccount.targetProfitPct || 10;
    if (activeAccount.phase === 'Phase 1' && activeAccount.phase1Target) targetProfitPercent = activeAccount.phase1Target;
    else if (activeAccount.phase === 'Phase 2' && activeAccount.phase2Target) targetProfitPercent = activeAccount.phase2Target;
    else if (activeAccount.phase === 'Funded' && activeAccount.phase3Target) targetProfitPercent = activeAccount.phase3Target;
    const targetProfitAmount = initialBalance * (targetProfitPercent / 100);
    const dailyDDLimit = initialBalance * ((activeAccount.dailyDrawdownPct || 5) / 100);
    const maxDDLimit = initialBalance * ((activeAccount.maxDrawdownPct || 10) / 100);
    const today = new Date().toISOString().split('T')[0];
    const todayTrades = filteredTrades.filter(t => t.time.startsWith(today));
    const todayPnL = todayTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalPnL = filteredTrades.reduce((sum, t) => sum + t.pnl, 0);
    const profitProgress = Math.min(100, Math.max(0, (totalPnL / targetProfitAmount) * 100));
    const dailyDDConsumed = Math.max(0, (-todayPnL / dailyDDLimit) * 100);
    const maxDDConsumed = Math.max(0, (-totalPnL / maxDDLimit) * 100);
    const getStatus = (pct: number) => {
      if (pct >= 100) return { label: 'BREACHED', color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' };
      if (pct >= 70) return { label: 'CAUTION', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' };
      return { label: 'SAFE', color: 'text-[#30e86e]', bg: 'bg-emerald-400/10 border-emerald-400/20' };
    };
    const remainingToTarget = Math.max(0, targetProfitAmount - totalPnL);
    const estimatedDays = dailyTargetRate > 0 ? Math.ceil(Math.log((initialBalance + targetProfitAmount) / (initialBalance + totalPnL)) / Math.log(1 + (dailyTargetRate / 100))) : 0;
    return { 
      phase: activeAccount.phase || 'Phase 1', 
      targetProfitAmount, 
      dailyDDLimit, 
      maxDDLimit, 
      profitProgress, 
      dailyDDConsumed, 
      maxDDConsumed, 
      dailyStatus: getStatus(dailyDDConsumed), 
      maxStatus: getStatus(maxDDConsumed), 
      remainingToTarget, 
      estimatedDays, 
      todayPnL,
      goalValue: initialBalance + targetProfitAmount
    };
  }, [activeAccount, filteredTrades, dailyTargetRate]);

  const stats = useMemo(() => {
    const totalPnL = filteredTrades.reduce((s, t) => s + t.pnl, 0);
    const baseCapital = startingCapital !== null ? startingCapital : (activeAccount ? activeAccount.balance - totalPnL : 5000);
    const rate = dailyTargetRate / 100;
    const chartData: any[] = [];
    if (chartView === 'daily') {
      let rollingActual = baseCapital;
      let rollingProjected = baseCapital;
      chartData.push({ name: '0', projected: Math.round(baseCapital), actual: Math.round(baseCapital) });
      const maxSteps = Math.max(28, filteredTrades.length + 5);
      for (let i = 1; i <= maxSteps; i++) {
        rollingProjected *= (1 + rate);
        let actualVal = null;
        if (i <= filteredTrades.length) {
          rollingActual += filteredTrades[i - 1].pnl;
          actualVal = Math.round(rollingActual);
        }
        chartData.push({ name: i.toString(), projected: Math.round(rollingProjected), actual: actualVal });
      }
    } else {
      const monthlyGroups: Record<string, number> = {};
      filteredTrades.forEach(t => {
        const monthKey = new Date(t.time).toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyGroups[monthKey] = (monthlyGroups[monthKey] || 0) + t.pnl;
      });
      const months = Object.keys(monthlyGroups);
      let rollingActual = baseCapital;
      let rollingProjected = baseCapital;
      chartData.push({ name: 'Start', projected: Math.round(baseCapital), actual: Math.round(baseCapital) });
      months.forEach(month => {
        for(let d=0; d<20; d++) rollingProjected *= (1 + rate);
        rollingActual += monthlyGroups[month];
        chartData.push({ name: month, projected: Math.round(rollingProjected), actual: Math.round(rollingActual) });
      });
    }
    const currentActual = baseCapital + totalPnL;
    const lastDailyProjected = chartData[Math.min(filteredTrades.length, chartData.length-1)]?.projected || baseCapital;
    const isOnTrack = currentActual >= lastDailyProjected;
    const todayTarget = Math.round(currentActual * rate);
    return { baseCapital, chartData, isOnTrack, todayTarget, totalPnL, currentActual };
  }, [filteredTrades, dailyTargetRate, activeAccount, startingCapital, chartView]);

  const strategyEvaluations = useMemo(() => {
    return strategies.map(strat => {
      const stratTrades = trades.filter(t => t.strategyId === strat.id);
      const totalTrades = stratTrades.length;
      const wins = stratTrades.filter(t => t.pnl > 0).length;
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
      const totalProfit = stratTrades.reduce((sum, t) => sum + t.pnl, 0);
      
      const parseRR = (rrStr: string) => {
        const parts = rrStr.split(':');
        if (parts.length < 2) return 0;
        const val = parseFloat(parts[1]);
        return isNaN(val) ? 0 : val;
      };

      const totalR = stratTrades.reduce((sum, t) => sum + parseRR(t.rr), 0);
      const avgR = totalTrades > 0 ? totalR / totalTrades : 0;
      const averageReturn = totalTrades > 0 ? totalProfit / totalTrades : 0;
      
      const bestTrade = totalTrades > 0 ? Math.max(...stratTrades.map(t => t.pnl)) : 0;
      const worstTrade = totalTrades > 0 ? Math.min(...stratTrades.map(t => t.pnl)) : 0;

      const screenshots = stratTrades.filter(t => t.image).map(t => t.image!);
      const status = (totalProfit < 0 && totalTrades >= 3) ? "Needs Review" : "Optimal";

      return { 
        ...strat, 
        totalTrades, 
        winRate, 
        totalProfit, 
        averageReturn, 
        status, 
        screenshots, 
        bestTrade, 
        worstTrade, 
        avgR,
        linkedTrades: stratTrades
      };
    }).sort((a, b) => b.totalProfit - a.totalProfit);
  }, [strategies, trades]);

  const handleExecuteAccountDeletion = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteAccountConfirmId) {
      onDeleteAccount?.(deleteAccountConfirmId);
      setDeleteAccountConfirmId(null);
    }
  };

  const handleTradeDeletion = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConfirmId) {
      onDeleteTrade?.(deleteConfirmId);
      setDeleteConfirmId(null);
      setViewingTrade(null);
    }
  };

  const renderSubContent = () => {
    if (accounts.length === 0) {
      return (
        <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[48px] animate-fade-in-up">
           <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">account_balance</span>
           <h2 className="text-xl font-black text-slate-500 uppercase tracking-widest">No trading accounts available.</h2>
           <button onClick={() => setIsAddingAccount(true)} className="mt-6 px-8 py-4 bg-emerald-400 text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-400/20 active:scale-95 transition-all">Initialize First Desk</button>
        </div>
      );
    }

    switch (activeSubTab) {
      case 'dashboard':
        return (
          <div className="space-y-12 animate-fade-in-up">
            {activeAccount?.type === 'Prop Firm' && (
              <div className="flex justify-center pt-2">
                <div className="glass px-12 py-6 rounded-[32px] border-white/5 flex items-center gap-12 relative overflow-hidden bg-white/[0.01]">
                  <PhaseStep icon="looks_one" label="EVALUATION" sub="PHASE 1" active={activeAccount?.phase === 'Phase 1'} completed={activeAccount?.phase === 'Phase 2' || activeAccount?.phase === 'Funded'} />
                  <div className="w-12 h-px bg-white/10"></div>
                  <PhaseStep icon="looks_two" label="VERIFICATION" sub="PHASE 2" active={activeAccount?.phase === 'Phase 2'} completed={activeAccount?.phase === 'Funded'} />
                  <div className="w-12 h-px bg-white/10"></div>
                  <PhaseStep icon="verified_user" label="PROFESSIONAL" sub="FUNDED" active={activeAccount?.phase === 'Funded'} completed={false} />
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-1">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.4em]">GROWTH INTELLIGENCE</h2>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button 
                        onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black text-emerald-400 uppercase tracking-widest hover:bg-white/10 transition-all"
                      >
                        Switch Desk
                        <span className="material-symbols-outlined text-xs">expand_more</span>
                      </button>
                      {isSelectorOpen && (
                        <div className="absolute top-full left-0 mt-2 w-56 glass rounded-xl border border-white/10 shadow-2xl z-[50] overflow-hidden py-1">
                          {accounts.map(acc => (
                            <div key={acc.id} className={`flex items-center justify-between px-4 py-2 group transition-all ${acc.id === activeAccount?.id ? 'bg-emerald-400/20' : 'hover:bg-white/5'}`}>
                              <button
                                onClick={() => { onSelectAccount?.(acc.id); setIsSelectorOpen(false); }}
                                className={`flex-1 text-left py-1 text-[10px] font-black uppercase tracking-widest ${acc.id === activeAccount?.id ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white'}`}
                              >
                                {acc.name}
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteAccountConfirmId(acc.id);
                                  setIsSelectorOpen(false);
                                }}
                                className="size-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-rose-500/10 hover:text-rose-500 transition-all disabled:opacity-20 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100"
                                title={`Delete ${acc.name}`}
                                disabled={accounts.length <= 1}
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setIsAddingAccount(true)} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-400/10 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-400/20 hover:scale-[1.03] transition-all">Insert Account</button>
                  </div>
                </div>
                <h1 className="text-xs font-black text-[#30e86e] uppercase tracking-widest">
                  {activeAccount?.type === 'Prop Firm' ? `${activeAccount?.phase?.toUpperCase()} COMPOUND PROTOCOL` : `${dailyTargetRate}% DAILY GROWTH PROTOCOL`}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white/5 px-4 py-2 rounded-xl flex items-center gap-3 border border-white/5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">RATE:</span>
                  <input type="number" value={dailyTargetRate} onChange={(e) => setDailyTargetRate(Number(e.target.value))} className="bg-transparent text-[#30e86e] text-[10px] font-black w-6 outline-none" />
                  <span className="text-[10px] font-black text-[#30e86e]">%</span>
                </div>
                <button className="px-5 py-2.5 bg-blue-500/10 text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all">CONFIGURE RULES</button>
                <button className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white">SET BASE</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-[#111a14] p-8 rounded-[40px] border border-white/5 relative h-44 flex flex-col justify-center transition-all hover:scale-[1.02] shadow-xl group">
                <div className="absolute top-8 right-8 text-emerald-400/20 group-hover:text-emerald-400 transition-colors"><span className="material-symbols-outlined text-3xl">account_balance_wallet</span></div>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">ACTIVE ACCOUNT</p>
                <div className="space-y-3">
                   <div className="space-y-1">
                      <div className="inline-flex px-2 py-0.5 rounded bg-[#1a3324] text-emerald-400 text-[8px] font-black uppercase tracking-[0.2em] mb-1 leading-none">
                         {activeAccount?.type === 'Prop Firm' ? 'PROP' : activeAccount?.type?.toUpperCase()}
                      </div>
                      <h3 className="text-xl font-black text-white truncate leading-tight">{activeAccount?.name}</h3>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <p className="text-[8px] font-black text-slate-500 uppercase">Balance</p>
                         <p className="text-xs font-black text-white">{activeAccount?.currency}{activeAccount?.balance.toLocaleString()}</p>
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-slate-500 uppercase">Equity</p>
                         <p className="text-xs font-black text-emerald-400">{activeAccount?.currency}{activeAccount?.balance.toLocaleString()}</p>
                      </div>
                   </div>
                </div>
              </div>
              <div className="bg-[#111a14] p-8 rounded-[40px] border border-white/5 relative h-44 flex flex-col justify-center transition-all hover:scale-[1.02] shadow-xl group">
                <div className="absolute top-8 right-8 text-slate-800 group-hover:text-emerald-400/20 transition-colors"><span className="material-symbols-outlined text-3xl">target</span></div>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">TODAY'S OBJECTIVE</p>
                <h3 className="text-4xl font-black text-white tracking-tighter">{activeAccount?.currency}{stats.todayTarget.toLocaleString()}</h3>
                <p className="text-[9px] font-black text-[#30e86e] uppercase tracking-widest mt-3">MAINTAINING PACE</p>
              </div>
              {activeAccount?.type === 'Prop Firm' && propFirmIntel ? (
                <div className="bg-[#111a14] p-8 rounded-[40px] border border-white/5 relative h-44 flex flex-col justify-center transition-all hover:scale-[1.02] shadow-xl group">
                  <div className="absolute top-8 right-8 text-rose-500/10"><span className="material-symbols-outlined text-3xl">warning</span></div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">DRAWDOWN HEADROOM</p>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">DAILY MAX</p>
                        <p className="text-lg font-black text-[#30e86e]">{activeAccount?.currency}{propFirmIntel.dailyDDLimit.toLocaleString()}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-[8px] font-black border ${propFirmIntel.dailyStatus.bg} ${propFirmIntel.dailyStatus.color}`}>{propFirmIntel.dailyStatus.label}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#111a14] p-8 rounded-[40px] border border-white/5 relative h-44 flex flex-col justify-center transition-all hover:scale-[1.02] shadow-xl group">
                  <div className="absolute top-8 right-8 text-[#30e86e]/10"><span className="material-symbols-outlined text-3xl filled-icon">verified_user</span></div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">PERFORMANCE STATUS</p>
                  <h3 className={`text-3xl font-black tracking-tight ${stats.isOnTrack ? 'text-[#30e86e]' : 'text-rose-500'}`}>{stats.isOnTrack ? 'ON TRACK' : 'OFF PACE'}</h3>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-3">EFFICIENCY PROTOCOL OPTIMAL</p>
                </div>
              )}
              {activeAccount?.type === 'Prop Firm' && propFirmIntel ? (
                <div className="bg-[#111a14] p-8 rounded-[40px] border border-white/5 relative h-44 flex flex-col justify-center transition-all hover:scale-[1.02] shadow-xl group">
                  <div className="absolute top-8 right-8 text-emerald-400/10"><span className="material-symbols-outlined text-3xl">trending_up</span></div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{activeAccount?.phase?.toUpperCase()} TRAJECTORY</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-[#30e86e] tracking-tight">{propFirmIntel.profitProgress.toFixed(1)}%</h3>
                  </div>
                  <div className="relative h-1.5 w-full bg-emerald-400/5 rounded-full overflow-hidden mt-4">
                    <div className="h-full bg-[#30e86e] shadow-[0_0_15px_rgba(48,232,110,0.5)] transition-all duration-1000 relative z-10" style={{ width: `${propFirmIntel.profitProgress}%` }}></div>
                  </div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-4">GOAL: {activeAccount?.currency}{propFirmIntel.goalValue.toLocaleString()}</p>
                </div>
              ) : (
                <div className="bg-[#111a14] p-8 rounded-[40px] border border-white/5 relative h-44 flex flex-col justify-center transition-all hover:scale-[1.02] shadow-xl group">
                  <div className="absolute top-8 right-8 text-slate-800 group-hover:text-emerald-400/20 transition-colors"><span className="material-symbols-outlined text-3xl">monitoring</span></div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">PORTFOLIO DELTA</p>
                  <h3 className={`text-4xl font-black tracking-tighter ${stats.totalPnL >= 0 ? 'text-[#30e86e]' : 'text-rose-500'}`}>{stats.totalPnL >= 0 ? '+' : ''}{activeAccount?.currency || '$'}{Math.abs(stats.totalPnL).toLocaleString()}</h3>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-3">PERIOD P&L DISTRIBUTION</p>
                </div>
              )}
            </div>

            <div className="bg-[#111a14] rounded-[48px] p-10 border border-white/5 relative overflow-hidden shadow-2xl">
              <div className="flex justify-end gap-6 mb-6">
                <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-[#30e86e]"></div><span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">ACTUAL</span></div>
                <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-[#3b82f6]"></div><span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">COMPOUNDING TARGET ({dailyTargetRate}%)</span></div>
              </div>
              <div className="h-[450px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs><linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#30e86e" stopOpacity={0.2}/><stop offset="95%" stopColor="#30e86e" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#333', fontSize: 10, fontWeight: 900 }} dy={10} />
                    <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: '#333', fontSize: 10, fontWeight: 900 }} tickFormatter={(val) => `${activeAccount?.currency || '$'}${val.toLocaleString()}`} />
                    <Tooltip contentStyle={{ backgroundColor: '#111a14', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }} itemStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }} />
                    <Area type="monotone" dataKey="actual" stroke="#30e86e" strokeWidth={4} fillOpacity={1} fill="url(#colorActual)" connectNulls />
                    <Line type="monotone" dataKey="projected" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <section className="space-y-4 no-print animate-fade-in-up">
              <div className="flex justify-between items-center px-1"><h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">EXECUTION TAPE</h2></div>
              {filteredTrades.length > 0 ? (
                filteredTrades.slice().reverse().map((trade, index) => (
                  <div key={trade.id} className="animate-fade-in-up" style={{ animationDelay: `${200 + index * 50}ms` }}>
                    <TradeCard trade={trade} currency={activeAccount?.currency || '$'} onDelete={() => setDeleteConfirmId(trade.id)} onClick={() => setViewingTrade(trade)} />
                  </div>
                ))
              ) : (<div className="py-12 text-center border border-dashed border-white/5 rounded-[32px] opacity-20 text-[10px] font-black uppercase tracking-widest">Awaiting execution data</div>)}
            </section>
          </div>
        );
      case 'calendar': 
        return (
          <div className="space-y-12">
            <TradingCalendar 
              trades={filteredTrades} 
              currency={activeAccount?.currency || '$'} 
              strategies={strategies} 
              currentDate={calendarDate}
              setCurrentDate={setCalendarDate}
            />
            <section className="space-y-6 animate-fade-in-up">
              <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 px-1">
                Monthly Performance Intel ({calendarDate.toLocaleString('default', { month: 'long' })})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                 <StatCard label="Total Trades" value={monthlyStats.totalTrades} icon="terminal" color="slate" />
                 <StatCard label="Win Rate" value={`${monthlyStats.winRate.toFixed(1)}%`} icon="verified" color="emerald" />
                 <StatCard 
                   label="Net P&L" 
                   value={`${activeAccount?.currency || '$'}${monthlyStats.totalPnl.toLocaleString()}`} 
                   icon="payments" 
                   color={monthlyStats.totalPnl >= 0 ? 'emerald' : 'rose'} 
                 />
                 <StatCard label="Best Day" value={`${activeAccount?.currency || '$'}${monthlyStats.bestDayPnl.toLocaleString()}`} icon="calendar_month" color="emerald" />
                 <StatCard label="Worst Day" value={`${activeAccount?.currency || '$'}${monthlyStats.worstDayPnl.toLocaleString()}`} icon="calendar_month" color="rose" />
                 <StatCard label="Average R" value={`${monthlyStats.avgR.toFixed(2)}R`} icon="trending_up" color="blue" />
              </div>

              <div className="bg-[#111a14] p-8 rounded-[32px] border border-white/5 mt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-base font-black text-white">Monthly stats</p>
                      <p className="text-xs text-slate-500">{weeklyStats.totalDays} days</p>
                    </div>
                    <p className="text-base font-black text-white">
                      {activeAccount?.currency}{weeklyStats.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  <div className="pt-2"></div> 

                  {weeklyStats.weeks.map((weekData, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-slate-300">{weekData.week}</p>
                        <p className="text-xs text-slate-500">{weekData.days} days</p>
                      </div>
                      <p className={`text-sm font-bold ${weekData.pnl >= 0 ? 'text-white' : 'text-rose-500'}`}>
                        {activeAccount?.currency}{weekData.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 mt-6"></div>
              </div>

            </section>
          </div>
        );
      case 'execution': return <TradeEntry activeAccount={activeAccount} accounts={accounts} strategies={strategies} onCommit={(t) => { onAddTrade?.(t); setActiveSubTab('dashboard'); }} />;
      case 'playbook': {
        const selectedStrat = strategyEvaluations.find(s => s.id === selectedStrategyId);
        
        if (selectedStrat) {
          return (
            <div className="space-y-12 animate-fade-in-up pb-20">
              <div className="flex items-center gap-4 px-1">
                <button onClick={() => setSelectedStrategyId(null)} className="size-10 glass rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="text-2xl font-black text-white">{selectedStrat.title} Intelligence</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard label="Win Rate" value={`${selectedStrat.winRate.toFixed(1)}%`} icon="verified" color="emerald" />
                <StatCard label="Total P&L" value={`${activeAccount?.currency || '$'}${selectedStrat.totalProfit.toLocaleString()}`} icon="payments" color={selectedStrat.totalProfit >= 0 ? 'emerald' : 'rose'} />
                <StatCard label="Avg Efficiency" value={`${selectedStrat.avgR.toFixed(1)}R`} icon="trending_up" color="blue" />
                <StatCard label="Total Trades" value={selectedStrat.totalTrades} icon="terminal" color="slate" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <StatCard label="Best Trade" value={`${activeAccount?.currency || '$'}${selectedStrat.bestTrade.toLocaleString()}`} icon="star" color="emerald" />
                 <StatCard label="Worst Trade" value={`${activeAccount?.currency || '$'}${selectedStrat.worstTrade.toLocaleString()}`} icon="warning" color="rose" />
              </div>

              {selectedStrat.modelImage && (
                <section className="space-y-6">
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest px-1">Model Blueprint</h3>
                  <div className="glass p-4 rounded-[40px] border-white/10 bg-[#0d120f] overflow-hidden max-w-2xl">
                    <div 
                      onClick={() => setFullscreenImage(selectedStrat.modelImage!)}
                      className="aspect-video relative rounded-[28px] overflow-hidden cursor-zoom-in group"
                    >
                      <img src={selectedStrat.modelImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Model Blueprint" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-3xl">zoom_in</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              <section className="glass p-10 rounded-[40px] border-white/5 bg-white/[0.01] space-y-8">
                <div className="flex justify-between items-center"><h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Protocol Conditions</h3><button className="text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:underline">Update Criteria</button></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <ConditionRow label="Market Condition" value={selectedStrat.marketCondition || "Trending / High Volatility"} />
                  <ConditionRow label="Preferred Timeframe" value={selectedStrat.timeframe || "1m / 5m Context"} />
                  <ConditionRow label="Entry Criteria" value={selectedStrat.entryCriteria || "FVG + Liquidity Sweep"} />
                  <ConditionRow label="Risk Model" value={selectedStrat.riskModel || "0.5% Fixed"} />
                </div>
                <div className="pt-6 border-t border-white/5"><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Notes</p><p className="text-sm text-slate-300 leading-relaxed italic">{selectedStrat.notes || "No detailed implementation notes archived."}</p></div>
              </section>

              <section className="space-y-6">
                 <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest px-1">Linked Trades</h3>
                 <div className="space-y-3">
                   {selectedStrat.linkedTrades.slice().reverse().map(t => (
                     <div key={t.id} className="glass p-5 rounded-[24px] border-white/5 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer" onClick={() => setViewingTrade(t)}>
                        <div className="flex items-center gap-4">
                           <span className={`text-[10px] font-black px-2 py-1 rounded bg-white/5 ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>{t.pair}</span>
                           <span className="text-[10px] font-black text-slate-600">{new Date(t.time).toLocaleDateString()}</span>
                        </div>
                        <div className="text-right">
                           <p className={`text-sm font-black ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>{t.pnl >= 0 ? '+' : ''}{activeAccount?.currency || '$'}{t.pnl.toLocaleString()}</p>
                           <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">{t.rr}</p>
                        </div>
                     </div>
                   ))}
                   {selectedStrat.linkedTrades.length === 0 && <p className="text-xs text-slate-600 italic px-1">No executions recorded for this strategy.</p>}
                 </div>
              </section>

              <section className="space-y-6">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest px-1">Strategy Archive Gallery</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {selectedStrat.linkedTrades.filter(t => t.image).map((t) => (
                    <div key={t.id} className="bg-[#111a14] rounded-3xl border border-white/5 overflow-hidden flex flex-col hover:border-emerald-400/20 transition-all group shadow-xl">
                      <div onClick={() => setViewingTrade(t)} className="aspect-video relative overflow-hidden cursor-pointer">
                        <img src={t.image} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" alt="Trade Evidence" />
                        <div className="absolute inset-0 bg-emerald-400/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><span className="material-symbols-outlined text-white">zoom_in</span></div>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(t.time).toLocaleDateString()}</p>
                            <p className={`text-lg font-black ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>{t.pnl >= 0 ? '+' : ''}{activeAccount?.currency || '$'}${t.pnl.toLocaleString()}</p>
                          </div>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.rr} R:R</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          );
        } else {
          return (
            <div className="space-y-12 animate-fade-in-up">
              <div className="flex justify-between items-center px-1">
                <h2 className="text-xl font-black text-white">Strategy Playbook</h2>
                <button onClick={() => setIsAddingStrategy(true)} className="px-6 py-3 bg-emerald-400 text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-lg shadow-emerald-400/20 active:scale-95 transition-all">New Protocol</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {strategyEvaluations.map(strat => (
                  <div key={strat.id} onClick={() => setSelectedStrategyId(strat.id)} className="glass p-8 rounded-[40px] border-white/5 flex flex-col gap-6 cursor-pointer hover:border-emerald-400/20 group transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-400/10">{strat.tag}</span>
                        <h3 className="text-2xl font-black mt-3 text-white tracking-tight font-display group-hover:text-emerald-400 transition-colors">{strat.title}</h3>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteStrategy?.(strat.id) }} className="size-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-rose-500/10 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-black text-white">{strat.winRate.toFixed(0)}%</p>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Win Rate</p>
                      </div>
                      <div>
                        <p className={`text-lg font-black ${strat.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>{strat.totalProfit >= 0 ? '+' : ''}{activeAccount?.currency || '$'}{Math.abs(strat.totalProfit).toLocaleString()}</p>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Net PnL</p>
                      </div>
                      <div>
                        <p className="text-lg font-black text-white">{strat.totalTrades}</p>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Trades</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
      }
      default: return null;
    }
  };

  return (
    <div className="space-y-12 pt-4">
      <div className="flex items-center gap-1 p-1 rounded-full bg-[#111a14] border border-white/5">
        {(['dashboard', 'calendar', 'execution', 'playbook'] as SubTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`flex-1 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-colors duration-300 whitespace-nowrap ${
              activeSubTab === tab 
              ? 'bg-emerald-400 text-black shadow-md shadow-emerald-400/20' 
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="mt-8">{renderSubContent()}</div>

      {/* MODALS SECTION */}

      {isAddingAccount && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsAddingAccount(false)}>
          <div className="w-full max-w-lg bg-[#111a14] border border-white/10 rounded-[40px] shadow-2xl p-10 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black font-display tracking-tight text-white">Initialize New Desk</h2>
              <button onClick={() => setIsAddingAccount(false)} className="size-10 glass rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Desk Name</label>
                <input type="text" value={newAccName} onChange={(e) => setNewAccName(e.target.value)} className="w-full glass border-none rounded-2xl p-4 text-sm font-bold focus:ring-1 focus:ring-emerald-400 outline-none text-slate-200 bg-[#0d120f]" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Account Type</label>
                <select value={newAccType} onChange={(e) => setNewAccType(e.target.value as any)} className="w-full glass border-none rounded-2xl p-4 text-sm font-bold text-slate-200 bg-[#0d120f] outline-none">
                  <option>Live</option><option>Prop Firm</option><option>Demo</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Initial Balance</label>
                <input type="number" value={newAccBalance} onChange={(e) => setNewAccBalance(e.target.value)} className="w-full glass border-none rounded-2xl p-4 text-sm font-bold focus:ring-1 focus:ring-emerald-400 outline-none text-slate-200 bg-[#0d120f]" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Currency</label>
                <select value={newAccCurrency} onChange={(e) => setNewAccCurrency(e.target.value)} className="w-full glass border-none rounded-2xl p-4 text-sm font-bold text-slate-200 bg-[#0d120f] outline-none">
                  {CURRENCY_OPTIONS.map(c => <option key={c.code} value={c.symbol}>{c.label}</option>)}
                </select>
              </div>
              {newAccType === 'Prop Firm' && (
                <>
                  <div className="space-y-2 md:col-span-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Evaluation Phase</label>
                     <select value={newAccPhase} onChange={(e) => setNewAccPhase(e.target.value as any)} className="w-full glass border-none rounded-2xl p-4 text-sm font-bold text-slate-200 bg-[#0d120f] outline-none">
                       <option>Phase 1</option><option>Phase 2</option><option>Funded</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Profit Target %</label>
                     <input type="number" value={newAccTarget} onChange={(e) => setNewAccTarget(e.target.value)} placeholder="e.g. 10" className="w-full glass border-none rounded-2xl p-4 text-sm font-bold focus:ring-1 focus:ring-emerald-400 outline-none text-slate-200 bg-[#0d120f]" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Daily DD %</label>
                     <input type="number" value={newAccDailyDD} onChange={(e) => setNewAccDailyDD(e.target.value)} placeholder="e.g. 5" className="w-full glass border-none rounded-2xl p-4 text-sm font-bold focus:ring-1 focus:ring-emerald-400 outline-none text-slate-200 bg-[#0d120f]" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Max DD %</label>
                     <input type="number" value={newAccMaxDD} onChange={(e) => setNewAccMaxDD(e.target.value)} placeholder="e.g. 10" className="w-full glass border-none rounded-2xl p-4 text-sm font-bold focus:ring-1 focus:ring-emerald-400 outline-none text-slate-200 bg-[#0d120f]" />
                  </div>
                </>
              )}
              <div className="md:col-span-2">
                <button onClick={handleAddAccountSubmit} className="w-full py-5 bg-emerald-400 text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-400/20 active:scale-95 transition-all">Create Account</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingTrade && <TradeDetailModal trade={viewingTrade} currency={activeAccount?.currency || '$'} onClose={() => setViewingTrade(null)} onZoomImage={setFullscreenImage} onDelete={() => setDeleteConfirmId(viewingTrade.id)} />}
      
      {fullscreenImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setFullscreenImage(null)}>
          <img src={fullscreenImage} alt="Trade chart" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
        </div>
      )}
      
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setDeleteConfirmId(null)}>
          <div className="w-full max-w-md bg-[#111a14] border border-rose-500/20 rounded-[40px] shadow-2xl p-10 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-black font-display tracking-tight text-white">Confirm Deletion</h2>
              <p className="text-sm text-slate-400">Are you sure you want to permanently delete this trade record?</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => setDeleteConfirmId(null)} className="py-4 bg-white/5 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all border border-white/5">Cancel</button>
              <button onClick={handleTradeDeletion} className="py-4 bg-rose-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-500/20 active:scale-95 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}

      {deleteAccountConfirmId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setDeleteAccountConfirmId(null)}>
          <div className="w-full max-w-md bg-[#111a14] border border-rose-500/20 rounded-[40px] shadow-2xl p-10 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-6">
              <div className="size-16 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 border-2 border-rose-500/20">
                <span className="material-symbols-outlined text-4xl">warning</span>
              </div>
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-black font-display tracking-tight text-white">Confirm Deletion</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Are you sure you want to permanently delete this account? This will also remove all associated trades. This cannot be undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-10">
              <button 
                onClick={() => setDeleteAccountConfirmId(null)}
                className="py-4 bg-white/5 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all border border-white/5"
              >
                Cancel
              </button>
              <button 
                onClick={handleExecuteAccountDeletion}
                className="py-4 bg-rose-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-500/20 active:scale-95 transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddingStrategy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsAddingStrategy(false)}>
          <div className="w-full max-w-lg bg-[#111a14] border border-white/10 rounded-[40px] shadow-2xl p-10 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-black font-display tracking-tight text-white mb-8">New Trading Protocol</h2>
            <div className="space-y-6">
              <input type="text" placeholder="Protocol Name" value={newStrategyName} onChange={(e) => setNewStrategyName(e.target.value)} className="w-full glass border-none rounded-2xl p-4 text-sm font-bold focus:ring-1 focus:ring-emerald-400 outline-none text-slate-200 bg-[#0d120f]" />
              <textarea placeholder="Conditions & Notes" value={newStrategyConditions} onChange={(e) => setNewStrategyConditions(e.target.value)} className="w-full h-24 glass border-none rounded-2xl p-4 text-sm font-medium focus:ring-1 focus:ring-emerald-400 outline-none text-slate-200 resize-none bg-[#0d120f]" />
              <input type="text" placeholder="Risk Model (e.g., 0.5% Fixed)" value={newStrategyRisk} onChange={(e) => setNewStrategyRisk(e.target.value)} className="w-full glass border-none rounded-2xl p-4 text-sm font-bold focus:ring-1 focus:ring-emerald-400 outline-none text-slate-200 bg-[#0d120f]" />
              <button onClick={() => strategyModelInputRef.current?.click()} className="w-full py-4 bg-white/5 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all border border-white/5">{newStrategyModelImage ? 'Blueprint Attached' : 'Attach Blueprint Image'}</button>
              <input type="file" accept="image/*" ref={strategyModelInputRef} onChange={handleStrategyModelUpload} className="hidden" />
              <button onClick={handleAddStrategySubmit} className="w-full py-5 bg-emerald-400 text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-400/20 active:scale-95 transition-all">Archive Protocol</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// --- Helper & Sub-Components ---

const PhaseStep = ({ icon, label, sub, active, completed }: { icon: string, label: string, sub: string, active: boolean, completed: boolean }) => (
  <div className={`flex items-center gap-4 transition-all ${active ? 'opacity-100' : 'opacity-20'} ${completed ? 'grayscale' : ''}`}>
    <div className={`size-12 rounded-2xl flex items-center justify-center border-2 ${active ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 'bg-white/5 text-slate-500 border-white/5'}`}>
      <span className="material-symbols-outlined filled-icon text-2xl">{icon}</span>
    </div>
    <div>
      <p className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-emerald-400' : 'text-slate-500'}`}>{label}</p>
      <p className="text-[9px] font-black text-slate-700 uppercase">{sub}</p>
    </div>
  </div>
);

const TradeCard = ({ trade, currency, onDelete, onClick }: { trade: Trade, currency: string, onDelete: () => void, onClick: () => void }) => {
  const isWin = trade.pnl > 0;
  return (
    <div onClick={onClick} className={`group relative p-6 rounded-[32px] border flex items-center justify-between transition-all cursor-pointer ${isWin ? 'bg-emerald-400/[0.03] border-emerald-400/10 hover:border-emerald-400/20' : 'bg-rose-500/[0.03] border-rose-500/10 hover:border-rose-500/20'}`}>
      <div className="flex items-center gap-6">
        <div className={`size-14 rounded-2xl flex items-center justify-center text-2xl font-black ${isWin ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'}`}>{trade.type === 'LONG' ? 'L' : 'S'}</div>
        <div>
          <h3 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors">{trade.pair}</h3>
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">
            {new Date(trade.time).toLocaleString()} • {trade.rr} R:R
          </p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className={`text-2xl font-black tracking-tighter ${isWin ? 'text-emerald-400' : 'text-rose-500'}`}>{isWin ? '+' : ''}{currency}{trade.pnl.toLocaleString()}</p>
          <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{trade.status}</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="size-10 rounded-xl bg-white/5 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/10 hover:text-rose-500"><span className="material-symbols-outlined text-lg">delete</span></button>
      </div>
    </div>
  );
};

const TradeDetailModal = ({ trade, currency, onClose, onZoomImage, onDelete }: { trade: Trade, currency: string, onClose: () => void, onZoomImage: (src: string) => void, onDelete: () => void }) => {
  const isWin = trade.pnl > 0;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div className="w-full max-w-4xl bg-[#0d120f] border border-white/10 rounded-[40px] shadow-2xl p-10 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-8">
          <div>
            <span className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border ${isWin ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>{trade.status}</span>
            <h2 className="text-4xl font-black font-display tracking-tight text-white mt-4">{trade.pair} {trade.type}</h2>
            <p className="text-sm text-slate-500 font-bold">{new Date(trade.time).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="size-12 glass rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <InfoPill label="PNL" value={`${isWin ? '+' : ''}${currency}${trade.pnl}`} isWin={isWin} />
              <InfoPill label="R:R" value={trade.rr} />
              <InfoPill label="Mood" value={trade.mood || 'N/A'} />
            </div>
            {trade.reflection && (
              <div className="glass p-6 rounded-3xl border-white/5 space-y-4">
                <ReflectionRow label="What went right?" text={trade.reflection.right} />
                <ReflectionRow label="What went wrong?" text={trade.reflection.wrong} />
                <ReflectionRow label="How to improve?" text={trade.reflection.improve} />
              </div>
            )}
            <button onClick={onDelete} className="w-full py-4 text-rose-500 font-black uppercase text-[10px] tracking-widest bg-rose-500/10 rounded-2xl border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all">Delete Execution Record</button>
          </div>
          <div className="space-y-6">
            {trade.image ? (
              <div onClick={() => onZoomImage(trade.image!)} className="aspect-video bg-[#111a14] rounded-3xl border border-white/5 overflow-hidden group cursor-zoom-in">
                <img src={trade.image} alt="Trade chart" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            ) : (
              <div className="aspect-video bg-white/[0.02] rounded-3xl border border-dashed border-white/5 flex items-center justify-center text-slate-700 text-sm font-black uppercase tracking-widest">No chart attached</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoPill = ({ label, value, isWin }: { label: string, value: string, isWin?: boolean }) => (
  <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/5">
    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    <p className={`text-base font-black mt-1 ${isWin === true ? 'text-emerald-400' : isWin === false ? 'text-rose-500' : 'text-white'}`}>{value}</p>
  </div>
);

const ReflectionRow = ({ label, text }: { label: string, text: string }) => (
  <div>
    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    <p className="text-sm text-slate-300 font-medium italic mt-1">"{text}"</p>
  </div>
);

const TradingCalendar = ({ trades, currency, strategies, currentDate, setCurrentDate }: { trades: Trade[], currency: string, strategies: Strategy[], currentDate: Date, setCurrentDate: (date: Date) => void }) => {

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const daysInMonth = useMemo(() => {
    const days = [];
    const startingDay = firstDayOfMonth.getDay();

    // Days from previous month
    for (let i = 0; i < startingDay; i++) {
      const d = new Date(firstDayOfMonth);
      d.setDate(d.getDate() - (startingDay - i));
      days.push({ date: d, isCurrentMonth: false, trades: [] });
    }

    // Days in current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const dayTrades = trades.filter(t => new Date(t.time).toDateString() === d.toDateString());
      days.push({ date: d, isCurrentMonth: true, trades: dayTrades });
    }
    
    // Days from next month to fill grid
    const remaining = 42 - days.length; // 6 weeks grid
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(lastDayOfMonth);
      d.setDate(d.getDate() + i);
      days.push({ date: d, isCurrentMonth: false, trades: [] });
    }
    
    return days;
  }, [currentDate, trades]);
  
  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };
  
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="glass p-8 rounded-[48px] border-white/5 animate-fade-in-up">
      <header className="flex justify-between items-center mb-8 px-2">
        <h2 className="text-2xl font-black text-white">
          {currentDate.toLocaleString('default', { month: 'long' })} <span className="text-slate-600">{currentDate.getFullYear()}</span>
        </h2>
        <div className="flex gap-2">
          <button onClick={() => changeMonth(-1)} className="size-10 glass rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 h-10 glass rounded-full text-xs font-black uppercase text-slate-400 hover:text-white transition-colors tracking-widest">Today</button>
          <button onClick={() => changeMonth(1)} className="size-10 glass rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-px">
        {weekDays.map(day => (
          <div key={day} className="text-center text-[10px] font-black text-slate-600 uppercase tracking-widest pb-4">{day}</div>
        ))}

        {daysInMonth.map(({ date, isCurrentMonth, trades: dayTrades }, index) => {
          const isToday = new Date().toDateString() === date.toDateString();
          return (
            <div 
              key={index} 
              className={`min-h-[120px] p-2 bg-white/[0.01] transition-colors ${
                isCurrentMonth ? 'border-t border-l border-white/5' : ''
              } ${!isCurrentMonth ? 'opacity-30' : ''}`}
            >
              <div className={`flex items-center justify-center size-8 rounded-full text-xs font-black ${
                isToday ? 'bg-emerald-400 text-black' : 'text-slate-400'
              }`}>
                {date.getDate()}
              </div>
              <div className="space-y-1 mt-2">
                {dayTrades.map(trade => (
                  <div key={trade.id} className={`px-2 py-1 rounded text-[9px] font-black leading-tight truncate ${
                    trade.status === 'Win' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    {trade.pair} {trade.pnl > 0 ? '+' : ''}{currency}{trade.pnl}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TradeEntry = ({ activeAccount, accounts, strategies, onCommit }: { activeAccount: TradingAccount | null, accounts: TradingAccount[], strategies: Strategy[], onCommit: (trade: Trade) => void }) => {
  const [pair, setPair] = useState('');
  const [type, setType] = useState<'LONG' | 'SHORT'>('LONG');
  const [pnl, setPnl] = useState('');
  const [rr, setRr] = useState('');
  const [strategyId, setStrategyId] = useState<string | undefined>(strategies[0]?.id || undefined);
  const [mood, setMood] = useState<'Confident' | 'Hesitant' | 'Overconfident' | 'Disciplined' | 'Emotional'>('Disciplined');
  const [reflectionWrong, setReflectionWrong] = useState('');
  const [reflectionRight, setReflectionRight] = useState('');
  const [reflectionImprove, setReflectionImprove] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pair || !pnl || !rr || !activeAccount) return;
    
    const pnlNum = parseFloat(pnl);
    const newTrade: Trade = {
      id: `trade_${Date.now()}`,
      accountId: activeAccount.id,
      pair: pair.toUpperCase(),
      type,
      pnl: pnlNum,
      rr,
      strategyId,
      mood,
      status: pnlNum > 0 ? 'Win' : pnlNum < 0 ? 'Loss' : 'Breakeven',
      time: new Date().toISOString(),
      entry: 0, // Placeholder
      reflection: {
        wrong: reflectionWrong,
        right: reflectionRight,
        improve: reflectionImprove,
        additional: ''
      },
      image: image || undefined
    };
    onCommit(newTrade);
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in-up">
      <div className="text-center">
        <h2 className="text-3xl font-black font-display text-white">Log New Execution</h2>
        <p className="text-slate-500 mt-2">Archive trade data for performance analysis.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass p-10 rounded-[48px] border-white/5 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <FormInput label="Asset / Pair" value={pair} onChange={setPair} placeholder="e.g. NAS100" />
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Bias / Type</label>
              <div className="flex p-1 bg-white/5 rounded-2xl gap-1">
                <button type="button" onClick={() => setType('LONG')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${type === 'LONG' ? 'bg-emerald-400 text-[#080d0a]' : 'text-slate-500'}`}>Long</button>
                <button type="button" onClick={() => setType('SHORT')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${type === 'SHORT' ? 'bg-rose-500 text-white' : 'text-slate-500'}`}>Short</button>
              </div>
            </div>

            <FormInput label="Net P&L" value={pnl} onChange={setPnl} placeholder="e.g. 450.50" type="number" currency={activeAccount?.currency || '$'}/>
            <FormInput label="Risk / Reward" value={rr} onChange={setRr} placeholder="e.g. 1:3"/>
          </div>
          
          <div className="space-y-6">
            <FormSelect label="Strategy Protocol" value={strategyId} onChange={setStrategyId}>
              {strategies.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </FormSelect>
            <FormSelect label="Execution Mood" value={mood} onChange={setMood as any}>
              <option>Disciplined</option><option>Confident</option><option>Hesitant</option><option>Emotional</option><option>Overconfident</option>
            </FormSelect>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">What went wrong?</label>
                <textarea 
                  value={reflectionWrong}
                  onChange={(e) => setReflectionWrong(e.target.value)}
                  placeholder="e.g., Emotional entry, FOMO..."
                  className="w-full h-20 glass border-none rounded-2xl p-4 text-sm font-medium focus:ring-1 focus:ring-emerald-400 outline-none text-slate-200 resize-none bg-[#0d120f]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">What went right?</label>
                <textarea 
                  value={reflectionRight}
                  onChange={(e) => setReflectionRight(e.target.value)}
                  placeholder="e.g., Honored stop-loss, patient..."
                  className="w-full h-20 glass border-none rounded-2xl p-4 text-sm font-medium focus:ring-1 focus:ring-emerald-400 outline-none text-slate-200 resize-none bg-[#0d120f]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">How to improve?</label>
                <textarea 
                  value={reflectionImprove}
                  onChange={(e) => setReflectionImprove(e.target.value)}
                  placeholder="e.g., Wait for confirmation candle..."
                  className="w-full h-20 glass border-none rounded-2xl p-4 text-sm font-medium focus:ring-1 focus:ring-emerald-400 outline-none text-slate-200 resize-none bg-[#0d120f]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row gap-6 justify-between items-center">
           <button 
              type="button" 
              onClick={() => imageInputRef.current?.click()}
              className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-white/5 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all border border-white/5 text-xs"
           >
              <span className="material-symbols-outlined text-lg">{image ? 'check_circle' : 'add_photo_alternate'}</span>
              {image ? 'Chart Attached' : 'Attach Chart'}
           </button>
           <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />

           <button type="submit" className="w-full md:w-auto py-5 px-12 bg-emerald-400 text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-400/20 active:scale-95 transition-all">Commit Execution</button>
        </div>
      </form>
    </div>
  );
};

const FormInput = ({ label, value, onChange, placeholder, type = 'text', currency }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{label}</label>
    <div className="relative">
      {currency && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-600">{currency}</span>}
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder}
        className={`w-full glass border-none rounded-2xl p-4 text-sm font-bold focus:ring-1 focus:ring-emerald-400 outline-none text-slate-200 bg-[#0d120f] ${currency ? 'pl-8' : ''}`}
      />
    </div>
  </div>
);

const FormSelect = ({ label, value, onChange, children }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full glass border-none rounded-2xl p-4 text-sm font-bold text-slate-200 bg-[#0d120f] outline-none">
      {children}
    </select>
  </div>
);

const StatCard = ({ label, value, icon, color }: { label: string, value: any, icon: string, color: 'emerald' | 'rose' | 'blue' | 'slate' }) => {
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    slate: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  };
  return (
    <div className={`glass p-6 rounded-[32px] border-white/5 flex items-center gap-6 ${colors[color]}`}>
      <div className="size-12 rounded-2xl bg-current/10 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-2xl text-current filled-icon">{icon}</span>
      </div>
      <div>
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-white mt-1">{value}</p>
      </div>
    </div>
  );
};

const ConditionRow = ({ label, value }: { label: string, value: string }) => (
  <div>
    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">{label}</p>
    <p className="text-base font-bold text-white">{value}</p>
  </div>
);

export default TradingJournal;
