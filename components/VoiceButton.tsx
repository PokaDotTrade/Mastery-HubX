
import React, { useState } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

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

interface VoiceButtonProps {
  text: string;
  className?: string;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({ text, className }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say with extreme motivation and professional clarity: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const bytes = decode(base64Audio);
        const buffer = await decodeAudioData(bytes, audioCtx, 24000, 1);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.addEventListener('ended', () => {
          setIsSpeaking(false);
          audioCtx.close();
        });
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  };

  return (
    <button 
      onClick={speak}
      disabled={isSpeaking}
      className={`size-10 glass rounded-xl flex items-center justify-center transition-all ${isSpeaking ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-600 hover:text-emerald-400 hover:bg-white/5'} ${className}`}
    >
      <span className={`material-symbols-outlined text-xl ${isSpeaking ? 'animate-pulse' : ''}`}>
        {isSpeaking ? 'graphic_eq' : 'volume_up'}
      </span>
    </button>
  );
};

export default VoiceButton;
