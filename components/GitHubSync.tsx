import React, { useState } from 'react';
import { GitHubConfig, SyncStatus } from '../types';

interface GitHubSyncProps {
  config: GitHubConfig;
  status: SyncStatus;
  onUpdateConfig: (config: GitHubConfig) => void;
  onSync: () => void;
  onRestore: () => void;
}

const GitHubSync: React.FC<GitHubSyncProps> = ({ config, status, onUpdateConfig, onSync, onRestore }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempToken, setTempToken] = useState(config.token);

  const handleSave = () => {
    onUpdateConfig({ ...config, token: tempToken });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Sidebar Trigger */}
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-4 p-4 rounded-[20px] transition-all hover:bg-white/5 group"
      >
        <div className={`p-2 rounded-xl transition-all ${config.token ? 'bg-emerald-400/10 text-emerald-400' : 'bg-white/5 text-slate-700'}`}>
          <span className={`material-symbols-outlined text-2xl ${status === 'syncing' || status === 'restoring' ? 'animate-spin' : ''}`}>
            {status === 'error' ? 'sync_problem' : 'cloud_sync'}
          </span>
        </div>
        <div className="text-left">
          <span className="text-[11px] font-black uppercase tracking-widest block text-slate-400">Temporal Sync</span>
          <span className={`text-[8px] font-black uppercase tracking-widest ${
            status === 'success' ? 'text-emerald-400' : 
            status === 'syncing' || status === 'restoring' ? 'text-blue-400' : 
            status === 'error' ? 'text-rose-500' : 'text-slate-700'
          }`}>
            {status === 'success' ? `Last: ${config.lastSync?.split(',')[1] || 'Today'}` : status === 'unlinked' ? 'Not Connected' : status.toUpperCase()}
          </span>
        </div>
      </button>

      {/* Settings Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsOpen(false)}>
          <div className="w-full max-w-md bg-[#111a14] border border-white/10 rounded-[40px] shadow-2xl p-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black font-display tracking-tight text-white">GitHub Cloud</h2>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1">Project Backup System</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="size-10 glass rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-6">
              {status === 'error' && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Communication Error</p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Check your token and connection. Your token <strong className="text-white">MUST have "gist" permissions</strong> enabled on GitHub.
                  </p>
                </div>
              )}

              <div className="bg-emerald-400/5 border border-emerald-400/10 p-5 rounded-3xl">
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  We use <strong className="text-emerald-400">GitHub Gists</strong> to store your encrypted mastery data. This ensures your progress persists across devices without a central server.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Personal Access Token (classic)</label>
                <input 
                  type="password" 
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={tempToken}
                  onChange={(e) => setTempToken(e.target.value)}
                  className="w-full glass border-none rounded-2xl p-4 text-sm font-bold focus:ring-1 focus:ring-emerald-400 outline-none placeholder:text-slate-800 text-slate-200" 
                />
                <div className="flex justify-between items-center px-1">
                  <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-[8px] font-black text-emerald-400 uppercase tracking-widest hover:underline">Generate Token</a>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Requires "gist" scope</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleSave}
                  className="col-span-2 py-4 bg-white/5 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all border border-white/5"
                >
                  Save Local Token
                </button>
                <button 
                  onClick={() => { onUpdateConfig({ ...config, token: tempToken }); onRestore(); }}
                  disabled={!tempToken || status === 'restoring'}
                  className="py-4 bg-white/10 text-emerald-400 font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all disabled:opacity-50 border border-emerald-400/20"
                >
                  {status === 'restoring' ? 'Restoring...' : 'Cloud Pull'}
                </button>
                <button 
                  onClick={() => { onUpdateConfig({ ...config, token: tempToken }); onSync(); }}
                  disabled={!tempToken || status === 'syncing'}
                  className="py-4 bg-emerald-400 text-[#080d0a] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-400/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {status === 'syncing' ? 'Syncing...' : 'Cloud Push'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubSync;