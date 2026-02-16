
import { GoogleGenAI } from "@google/genai";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Robust retry wrapper with exponential backoff for handling 429 and 5xx errors.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Extract error details safely
      const errorMessage = error?.message || String(error);
      const statusCode = error?.status || error?.code;
      
      const isRateLimit = statusCode === 429 || errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED');
      const isServerError = (statusCode >= 500 && statusCode < 600) || errorMessage.includes('500') || errorMessage.includes('503');
      
      if (isRateLimit || isServerError) {
        // Shorter exponential backoff for a snappier UI experience
        const waitTime = Math.pow(2, i) * 1000 + Math.random() * 500;
        console.warn(`Gemini API Service: Error [${statusCode || 'Unknown'}]. Retrying in ${Math.round(waitTime)}ms...`);
        await delay(waitTime);
        continue;
      }
      
      throw error;
    }
  }
  throw lastError;
}

export async function getADHDCoachMessage(winsCount: number, totalWins: number) {
  try {
    return await withRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `User has completed ${winsCount} out of ${totalWins} daily wins. Generate their check-in message.`,
        config: {
          systemInstruction: "You are an ADHD-specialist success coach. Your tone is dopamine-friendly, ultra-short (max 15 words), and encouraging. Focus on the momentum of tiny iterations and the beauty of small wins. Avoid generic platitudes; be specific about compounding momentum.",
          temperature: 0.8,
          topP: 0.95,
        }
      });

      return response.text?.trim() || "Small wins are proof of momentum. One more iteration today.";
    });
  } catch (error) {
    // Graceful fallback for quota limits (429) or other API failures
    if (winsCount === totalWins && totalWins > 0) return "Momentum peak achieved. Your focus today was undeniable. Time for deliberate rest.";
    if (winsCount > 0) return "Momentum secured. You've broken the friction of zero. Keep the streak alive.";
    return "Focus on the smallest possible starting point. The first step is the loudest.";
  }
}

export async function getIncomeCoachMessage(amount: number, currency: string, priorityBuckets: string[]) {
  try {
    return await withRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const priorityList = priorityBuckets.length > 0 ? priorityBuckets.join(", ") : "emergency savings";
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `New capital received: ${currency}${amount}. Targets needing funding: ${priorityList}.`,
        config: {
          systemInstruction: "You are a strategic wealth and discipline advisor. Provide exactly one sentence of tactical advice on how to allocate new income. Prioritize financial security (emergency funds/needs) and mental peace of mind. Keep it sharp and actionable.",
          temperature: 0.7,
        }
      });

      return response.text?.trim() || "Capital secured. Fund your foundational needs first to stabilize your focus.";
    });
  } catch (error) {
    return `New capital locked. Prioritize your ${priorityBuckets[0] || 'safety net'} to protect your creative energy.`;
  }
}

export async function getBudgetInsights(reportData: any, currency: string) {
  try {
    const dataString = `
      - Total Allocated: ${currency}${reportData.totalAllocated}
      - Total Used: ${currency}${reportData.totalUsed}
      - Savings/Growth Allocation: ${currency}${reportData.savingsAllocated}
      - Spending Breakdown: ${JSON.stringify(reportData.pieData.map(d => `${d.name}: ${currency}${d.value}`))}
    `;

    return await withRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this monthly budget data: ${dataString}. The user has ADHD. Provide 2-3 short, bulleted insights.`,
        config: {
          systemInstruction: "You are an ADHD-friendly financial coach. Your insights are positive, non-judgmental, and focus on patterns. Provide 2-3 short, bullet-pointed insights (max 15 words each). Highlight good habits (like high savings allocation) and gently point out areas for awareness (like high spending in one category). Use emojis. Format as a simple string with each insight on a new line starting with a bullet point.",
          temperature: 0.7,
        }
      });
      
      const text = response.text?.trim();
      if (!text) return ["Keep tracking to see your patterns emerge."];
      return text.split('\n').map(line => line.replace(/•|-|\*/, '').trim()).filter(Boolean);
    });
  } catch (error) {
    console.error("Budget Insight Error:", error);
    return ["Insights are currently unavailable. Focus on your allocation accuracy."];
  }
}
