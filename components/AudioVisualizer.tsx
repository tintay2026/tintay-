
import React from 'react';

interface Props {
  isActive: boolean;
  color?: string;
}

export const AudioVisualizer: React.FC<Props> = ({ isActive, color = 'bg-emerald-500' }) => {
  return (
    <div className="flex items-center justify-center space-x-1 h-6">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={`${color} w-1 rounded-full transition-all duration-300 ${isActive ? 'animate-bounce' : 'h-1.5'}`}
          style={{
            animationDelay: `${i * 0.1}s`,
            height: isActive ? `${Math.random() * 15 + 8}px` : '6px'
          }}
        />
      ))}
    </div>
  );
};
