
import { Win, MasteryHabit, BudgetBucket, Trade, Strategy, ScheduleTask, Skill, PipelineProject, Devotion } from './types';

export const CURRENCY_OPTIONS = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥)' },
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'ZAR', symbol: 'R', label: 'ZAR (R)' },
  { code: 'CAD', symbol: 'C$', label: 'CAD (C$)' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$)' },
];

export const INITIAL_WINS: Win[] = [
  { id: '1', label: '60m Deep Work Block', icon: 'bolt', completed: false, color: 'blue', streak: 5 },
  { id: '2', label: 'Morning Market Review', icon: 'monitoring', completed: true, color: 'orange', streak: 12 },
  { id: '3', label: '15m Scripture Study', icon: 'menu_book', completed: true, color: 'emerald', streak: 20 },
  { id: '4', label: 'Workout / Physical Reps', icon: 'fitness_center', completed: false, color: 'purple', streak: 3 },
];

export const MASTERY_HABITS: MasteryHabit[] = [
  { id: 'm1', label: 'Skill Practice', icon: 'layers', tags: ['Growth'], progress: 3, total: 5, color: 'blue', subject: 'System Architecture', duration: 45 },
  { id: 'm2', label: 'Trade Journaling', icon: 'history_edu', tags: ['Discipline'], progress: 1, total: 3, color: 'amber', subject: 'NAS100 Backtesting', duration: 30 },
];

export const BUDGET_BUCKETS: BudgetBucket[] = [
  // Fix: Added missing 'category' property.
  { id: 'b1', label: 'Core Needs', icon: 'home_work', remaining: 450, total: 1200, color: 'emerald', priority: 'urgent', type: 'need', category: 'Stability' },
  // Fix: Added missing 'category' property.
  { id: 'b2', label: 'Wealth Growth', icon: 'trending_up', remaining: 800, total: 1000, color: 'blue', priority: 'high', type: 'want', category: 'Wealth & Growth' },
  // Fix: Added missing 'category' property.
  { id: 'b3', label: 'Lifestyle / Fun', icon: 'auto_awesome', remaining: 120, total: 300, color: 'purple', priority: 'medium', type: 'want', category: 'Lifestyle' },
];

export const INITIAL_TASKS: ScheduleTask[] = [
  { id: 't1', title: 'London Open Focus', timeStart: '08:00', timeEnd: '10:00', priority: 'urgent', completed: true, category: 'Trading' },
  { id: 't2', title: 'Deep Work: Feature Prep', timeStart: '11:00', timeEnd: '13:00', priority: 'high', completed: false, category: 'Coding' },
  { id: 't3', title: 'System Maintenance', timeStart: '15:00', timeEnd: '16:00', priority: 'medium', completed: false, category: 'Admin' },
];

// Fix: Changed 'Calm' to 'Confident' to satisfy Trade interface requirements for mood
export const RECENT_TRADES: Trade[] = [
  { 
    id: 'tr1', pair: 'NAS100', type: 'LONG', entry: 18450.5, pnl: 450, duration: '45m', time: '2024-10-24 09:15', rr: '1:3', status: 'Win', mood: 'Confident',
    reflection: { wrong: 'None', right: 'Patience at support', improve: 'Slightly better exit', additional: '' }, strategyId: 's1', accountId: 'acc_1'
  },
  { 
    id: 'tr2', pair: 'XAUUSD', type: 'SHORT', entry: 2345.1, pnl: -120, duration: '15m', time: '2024-10-24 14:30', rr: '1:1.5', status: 'Loss', mood: 'Disciplined',
    reflection: { wrong: 'Early entry', right: 'Stopped out as planned', improve: 'Wait for confirmation', additional: '' }, strategyId: 's1', accountId: 'acc_1'
  }
];

export const STRATEGIES: Strategy[] = [
  { id: 's1', title: 'Silver Bullet v2', description: 'ICT Silver Bullet logic modified for indices.', tag: 'Scalp', notes: 'Look for FVG in the 10am-11am window.', image: 'https://images.unsplash.com/photo-1611974717482-5813e33b00f7?q=80&w=2000&auto=format&fit=crop' }
];

export const INITIAL_SKILLS: Skill[] = [
  { id: 'sk1', skillName: 'Technical Analysis', targetTime: 1200, startDate: '2023-01-01', goal: 'Institutional Level Flow', streak: 15, icon: 'monitoring', color: 'primary', practiceLog: [
    { id: 'pl1', date: '2024-07-20', notes: 'Reviewed support and resistance.', timeSpent: 45, achievements: 'Identified key levels' },
    { id: 'pl2', date: '2024-07-21', notes: 'Backtested Silver Bullet strategy.', timeSpent: 60, achievements: 'Found 3 high-probability setups' }
  ] },
  { id: 'sk2', skillName: 'React Engineering', targetTime: 600, startDate: '2022-06-01', goal: 'Senior Mastery', streak: 42, icon: 'terminal', color: 'emerald', practiceLog: [
     { id: 'pl3', date: '2024-07-22', notes: 'Refactored state management.', timeSpent: 90, achievements: 'Reduced component complexity' }
  ] }
];

export const INITIAL_PROJECTS: PipelineProject[] = [
  { id: 'p1', title: 'JournalX v2', description: 'Real-time trading analytics engine.', status: 'active', category: 'Dev', progress: 65 }
];

export const DEVOTIONS: Devotion[] = [
  {
    ref: "Joshua 1:9",
    verse: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
    reflection: "True courage isn't the absence of fear, but the decision to move forward despite it. Today, approach your tasks with a quiet confidence, knowing you are not navigating this path alone. Strength is built in the steady, faithful iterations of daily discipline."
  },
  {
    ref: "Proverbs 16:3",
    verse: "Commit to the Lord whatever you do, and he will establish your plans.",
    reflection: "When we align our ambitions with a higher purpose, our steps become lighter and our focus sharper. Success isn't just about the outcome, but the integrity of the effort. Entrust your goals to God today and work with a heart of service."
  },
  {
    ref: "2 Timothy 1:7",
    verse: "For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.",
    reflection: "Self-discipline is a gift that allows us to master our environment and our minds. You have been equipped with everything necessary to remain calm under pressure. Breathe deeply and lean into the sound mind that has been promised to you."
  }
];