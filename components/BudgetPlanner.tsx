
import React from 'react';
import { BudgetBucket, Envelope, Priority, BucketType, BucketCategory, Expense, Income, SubAllocation } from '../types';
import { EnvelopeGrid, GardenSummary } from './EnvelopeChallenge.tsx';

interface BudgetPlannerProps {
  buckets: BudgetBucket[];
  onAddBucket: (bucket: BudgetBucket) => void;
  onDeleteBucket: (id: string) => void;
  onUpdateBucket: (id: string, updates: Partial<BudgetBucket>) => void;
  envelopes: Envelope[];
  toggleEnvelope: (id: number) => void;
  currency: string;
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
  // The rest of the props are unused but kept to maintain the component's signature from App.tsx
}) => {
  return (
    <div className="space-y-12 pt-4 relative">
      {/* Visual Budget Planner sections removed as requested. */}
      {/* The 100 Envelope Challenge and Garden of Savings are preserved below. */}
      <GardenSummary envelopes={envelopes} currency={currency} />
      <EnvelopeGrid envelopes={envelopes} currency={currency} toggleEnvelope={toggleEnvelope} />
    </div>
  );
};

export default BudgetPlanner;
