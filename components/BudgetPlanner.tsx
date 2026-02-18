
import React from 'react';
import { BudgetBucket, Envelope, Priority, BucketType, BucketCategory, Expense, Income, SubAllocation } from '../types';
import { EnvelopeGrid, GardenSummary } from './EnvelopeChallenge.tsx';
import { CURRENCY_OPTIONS } from '../constants.tsx';

interface BudgetPlannerProps {
  buckets: BudgetBucket[];
  onAddBucket: (bucket: BudgetBucket) => void;
  onDeleteBucket: (id: string) => void;
  onUpdateBucket: (id: string, updates: Partial<BudgetBucket>) => void;
  envelopes: Envelope[];
  toggleEnvelope: (id: number) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  incomeRecords: Income[];
  setIncomeRecords: (income: Income[]) => void;
  budgetMantra: string;
  setBudgetMantra: (mantra: string) => void;
}

const BudgetPlanner: React.FC<BudgetPlannerProps> = ({ 
  envelopes, 
  toggleEnvelope, 
  currency,
  setCurrency,
  // The rest of the props are unused but kept to maintain the component's signature from App.tsx
}) => {
  return (
    <div className="pt-4 relative">
      <section className="flex justify-end items-center px-1 mb-8">
        <div className="relative">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="glass rounded-xl py-2 pl-4 pr-10 border-white/10 text-sm font-bold bg-transparent appearance-none focus:ring-1 focus:ring-emerald-400 outline-none cursor-pointer"
            aria-label="Select currency"
          >
            {CURRENCY_OPTIONS.map(opt => (
              <option key={opt.code} value={opt.symbol} className="bg-[#111a14] text-white">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <span className="material-symbols-outlined text-base">unfold_more</span>
          </div>
        </div>
      </section>

      <div className="space-y-12">
        {/* Visual Budget Planner sections removed as requested. */}
        {/* The 100 Envelope Challenge and Garden of Savings are preserved below. */}
        <GardenSummary envelopes={envelopes} currency={currency} />
        <EnvelopeGrid envelopes={envelopes} currency={currency} toggleEnvelope={toggleEnvelope} />
      </div>
    </div>
  );
};

export default BudgetPlanner;
