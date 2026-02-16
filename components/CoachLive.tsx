
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

interface CoachLiveProps {
  appContext?: {
    completedWins: number;
    totalWins: number;
    activeHabits: string[];
    focusLevel: number;
    recentTradeResult: string;
  };
}

const MEMORY_KEY = 'mastery_coach_longterm_memory_v3';

const CoachLive: React.FC<CoachLiveProps> = ({ appContext }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
  const [transcription, setTranscription] = useState<{ text: string; sender: 'user' | 'coach'; id: string; timestamp: Date }[]>([]);
  const [isCoachThinking, setIsCoachThinking] = useState(false);
  const [inputText, setInputText] = useState('');
  
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const currentOutputRef = useRef<string>('');
  const currentInputRef = useRef<string>('');

  // Auto-scrolling transcript
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcription]);

  const saveToMemory = useCallback((text: string, sender: 'user' | 'coach') => {
    if (!text.trim()) return;
    const existing = localStorage.getItem(MEMORY_KEY);
    const memories = existing ? JSON.parse(existing) : [];
    memories.push({ text: text.trim(), sender, date: new Date().toISOString() });
    const limited = memories.slice(-30);
    localStorage.setItem(MEMORY_KEY, JSON.stringify(limited));
  }, []);

  const getMemories = useCallback(() => {
    const existing = localStorage.getItem(MEMORY_KEY);
    if (!existing) return "This is our very first session. Begin by introducing yourself warmly.";
    const memories = JSON.parse(existing);
    return memories.map((m: any) => `[${new Date(m.date).toLocaleTimeString()}] ${m.sender === 'user' ? 'User' : 'Coach'}: ${m.text}`).join('\n');
  }, []);

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    setIsActive(false);
    setStatus('idle');
    setIsCoachThinking(false);
  }, []);

  const handleSendText = useCallback(() => {
    if (sessionRef.current && inputText.trim()) {
      const messageText = inputText.trim();
      sessionRef.current.sendRealtimeInput({ text: messageText });
      
      setTranscription(prev => [
        ...prev,
        {
          text: messageText,
          sender: 'user',
          id: `user-text-${Date.now()}`,
          timestamp: new Date()
        }
      ]);
      
      saveToMemory(messageText, 'user');
      setInputText('');
      setIsCoachThinking(true);
    }
  }, [inputText, saveToMemory]);

  const startSession = useCallback(async () => {
    if (status === 'connecting') return;
    setStatus('connecting');
    setTranscription([]);
    currentOutputRef.current = '';
    currentInputRef.current = '';
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();

      const pastContext = getMemories();
      const currentStats = appContext ? `
        DASHBOARD CONTEXT:
        Wins: ${appContext.completedWins}/${appContext.totalWins} Done
        LVL: ${appContext.focusLevel}
        Habits: ${appContext.activeHabits.join(', ')}
        Last Trade: ${appContext.recentTradeResult}
      ` : "Initializing new baseline...";

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('active');
            setIsActive(true);
            setIsCoachThinking(true);
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);

            sessionPromise.then(s => {
              s.sendRealtimeInput({ text: "I'm here. Open the conversation warmly by referencing a specific win from my dashboard and asking a deep follow-up question." });
            });
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              if (text.trim()) {
                currentInputRef.current += text;
                setIsCoachThinking(true);
                setTranscription(prev => {
                  const last = prev[prev.length - 1];
                  if (last && last.sender === 'user' && last.id === 'current-user-turn') {
                    return [...prev.slice(0, -1), { ...last, text: currentInputRef.current }];
                  } else {
                    return [...prev, { text: currentInputRef.current, sender: 'user', id: 'current-user-turn', timestamp: new Date() }];
                  }
                });
              }
            }

            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              if (text.trim()) {
                currentOutputRef.current += text;
                setIsCoachThinking(false);
                setTranscription(prev => {
                  const last = prev[prev.length - 1];
                  if (last && last.sender === 'coach' && last.id === 'current-coach-turn') {
                    return [...prev.slice(0, -1), { ...last, text: currentOutputRef.current }];
                  } else {
                    return [...prev, { text: currentOutputRef.current, sender: 'coach', id: 'current-coach-turn', timestamp: new Date() }];
                  }
                });
              }
            }

            if (message.serverContent?.turnComplete) {
              if (currentInputRef.current) saveToMemory(currentInputRef.current, 'user');
              if (currentOutputRef.current) saveToMemory(currentOutputRef.current, 'coach');
              
              setTranscription(prev => prev.map(t => ({ ...t, id: t.id === 'current-user-turn' ? `user-${Date.now()}` : t.id === 'current-coach-turn' ? `coach-${Date.now()}` : t.id })));
              currentInputRef.current = '';
              currentOutputRef.current = '';
              setIsCoachThinking(false);
            }

            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64EncodedAudioString && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              for (const source of sourcesRef.current.values()) {
                try { source.stop(); } catch(e) {}
                sourcesRef.current.delete(source);
              }
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Coach Connection Error:', e);
            setStatus('error');
            stopSession();
          },
          onclose: () => {
            setStatus('idle');
            setIsActive(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `
            ROLE: Mastery Coach, Growth Companion, and Casual Friend.
            PERSONA: You are a seamless part of the user's life. You aren't just a digital tool; you're a supportive, high-vibes companion. You are warm, encouraging, and treat the user with the familiarity of a close friend.
            STRICT CONVERSATION RULES:
            1. TWO-WAY DIALOGUE: Always Reflect, Respond, and ask ONE Follow-up question to keep the flow alive.
            2. SOCIAL AWARENESS: You acknowledge and speak about people the user mentions (e.g., 'my wife', 'my friend', 'my partner', 'my kids'). If they ask you to 'say hi' to someone, respond as a friendly third-person companion. Example: 'Hey! 👋 She’s doing great! Hope you both are having a solid day.' or 'Aww, that’s sweet! ❤️ She’ll hear it loud and clear!'.
            3. ANTI-SILENCE: Never give one-word answers. If the user is quiet, probe deeper into their goals or current mood.
            4. CONTEXT: Refer to dashboard stats and past history below to show you're paying attention to their journey.
            5. TONE: Warm, calm, human mentor with a casual, fun edge. Spread good vibes.

            DASHBOARD:
            ${currentStats}

            HISTORY:
            ${pastContext}
          `,
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to connect to CoachLive:', err);
      setStatus('error');
    }
  }, [appContext, getMemories, saveToMemory, status, stopSession]);

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  const sessionInsights = useMemo(() => {
    const coachTalk = transcription.filter(t => t.sender === 'coach');
    if (coachTalk.length < 2) return ["Establishing initial context...", "Analyzing current focus patterns..."];
    return [
      "Noted pattern of high motivation in early sessions.",
      "Identified potential bottleneck in daily NAS100 discipline.",
      "Celebrating significant progress in Study Blocks."
    ];
  }, [transcription]);

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-8 min-h-[calc(100vh-200px)]">
      
      {/* Interaction Column */}
      <div className="lg:col-span-8 flex flex-col space-y-12 pb-10">
        
        {/* Interaction Sphere Section */}
        <section className="flex flex-col items-center justify-center py-10 glass rounded-[40px] border-white/5 bg-white/[0.01]">
          <div 
            className="relative group cursor-pointer mb-8" 
            onClick={status === 'active' ? stopSession : (status === 'idle' ? startSession : undefined)}
          >
            <div className={`absolute inset-0 bg-emerald-400/20 blur-[120px] rounded-full transition-all duration-1000 ${status === 'active' ? 'scale-150 opacity-100' : 'scale-75 opacity-20'}`}></div>
            
            <div className={`relative size-56 md:size-64 rounded-full glass flex flex-col items-center justify-center border-4 transition-all duration-500 overflow-hidden ${status === 'active' ? 'border-emerald-400 shadow-[0_0_80px_rgba(48,232,110,0.3)]' : 'border-white/5 shadow-none'}`}>
              {status === 'active' ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 h-10">
                    {[...Array(6)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-2 rounded-full transition-all duration-300 ${isCoachThinking ? 'bg-emerald-200 animate-pulse' : 'bg-emerald-400 animate-bounce'}`} 
                        style={{ 
                          animationDelay: `${i * 0.1}s`, 
                          height: isCoachThinking ? '8px' : `${40 + Math.random() * 60}%`,
                          animationDuration: '0.8s'
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              ) : status === 'connecting' ? (
                <span className="material-symbols-outlined text-6xl text-emerald-400 animate-spin">sync</span>
              ) : (
                <span className="material-symbols-outlined text-7xl text-emerald-400 filled-icon group-hover:scale-110 transition-transform">psychology</span>
              )}
            </div>
          </div>

          <div className="text-center px-6 w-full max-w-lg">
            <h2 className="text-2xl font-black font-display tracking-tight text-white mb-2">
              {status === 'active' ? 'Coach Synchronized' : 'Mastery Companion'}
            </h2>
            <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto leading-relaxed mb-8">
              {status === 'active' 
                ? 'High-performance reflection is active. Speak clearly or type your question.' 
                : 'Access a supportive, continuous dialogue that remembers your patterns and challenges you to grow.'}
            </p>
            
            <div className="space-y-4">
              {status === 'active' ? (
                <div className="space-y-4 w-full">
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Type your question if you don’t feel like speaking..."
                      className="flex-1 glass border-none rounded-2xl p-4 text-sm font-bold focus:ring-1 focus:ring-emerald-400 outline-none text-slate-100 placeholder:text-slate-800 bg-[#0d120f]"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                    />
                    <button 
                      onClick={handleSendText}
                      disabled={!inputText.trim()}
                      className="size-12 bg-emerald-400 text-[#080d0a] rounded-2xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined">send</span>
                    </button>
                  </div>
                  <button onClick={stopSession} className="w-full py-4 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95">End Connection</button>
                </div>
              ) : (
                <button onClick={startSession} disabled={status === 'connecting'} className="px-10 py-4 rounded-2xl bg-emerald-400 text-[#080d0a] font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl shadow-emerald-400/20 hover:scale-105 disabled:opacity-50">Enter Dialogue</button>
              )}
            </div>
          </div>
        </section>

        {/* Conversation Transcript Section */}
        <section className="flex-1 flex flex-col space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Live Dialogue</h3>
            {status === 'active' && <span className="text-[9px] font-black text-emerald-400 animate-pulse uppercase tracking-widest">Neural Link Active</span>}
          </div>

          <div className="glass rounded-[32px] border-white/5 p-6 h-[400px] lg:h-[500px] overflow-y-auto no-scrollbar space-y-6 bg-white/[0.01]">
            {transcription.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <span className="material-symbols-outlined text-4xl mb-4">forum</span>
                <p className="text-[10px] font-black uppercase tracking-widest">No active turns recorded</p>
              </div>
            )}
            {transcription.map((t) => (
              <div key={t.id} className={`flex flex-col ${t.sender === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[85%] px-6 py-4 rounded-3xl text-sm font-semibold leading-relaxed transition-all ${
                  t.sender === 'user' 
                  ? 'bg-white/5 text-slate-300 border border-white/5 rounded-br-none' 
                  : 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 rounded-bl-none shadow-[0_0_20px_rgba(48,232,110,0.05)]'
                }`}>
                  {t.text}
                  {t.id.includes('current') && <span className="inline-block w-1.5 h-4 ml-1 bg-current animate-pulse align-middle"></span>}
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-700 mt-2 px-1">
                  {t.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {isCoachThinking && currentOutputRef.current === '' && (
              <div className="flex justify-start animate-in fade-in duration-300">
                 <div className="bg-emerald-400/5 px-6 py-4 rounded-3xl rounded-bl-none border border-emerald-400/10">
                    <div className="flex gap-1.5">
                       <div className="size-1.5 bg-emerald-400/40 rounded-full animate-bounce"></div>
                       <div className="size-1.5 bg-emerald-400/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                       <div className="size-1.5 bg-emerald-400/40 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                 </div>
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>
        </section>
      </div>

      {/* Desktop Sidebar: Session Context & Insights */}
      <div className="hidden lg:col-span-4 lg:flex flex-col space-y-8 h-full">
        
        {/* Insights Section */}
        <section className="glass rounded-[40px] border-white/5 p-8 space-y-6 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-emerald-400/10 rounded-xl flex items-center justify-center text-emerald-400">
              <span className="material-symbols-outlined filled-icon text-2xl">insights</span>
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest">Coach Insights</h4>
          </div>
          <div className="space-y-4">
            {sessionInsights.map((insight, idx) => (
              <div key={idx} className="flex gap-4 group">
                <div className="h-full w-0.5 bg-emerald-400/20 group-hover:bg-emerald-400 transition-colors"></div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">{insight}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Dashboard Context Summary */}
        <section className="glass rounded-[40px] border-white/5 p-8 space-y-6 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
              <span className="material-symbols-outlined filled-icon text-2xl">dashboard</span>
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest">Active Focus</h4>
          </div>
          {appContext ? (
            <div className="space-y-5">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Daily Progress</p>
                <p className="text-xs font-black text-emerald-400">{appContext.completedWins} / {appContext.totalWins} Wins</p>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(48,232,110,0.5)] transition-all duration-1000" 
                  style={{ width: `${(appContext.completedWins / appContext.totalWins) * 100}%` }}
                ></div>
              </div>
              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Habit Mastery</p>
                {appContext.activeHabits.map((h, i) => (
                  <div key={i} className="flex justify-between text-[11px] font-bold text-slate-300">
                    <span>{h.split(':')[0]}</span>
                    <span className="text-blue-400">{h.split(':')[1]}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest text-center">Loading Data Link...</p>
          )}
        </section>

        {/* Reflection Notes Area */}
        <section className="flex-1 glass rounded-[40px] border-white/5 p-8 space-y-4 flex flex-col bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-amber-400/10 rounded-xl flex items-center justify-center text-amber-400">
              <span className="material-symbols-outlined filled-icon text-2xl">edit_note</span>
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest">Reflection Notes</h4>
          </div>
          <textarea 
            placeholder="Document breakthrough thoughts or specific coaching advice here..." 
            className="flex-1 w-full bg-transparent border-none focus:ring-0 text-sm font-medium leading-relaxed text-slate-400 placeholder:text-slate-700 resize-none scroll-smooth p-0"
          />
        </section>

      </div>
      
    </div>
  );
};

export default CoachLive;
