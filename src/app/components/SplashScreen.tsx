'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody } from '@heroui/react';

interface Props {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: Props) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const holdTimer = setTimeout(() => setExiting(true), 2000);
    const doneTimer = setTimeout(() => onDone(), 2500);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={[
        'fixed inset-0 z-[100] flex items-center justify-center',
        'bg-gradient-to-br from-stone-950 via-zinc-900 to-stone-900',
        exiting ? 'splash-exit' : 'splash-enter',
      ].join(' ')}
    >
      {/* Ambient gold glow in background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-amber-400/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

      {/* Glass card */}
      <Card
        isBlurred
        shadow="none"
        className="border border-white/15 bg-white/8 backdrop-blur-2xl z-10"
        radius="lg"
      >
        <CardBody className="flex flex-col items-center gap-6 px-12 py-10">
          {/* Icon with glow halo */}
          <div className="relative flex items-center justify-center">
            {/* Outer glow ring */}
            <div className="absolute w-32 h-32 rounded-full bg-amber-400/15 blur-2xl" />
            {/* Medium ring */}
            <div className="absolute w-24 h-24 rounded-full bg-amber-400/10 blur-xl" />
            {/* Icon */}
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-glow-amber splash-icon-pulse">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21h18" />
                <path d="M5 21V7l7-4 7 4v14" />
                <path d="M9 21v-4h6v4" />
                <path d="M9 9h1" />
                <path d="M14 9h1" />
                <path d="M9 13h1" />
                <path d="M14 13h1" />
              </svg>
            </div>
          </div>

          {/* Text */}
          <div className="text-center">
            <h1 className="font-heading text-3xl font-bold text-white leading-tight">
              Grand Hotel Kollegan
            </h1>
            <p className="text-white/50 text-sm mt-1.5 tracking-wide">Storgatan 1, Stockholm</p>
            <div className="mt-2 flex items-center justify-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-amber-400/60" />
              <p className="text-white/30 text-[11px] uppercase tracking-widest">
                Reception Management System
              </p>
              <div className="w-1 h-1 rounded-full bg-amber-400/60" />
            </div>
          </div>

          {/* Loading dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-amber-400/60"
                style={{
                  animation: 'splash-icon-pulse 1.5s ease-in-out infinite',
                  animationDelay: `${i * 200}ms`,
                }}
              />
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
