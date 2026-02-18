
export type Tab = 'wins' | 'budget' | 'schedule' | 'trading' | 'future' | 'habits' | 'mastery' | 'coach' | 'scriptures';

export interface Win {
  id: string;
  label: string;
  icon: string;
  completed: boolean;
  color: string;
  streak: number;
  customIcon?: string;
  completionHistory?: string[]; // Array of 'YYYY-MM-DD' dates
}

export interface Devotion {
  ref: string;
  verse: string;
  reflection: string;
}

export interface MasteryHabit {
  id: string;
  label: string;
  icon: string;
  tags: string[];
  progress: number;
  total: number;
  color: string;
  subject?: string;
  duration?: number;
}

export interface Envelope {
  id: number;
  value: number;
  completed: boolean;
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type BucketType = 'need' | 'want';
export type BucketCategory = 'Wealth & Growth' | 'Stability' | 'Lifestyle' | 'Learning';

export interface SubAllocation {
  id: string;
  name: string;
  amount: number;
}

export interface BudgetBucket {
  id: string;
  label: string;
  icon: string;
  remaining: number;
  total: number;
  color: string;
  priority: Priority;
  type: BucketType;
  category: BucketCategory;
  customIcon?: string;
  subAllocations?: SubAllocation[];
}

export interface Expense {
  id: string;
  date: string;
  categoryId: string;
  categoryLabel: string;
  description: string;
  amount: number;
  paymentType: string;
  isPlanned: boolean; // New field for ADHD clarity
}

export interface Income {
  id: string;
  date: string;
  amount: number;
  note: string;
}

export interface ScheduleTask {
  id: string;
  title: string;
  timeStart: string;
  timeEnd?: string;
  priority: Priority;
  completed: boolean;
  category: string;
  date?: string; // YYYY-MM-DD format
}

export interface TradingAccount {
  id: string;
  name: string;
  type: 'Live' | 'Prop Firm' | 'Demo';
  balance: number;
  currency: string;
  isPrimary: boolean;
  // Prop Firm specific fields
  phase?: 'Phase 1' | 'Phase 2' | 'Funded';
  targetProfitPct?: number;
  dailyDrawdownPct?: number;
  maxDrawdownPct?: number;
  initialPhaseBalance?: number;
  // Specific Phase Targets
  phase1Target?: number;
  phase2Target?: number;
  phase3Target?: number;
}

export interface Trade {
  id: string;
  pair: string;
  type: 'LONG' | 'SHORT';
  entry: number;
  pnl: number;
  duration?: string;
  time: string;
  rr: string;
  status: 'Win' | 'Loss' | 'Breakeven';
  mood?: 'Confident' | 'Hesitant' | 'Overconfident' | 'Disciplined' | 'Emotional';
  session?: 'London' | 'New York' | 'Asia' | 'Sydney';
  notes?: string;
  reflection?: {
    wrong: string;
    right: string;
    improve: string;
    additional: string;
  };
  chartLink?: string;
  image?: string;
  strategyId?: string;
  accountId?: string;
}

export interface Strategy {
  id: string;
  title: string;
  description: string;
  tag: string;
  image: string; // Thumbnail
  modelImage?: string; // High-res blueprint image
  notes?: string;
  marketCondition?: string;
  timeframe?: string;
  entryCriteria?: string;
  riskModel?: string;
}

export interface FutureLetter {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  unlockDate: string;
  isLocked: boolean;
}

export interface PracticeEntry {
  id: string;
  date: string;
  notes: string;
  timeSpent: number;
  achievements: string;
}

export interface Skill {
  id: string;
  skillName: string;
  targetTime: number; // Target time in minutes
  startDate: string;
  goal?: string;
  streak?: number;
  practiceLog: PracticeEntry[];
  // Aesthetics
  icon: string;
  color: string;
}

export interface PipelineProject {
  id:string;
  title: string;
  description: string;
  status: 'idea' | 'active' | 'done';
  category: string;
  progress: number;
}

/**
 * Added GitHub synchronization types to support cloud persistence features.
 */
export interface GitHubConfig {
  token: string;
  lastSync?: string;
}

export type SyncStatus = 'unlinked' | 'syncing' | 'restoring' | 'success' | 'error' | 'idle';
