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

  // We take the last 3 messages to display
  const displayMessages = messages.slice(-3);
  
  // Pad the array to exactly 3 items so the layout transitions are stable
  while (displayMessages.length < 3) {
    displayMessages.unshift({ id: `empty-${displayMessages.length}`, role: 'user', text: '' });
  }

  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-start pt-[20vh] pointer-events-none z-10 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex flex-col items-center justify-end h-[40vh] w-full max-w-4xl px-8 relative">
        {displayMessages.map((msg, index) => {
          // Determine the visual tier of the message based on its position in the array
          // index 2 = latest message (bottom-most in the flex container, but visually dominant)
          // index 1 = previous message
          // index 0 = oldest message
          
          let opacityClass = 'opacity-0';
          let transformClass = 'translate-y-[-40px] scale-90';
          let fontClass = 'text-2xl';
          
          if (msg.text) {
            if (index === 2) {
              opacityClass = 'opacity-100';
              transformClass = 'translate-y-0 scale-100';
              fontClass = 'text-5xl font-medium';
            } else if (index === 1) {
              opacityClass = 'opacity-50';
              transformClass = 'translate-y-[-30px] scale-95';
              fontClass = 'text-4xl font-normal';
            } else if (index === 0) {
              opacityClass = 'opacity-20';
              transformClass = 'translate-y-[-60px] scale-90';
              fontClass = 'text-3xl font-light';
            }
          }

          return (
            <div 
              key={msg.id}
              className={`absolute w-full text-center transition-all duration-700 ease-in-out ${opacityClass} ${transformClass}`}
              style={{
                // Manually absolute position them so they can slide through each other gracefully
                bottom: index === 2 ? '0' : index === 1 ? '70px' : '130px',
              }}
            >
              <p className={`${fontClass} leading-tight text-white drop-shadow-lg`}>
                {msg.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
