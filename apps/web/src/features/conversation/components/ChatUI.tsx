import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../../../types';
import { OrbState } from '../../../types';
import chatbotIcon from '../../../assets/chatbot.png';

import { useSettingsStore } from '../../../stores/useSettingsStore';
import { Bubble, BubbleContent } from '../../../components/ui/bubble';
import { ShimmeringText } from '../../../components/ui/shimmering-text';
import { ResponseViewer } from './ResponseViewer';
import type { GenerationState } from '../hooks/useChat';

interface ChatUIProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  currentState: OrbState;
  ModelAvatar?: React.ReactNode;
  generationState?: GenerationState;
  onStopGeneration?: () => void;
  onRegenerate?: () => void;
  onEditMessage?: (id: string, newText: string) => void;
  activeAiMessageId?: string | null;
}

const SUGGESTIONS = [
  "Summarize this for me",
  "Help me write something",
  "Explain this simply",
  "What should I work on today?"
];

export const ChatUI: React.FC<ChatUIProps> = ({ 
  messages, 
  onSendMessage, 
  currentState, 
  ModelAvatar,
  generationState = 'idle',
  onStopGeneration,
  onRegenerate,
  onEditMessage,
  activeAiMessageId
}) => {
  const [inputText, setInputText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
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
    // Only scroll to bottom if we are near the bottom already, 
    // or if a new message was added. For simplicity, just scroll smooth on state change.
    scrollToBottom();
  }, [messages.length, currentState]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      // place cursor at end
      editInputRef.current.setSelectionRange(editInputRef.current.value.length, editInputRef.current.value.length);
    }
  }, [editingId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || generationState === 'submitting' || generationState === 'streaming') return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleEditSubmit = (msgId: string) => {
    if (editText.trim() && onEditMessage) {
      onEditMessage(msgId, editText.trim());
    }
    setEditingId(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, msgId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSubmit(msgId);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const isGenerating = generationState === 'submitting' || generationState === 'streaming';

  return (
    <div className={`absolute inset-0 z-10 flex flex-col pt-[120px] transition-opacity duration-500`}>
      {/* Messages Scroll Area */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto w-full scrollbar-hide px-4 md:px-8 pb-4 flex flex-col">
        <div className="flex-1 flex flex-col gap-6 w-full max-w-4xl mx-auto pb-8 pt-4">
          
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center my-auto flex-1 py-8">
              <img src={chatbotIcon} className={`w-16 h-16 mb-4 opacity-75 ${theme === 'dark' ? 'invert' : ''}`} alt="Chatbot" />
              <p className={theme === 'dark' ? 'text-white/60 mb-8' : 'text-black/60 mb-8'}>Type a message to begin...</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInputText(suggestion);
                      onSendMessage(suggestion);
                    }}
                    className={`px-4 py-3.5 rounded-xl text-sm text-left transition-all border shadow-lg ${
                      theme === 'dark' 
                        ? 'bg-[#18181b] hover:bg-[#242428] border-white/15 text-white/90 hover:border-white/25' 
                        : 'bg-white hover:bg-slate-50 border-black/15 text-black/90 hover:border-black/25'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isLatestAi = !isUser && index === messages.length - 1;
            const isEditing = editingId === msg.id;

            return (
              <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                {isUser ? (
                  <div className="flex gap-4 max-w-[90%] md:max-w-[75%] flex-row-reverse">
                    {/* Avatar Slot */}
                    <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center overflow-hidden border border-black/10 dark:border-white/10 relative bg-black/5 dark:bg-white/5 self-end">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className={theme === 'dark' ? 'text-white' : 'text-black'}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    </div>

                    {/* Message Bubble */}
                    <div className="flex flex-col gap-2 items-end max-w-full">
                      {isEditing ? (
                        <div className={`w-full max-w-lg p-3 rounded-2xl border ${theme === 'dark' ? 'bg-[#1e1e20] border-white/20' : 'bg-white border-black/20'} shadow-lg`}>
                          <textarea
                            ref={editInputRef}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => handleEditKeyDown(e, msg.id)}
                            className={`w-full bg-transparent outline-none resize-none min-h-[80px] ${theme === 'dark' ? 'text-white' : 'text-black'}`}
                            aria-label="Edit message"
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button onClick={() => setEditingId(null)} className={`px-3 py-1.5 rounded-lg text-sm ${theme === 'dark' ? 'hover:bg-white/10 text-white/70' : 'hover:bg-black/10 text-black/70'}`}>Cancel</button>
                            <button onClick={() => handleEditSubmit(msg.id)} className="px-3 py-1.5 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-500">Save & Submit</button>
                          </div>
                        </div>
                      ) : (
                        <Bubble 
                          align="end" 
                          variant="user"
                          onClick={() => {
                            if (!isGenerating && msg.id !== 'interim') {
                              setEditingId(msg.id);
                              setEditText(msg.text);
                            }
                          }}
                          className={!isGenerating && msg.id !== 'interim' ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}
                        >
                          <BubbleContent>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          </BubbleContent>
                        </Bubble>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Model Message */
                  (msg.text || (isGenerating && activeAiMessageId === msg.id)) ? (
                    <div className="flex gap-4 max-w-full md:max-w-[85%] flex-row">
                      {/* Avatar Slot */}
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center relative overflow-hidden bg-[#111111]">
                          {isGenerating && activeAiMessageId === msg.id && (
                            <div className="absolute inset-0 bg-blue-500/20 animate-pulse" />
                          )}
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_2px_rgba(59,130,246,0.5)] z-10" />
                        </div>
                      </div>
                      
                      {/* Message Bubble */}
                      <div className="flex flex-col gap-2 items-start max-w-full">
                        <Bubble 
                          align="start" 
                          variant="model"
                        >
                          <BubbleContent>
                            {!msg.text && isGenerating && activeAiMessageId === msg.id ? (
                              <div className="flex items-center min-h-[28px]">
                                <ShimmeringText text="Vayu is thinking..." className="text-[18px] tracking-wide" duration={1.5} />
                              </div>
                            ) : (
                              <ResponseViewer 
                                content={msg.text} 
                                isStreaming={isGenerating && activeAiMessageId === msg.id}
                                className="text-[18px] prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-[18px] prose-li:text-[18px] prose-a:text-[18px] prose-pre:bg-black/5 dark:prose-pre:bg-white/10 prose-pre:text-[14px] prose-pre:text-black dark:prose-pre:text-white"
                              />
                            )}
                          </BubbleContent>
                        </Bubble>

                        {/* Retry Button */}
                        {isLatestAi && !isGenerating && msg.text && onRegenerate && (
                          <button
                            onClick={onRegenerate}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                              theme === 'dark' 
                                ? 'text-white/70 border-white/10 hover:bg-white/10' 
                                : 'text-black/70 border-black/10 hover:bg-black/5'
                            }`}
                            aria-label="Retry generation"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {/* Sticky Input Area */}
      <div className="w-full shrink-0 px-4 py-4 md:py-6 mt-auto relative">
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
          
          {/* Stop Button (Floating above input) */}
          {isGenerating && onStopGeneration && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2">
              <button
                onClick={onStopGeneration}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-md border transition-colors ${
                  theme === 'dark'
                    ? 'bg-black/50 border-white/20 text-white hover:bg-white/10'
                    : 'bg-white/80 border-black/20 text-black hover:bg-black/5'
                }`}
                aria-label="Stop generation"
              >
                <div className="w-3 h-3 rounded-sm bg-current" />
                Stop
              </button>
            </div>
          )}

          <form 
            onSubmit={handleSubmit}
            className={`w-full flex items-end gap-2 p-1.5 rounded-3xl border transition-all ${
              theme === 'dark' ? 'bg-[#1e1e20] border-white/10 focus-within:border-blue-500/50 focus-within:ring-1 ring-blue-500/30' : 'bg-white border-black/10 focus-within:border-blue-500/50 focus-within:ring-1 ring-blue-500/30 shadow-sm'
            }`}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Message Vayu..."
              disabled={isGenerating}
              className={`flex-1 bg-transparent px-4 py-2 min-h-[44px] outline-none text-[18px] ${theme === 'dark' ? 'text-white placeholder:text-white/40 disabled:opacity-50' : 'text-black placeholder:text-black/40 disabled:opacity-50'}`}
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || isGenerating}
              className={`w-9 h-9 mb-[2px] mr-[2px] shrink-0 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                theme === 'dark' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
