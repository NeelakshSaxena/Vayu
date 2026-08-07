import React from 'react';

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

interface TranscriptProps {
  messages: Message[];
  isActive: boolean;
}

export const Transcript: React.FC<TranscriptProps> = ({ messages, isActive }) => {
  // We only show the UI if the orb is active (not idle) or if there are messages
  if (!isActive && messages.length === 0) return null;

  // We only take the absolute latest message to display
  const displayMessages = messages.length > 0 ? [messages[messages.length - 1]] : [];

  return (
    <div className={`absolute inset-x-0 top-[100px] bottom-[35vh] flex flex-col items-center justify-center pointer-events-none z-10 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
      <div className="w-full max-w-4xl px-8 flex flex-col items-center justify-center">
        {displayMessages.map((msg) => {
          if (!msg.text) return null;

          return (
            <div 
              key={msg.id}
              className="w-full text-center transition-all duration-700 ease-in-out opacity-100 transform translate-y-0 scale-100 blur-0"
            >
              <p className="text-4xl md:text-5xl font-medium leading-tight text-white drop-shadow-lg">
                {msg.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
