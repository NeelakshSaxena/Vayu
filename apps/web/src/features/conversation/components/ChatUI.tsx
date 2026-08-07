import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../../../types';
import { OrbState } from '../../../types';
import chatbotIcon from '../../../assets/chatbot.png';

import { useSettingsStore } from '../../../stores/useSettingsStore';
import { Bubble, BubbleContent } from '../../../components/ui/bubble';
import { Response } from '../../../components/ui/response';
import { ShimmeringText } from '../../../components/ui/shimmering-text';

interface ChatUIProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  currentState: OrbState;
  ModelAvatar?: React.ReactNode;
}

export const ChatUI: React.FC<ChatUIProps> = ({ messages, onSendMessage, currentState, ModelAvatar }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const theme = useSettingsStore((state) => state.theme);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || currentState === OrbState.Thinking || currentState === OrbState.Speaking) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className={`absolute inset-0 z-10 flex flex-col pt-[120px] transition-opacity duration-500`}>
      {/* Messages Scroll Area */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto w-full scrollbar-hide px-4 md:px-8 pb-4 flex flex-col">
        <div className="flex-1 flex flex-col gap-6 w-full max-w-4xl mx-auto pb-8 pt-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center my-auto opacity-50 flex-1">
              <img src={chatbotIcon} className={`w-16 h-16 mb-4 ${theme === 'dark' ? 'invert' : ''}`} alt="Chatbot" />
              <p className={theme === 'dark' ? 'text-white/50' : 'text-black/50'}>Type a message to begin...</p>
            </div>
          )}
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isLatest = index === messages.length - 1;

            return (
              <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-4 max-w-[90%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar Slot */}
                  <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center overflow-hidden border border-black/10 dark:border-white/10 relative bg-black/5 dark:bg-white/5 self-end">
                    {isUser ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className={theme === 'dark' ? 'text-white' : 'text-black'}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    ) : (
                      ModelAvatar || null
                    )}
                  </div>

                  {/* Message Bubble */}
                  <Bubble align={isUser ? "end" : "start"} variant={isUser ? "user" : "model"}>
                    <BubbleContent>
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      ) : !msg.text ? (
                        <div className="flex items-center min-h-[28px]">
                          <ShimmeringText text="Thinking..." className="text-[18px] tracking-wide" duration={1.5} />
                        </div>
                      ) : (
                        <Response className="text-[18px] prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-[18px] prose-li:text-[18px] prose-a:text-[18px] prose-pre:bg-black/5 dark:prose-pre:bg-white/10 prose-pre:text-[14px] prose-pre:text-black dark:prose-pre:text-white">{msg.text}</Response>
                      )}
                    </BubbleContent>
                  </Bubble>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {/* Sticky Input Area */}
      <div className="w-full shrink-0 px-4 py-4 md:py-6 mt-auto">
        <div className="w-full max-w-4xl mx-auto">
          <form 
            onSubmit={handleSubmit}
            className={`flex items-end gap-2 p-1.5 rounded-3xl border transition-all ${
              theme === 'dark' ? 'bg-[#1e1e20] border-white/10 focus-within:border-blue-500/50 focus-within:ring-1 ring-blue-500/30' : 'bg-white border-black/10 focus-within:border-blue-500/50 focus-within:ring-1 ring-blue-500/30 shadow-sm'
            }`}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Message Vayu..."
              className={`flex-1 bg-transparent px-4 py-2 min-h-[44px] outline-none text-[18px] ${theme === 'dark' ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'}`}
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || currentState === OrbState.Thinking || currentState === OrbState.Speaking}
              className={`w-9 h-9 mb-[2px] mr-[2px] shrink-0 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                theme === 'dark' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
