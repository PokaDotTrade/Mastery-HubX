
import React, { useState, useEffect } from 'react';

const HourglassCountdown: React.FC = () => {
    const [dayOfYear, setDayOfYear] = useState(0);
    const [totalDays, setTotalDays] = useState(365);
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const [dayPercentage, setDayPercentage] = useState(0);
    const [isFlipping, setIsFlipping] = useState(false);

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date();

            // Day of year calculation
            const start = new Date(now.getFullYear(), 0, 0);
            const diff = now.getTime() - start.getTime();
            const oneDay = 1000 * 60 * 60 * 24;
            const currentDayOfYear = Math.floor(diff / oneDay);

            // Leap year check
            const year = now.getFullYear();
            const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
            const currentTotalDays = isLeap ? 366 : 365;

            // Trigger flip animation on day change.
            if (dayOfYear !== 0 && dayOfYear !== currentDayOfYear) {
                setIsFlipping(true);
                setTimeout(() => setIsFlipping(false), 700);
            }
            
            setDayOfYear(currentDayOfYear);
            setTotalDays(currentTotalDays);

            // Time left until midnight calculation
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
            const msLeft = endOfDay.getTime() - now.getTime();
            
            setTimeLeft({
                hours: Math.floor(msLeft / (1000 * 60 * 60)),
                minutes: Math.floor((msLeft / (1000 * 60)) % 60),
                seconds: Math.floor((msLeft / 1000) % 60),
            });
            
            // Percentage of day passed for sand animation
            const totalMsInDay = 24 * 60 * 60 * 1000;
            const msPassed = totalMsInDay - msLeft;
            setDayPercentage((msPassed / totalMsInDay) * 100);
        };
        
        calculateTime();
        const timerId = setInterval(calculateTime, 1000);

        return () => clearInterval(timerId);
    }, [dayOfYear]);

    const formatTime = (t: number) => t.toString().padStart(2, '0');

    // Sand animation calculations
    const sandHeight = 65;
    const upperSandFillHeight = sandHeight * (1 - dayPercentage / 100);
    const upperSandYOffset = sandHeight - upperSandFillHeight;
    const lowerSandFillHeight = sandHeight * (dayPercentage / 100);
    const lowerSandYOffset = sandHeight - lowerSandFillHeight;

    return (
        <div className="hidden lg:flex w-full flex-col items-center gap-6 p-8 glass rounded-[40px] border-emerald-400/10 shadow-2xl shadow-emerald-400/5 animate-fade-in-up">
            <div className={`w-24 h-36 transition-transform duration-700 ease-in-out ${isFlipping ? 'rotate-180' : ''}`}>
                <svg viewBox="0 0 100 150" className="w-full h-full">
                    <path d="M10 10 H 90 L 50 75 L 10 10 Z" fill="none" stroke="#30e86e" strokeWidth="3" opacity="0.3" />
                    <path d="M10 140 H 90 L 50 75 L 10 140 Z" fill="none" stroke="#30e86e" strokeWidth="3" opacity="0.3" />
                    <line x1="10" y1="10" x2="10" y2="140" stroke="#30e86e" strokeWidth="2" opacity="0.1" />
                    <line x1="90" y1="10" x2="90" y2="140" stroke="#30e86e" strokeWidth="2" opacity="0.1" />

                    <g clipPath="url(#upperClip)">
                        <rect x="10" y={10 + upperSandYOffset} width="80" height={upperSandFillHeight} fill="#30e86e" opacity="0.5" />
                    </g>

                    <g clipPath="url(#lowerClip)">
                        <rect x="10" y={75 + lowerSandYOffset} width="80" height={lowerSandFillHeight} fill="#30e86e" opacity="0.5" />
                    </g>
                    
                    <defs>
                        <clipPath id="upperClip">
                            <path d="M 10 10 H 90 L 50 75 Z" />
                        </clipPath>
                        <clipPath id="lowerClip">
                            <path d="M 10 140 H 90 L 50 75 Z" />
                        </clipPath>
                    </defs>
                </svg>
            </div>
            
            <div className="text-center space-y-2">
                <p className="text-xl font-black text-white font-display tracking-tight">
                    Day {dayOfYear} <span className="text-slate-600">of</span> {totalDays}
                </p>
                <p className="font-mono text-4xl font-black text-emerald-400 tracking-tighter">
                    {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
                </p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Until Next Iteration</p>
            </div>
        </div>
    );
};

export default HourglassCountdown;