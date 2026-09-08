import React from 'react';
import { EmojiReaction } from '../types';

interface FlyingReactionsProps {
  reactions: EmojiReaction[];
}

export const FlyingReactions: React.FC<FlyingReactionsProps> = ({ reactions }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {reactions.map((r) => (
        <div
          key={r.id}
          className="absolute bottom-24 flex flex-col items-center animate-fly-up"
          style={{
            left: `${r.x}%`,
          }}
        >
          <span className="text-4xl filter drop-shadow-lg select-none">{r.emoji}</span>
          <span className="text-[10px] bg-slate-900/80 text-slate-300 font-semibold px-2 py-0.5 rounded-full border border-slate-700/80 mt-1 backdrop-blur-sm whitespace-nowrap">
            {r.senderName}
          </span>
        </div>
      ))}
    </div>
  );
};
