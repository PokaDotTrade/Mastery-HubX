
import React, { useState, useMemo } from 'react';
import { TradingAccount, Strategy, Phase } from '../types.ts';
import { PHASE_SETTINGS } from '../constants.tsx';

interface RiskControlCenterProps {
    activeAccount: TradingAccount | null;
    strategies: Strategy[];
}

const RiskControlCenter: React.FC<RiskControlCenterProps> = ({ activeAccount, strategies }) => {
    const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
    const [instrument, setInstrument] = useState('NAS100');
    const [riskPctInput, setRiskPctInput] = useState('0.5');
    const [stopLoss, setStopLoss] = useState('10');
    const [useEquity, setUseEquity] = useState(true);

    const riskParams = useMemo(() => {
        if (!activeAccount) return null;
        if (activeAccount.type === 'Prop Firm' && activeAccount.phase) {
            return PHASE_SETTINGS[activeAccount.phase];
        }
        return {
            maxRiskPerTradePct: 2,
            dailyDrawdownPct: activeAccount.dailyDrawdownPct || 10,
            maxDrawdownPct: activeAccount.maxDrawdownPct || 20,
        };
    }, [activeAccount]);

    const dailyDrawdown = useMemo(() => {
        if (!activeAccount || !riskParams) return { usedAmount: 0, usedPct: 0, limit: 0, remaining: 0, isBreached: false };
        const baseBalance = activeAccount.type === 'Prop Firm' ? activeAccount.initialPhaseBalance : activeAccount.startOfDayBalance;
        const startBalance = activeAccount.startOfDayBalance || activeAccount.balance;
        const dailyDDLimitAbs = (baseBalance || startBalance) * (riskParams.dailyDrawdownPct / 100);
        const currentDD = Math.max(0, startBalance - activeAccount.equity);
        const isBreached = currentDD >= dailyDDLimitAbs;
        return {
            startBalance,
            usedAmount: currentDD,
            usedPct: dailyDDLimitAbs > 0 ? (currentDD / dailyDDLimitAbs) * 100 : 0,
            limit: dailyDDLimitAbs,
            remaining: dailyDDLimitAbs - currentDD,
            isBreached,
        };
    }, [activeAccount, riskParams]);
    
    const overallDrawdown = useMemo(() => {
        if (!activeAccount || !riskParams) return { usedAmount: 0, usedPct: 0, limit: 0, remaining: 0 };
        const baseBalance = activeAccount.type === 'Prop Firm' ? activeAccount.initialPhaseBalance : activeAccount.balance;
        const highestEquity = activeAccount.highestEquity || activeAccount.equity;
        const maxDDLimitAbs = (baseBalance || highestEquity) * (riskParams.maxDrawdownPct / 100);
        const currentDD = Math.max(0, highestEquity - activeAccount.equity);
        return {
            highestEquity,
            usedAmount: currentDD,
            usedPct: maxDDLimitAbs > 0 ? (currentDD / maxDDLimitAbs) * 100 : 0,
            limit: maxDDLimitAbs,
            remaining: maxDDLimitAbs - currentDD,
        };
    }, [activeAccount, riskParams]);

    const lotSizeCalculation = useMemo(() => {
        const riskPct = parseFloat(riskPctInput) || 0;
        if (!activeAccount || !riskParams || !stopLoss || !riskPct) return { lotSize: null, riskAmount: 0, error: 'Enter All Parameters', warning: null };
        if (dailyDrawdown.isBreached) return { lotSize: null, riskAmount: 0, error: 'Daily Drawdown Limit Reached', warning: null };

        const slValue = parseFloat(stopLoss);
        if (slValue <= 0) return { lotSize: null, riskAmount: 0, error: 'Stop Loss Must Be > 0', warning: null };
        if (riskPct > riskParams.maxRiskPerTradePct) return { lotSize: null, riskAmount: 0, error: `Exceeds Phase Limit (${riskParams.maxRiskPerTradePct}%)`, warning: null };

        const baseCapital = useEquity ? activeAccount.equity : activeAccount.balance;
        const riskAmount = baseCapital * (riskPct / 100);

        if (riskAmount > dailyDrawdown.remaining) return { lotSize: null, riskAmount, error: 'Exceeds Remaining Daily Drawdown', warning: null };

        let rawLot = 0;
        const instrumentType = instrument.toLowerCase();
        if (instrumentType.includes('nas') || instrumentType.includes('us100')) { // NAS100
             rawLot = riskAmount / (slValue * 1); // User enters points, 1 point = $1 for 1 lot on MT5
        } else if (instrumentType.includes('xau') || instrumentType.includes('gold')) { // Gold
            rawLot = riskAmount / (slValue * 100); // SL in dollars, e.g. 5.50 -> 5500 points
        } else { // Forex
            rawLot = riskAmount / (slValue * 10); // SL in pips
        }

        if (rawLot <= 0) return { lotSize: null, riskAmount, error: "Calculation Error", warning: null };
        if (rawLot < 0.01) return { lotSize: 0.01, riskAmount, error: null, warning: "Lot set to broker minimum (0.01)" };

        let finalLot = Math.floor(rawLot / 0.01) * 0.01;
        let warning = null;
        if (finalLot > 50) {
            finalLot = 50;
            warning = "Lot adjusted to broker maximum (50.0)";
        }
        
        return { lotSize: finalLot, riskAmount, error: null, warning };
    }, [activeAccount, riskParams, stopLoss, riskPctInput, useEquity, instrument, dailyDrawdown]);

    const projectedExposure = useMemo(() => {
        if (!dailyDrawdown.limit || !lotSizeCalculation.riskAmount || dailyDrawdown.limit <=0) return 0;
        const projectedLoss = dailyDrawdown.usedAmount + lotSizeCalculation.riskAmount;
        return (projectedLoss / dailyDrawdown.limit) * 100;
    }, [dailyDrawdown, lotSizeCalculation.riskAmount]);
    
    if (!activeAccount) return null;

    return (
        <section className="animate-fade-in-up">
            <div className="glass rounded-[48px] border-white/5 overflow-hidden">
                <button onClick={() => setIsPanelCollapsed(!isPanelCollapsed)} className="w-full p-4 bg-white/[0.02] flex justify-between items-center">
                    <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 ml-4">Risk Control Center</h3>
                    <span className="material-symbols-outlined text-slate-400 transition-transform" style={{ transform: isPanelCollapsed ? 'rotate(180deg)' : 'rotate(0deg)'}}>expand_less</span>
                </button>

                {!isPanelCollapsed && (
                    <div className="p-8 space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <InfoCard label="Balance" value={`${activeAccount.currency}${activeAccount.balance.toLocaleString()}`} />
                            <InfoCard label="Equity" value={`${activeAccount.currency}${activeAccount.equity.toLocaleString()}`} isAccent/>
                            <InfoCard label="Floating P/L" value={`${activeAccount.currency}${(activeAccount.equity - activeAccount.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                            <InfoCard label="Phase" value={activeAccount.phase || 'N/A'} />
                        </div>
                        
                        <div className="glass p-6 rounded-3xl border-white/5 space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Daily Drawdown Monitor</h4>
                                {dailyDrawdown.isBreached && <span className="text-xs font-black text-rose-500 bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20">LOCKED</span>}
                            </div>
                             <div className="grid grid-cols-3 gap-2">
                                <InfoPill label="Start of Day" value={`${activeAccount.currency}${dailyDrawdown.startBalance.toLocaleString()}`} />
                                <InfoPill label="Used" value={`${activeAccount.currency}${dailyDrawdown.usedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} isLoss={dailyDrawdown.usedAmount > 0} />
                                <InfoPill label="Remaining" value={`${activeAccount.currency}${dailyDrawdown.remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                            </div>
                             <RiskExposureMeter exposurePct={dailyDrawdown.usedPct} />
                             <p className="text-center text-[10px] font-bold text-slate-500 pt-1">
                                {lotSizeCalculation.riskAmount > 0 && !lotSizeCalculation.error && (
                                    <span>If next trade hits SL, exposure becomes: <span className="text-amber-400">{projectedExposure.toFixed(1)}%</span></span>
                                )}
                             </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass p-6 rounded-3xl border-white/5 space-y-4">
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Risk Per Trade</h4>
                               <div className="grid grid-cols-2 gap-4">
                                   <FormInput label="Risk %" value={riskPctInput} onChange={setRiskPctInput} type="number" step="0.01" />
                                   <FormInput label={instrument.includes('Forex') ? "Stop Loss (Pips)" : "Stop Loss (Points)"} value={stopLoss} onChange={setStopLoss} type="number" />
                               </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <FormSelect label="Instrument" value={instrument} onChange={setInstrument}>
                                       <option>NAS100</option><option>Gold</option><option>Forex</option>
                                   </FormSelect>
                                   <div className="flex items-end pb-1.5">
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                                           <input type="checkbox" checked={useEquity} onChange={(e) => setUseEquity(e.target.checked)} className="size-4 accent-emerald-400" />
                                           Use Equity
                                       </label>
                                   </div>
                               </div>
                                <div className="text-center bg-black/20 border border-white/5 rounded-2xl p-4 mt-2">
                                    {lotSizeCalculation.error ? (
                                        <p className="text-lg font-black text-rose-400 tracking-tight">{lotSizeCalculation.error}</p>
                                    ) : (
                                        <>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Calculated Lot Size</p>
                                            <p className="text-4xl font-black text-emerald-400 tracking-tighter">{lotSizeCalculation.lotSize?.toFixed(2)}</p>
                                            <p className="text-[10px] font-bold text-slate-500">Risking {activeAccount.currency}{lotSizeCalculation.riskAmount.toFixed(2)}</p>
                                            {lotSizeCalculation.warning && <p className="text-amber-400 text-[10px] font-bold mt-1">{lotSizeCalculation.warning}</p>}
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="glass p-6 rounded-3xl border-white/5 space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overall Drawdown Tracker</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    <InfoPill label="Highest Equity" value={`${activeAccount.currency}${overallDrawdown.highestEquity.toLocaleString()}`} />
                                    <InfoPill label="Used" value={`${activeAccount.currency}${overallDrawdown.usedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} isLoss={overallDrawdown.usedAmount > 0} />
                                    <InfoPill label="Remaining" value={`${activeAccount.currency}${overallDrawdown.remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </section>
    );
};

const RiskExposureMeter = ({ exposurePct }: { exposurePct: number }) => {
    const safePct = Math.min(100, Math.max(0, exposurePct));
    const getMeterStyle = (pct: number) => {
        if (pct >= 100) return { color: 'bg-red-800', label: 'Locked' };
        if (pct >= 80) return { color: 'bg-red-600', label: 'High Risk' };
        if (pct >= 60) return { color: 'bg-orange-500', label: 'Elevated' };
        if (pct >= 30) return { color: 'bg-yellow-500', label: 'Moderate' };
        return { color: 'bg-emerald-500', label: 'Low' };
    };
    const style = getMeterStyle(safePct);
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <span>Risk Exposure Level: <span className={style.color.replace('bg-','text-')}>{style.label}</span></span>
                <span>{safePct.toFixed(1)}% Used</span>
            </div>
            <div className="w-full bg-black/20 h-2.5 rounded-full overflow-hidden border border-white/5 p-0.5">
                <div className={`h-full rounded-full transition-all duration-500 ${style.color}`} style={{ width: `${safePct}%` }} />
            </div>
        </div>
    );
};

const InfoCard = ({ label, value, isAccent }: { label: string, value: string, isAccent?: boolean }) => (
    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        <p className={`text-lg font-black mt-0.5 truncate ${isAccent ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
    </div>
);

const InfoPill = ({ label, value, isLoss }: { label: string, value: string, isLoss?: boolean }) => (
    <div className="text-center">
        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        <p className={`text-base font-bold mt-0.5 truncate ${isLoss ? 'text-rose-400' : 'text-slate-200'}`}>{value}</p>
    </div>
);

const FormInput = ({ label, value, onChange, type = 'text', step }: any) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">{label}</label>
    <input 
      type={type} value={value} step={step} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm font-bold focus:ring-1 focus:ring-emerald-400 outline-none text-white"
    />
  </div>
);

const FormSelect = ({ label, value, onChange, children }: any) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm font-bold text-white outline-none appearance-none">
      {children}
    </select>
  </div>
);

export default RiskControlCenter;
