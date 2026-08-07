import { create } from 'zustand';
import type { Message } from '../types';

interface ConversationStore {
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
}

export const useConversationStore = create<ConversationStore>((set) => ({
  messages: [],
  setMessages: (messages) => set((state) => ({
    messages: typeof messages === 'function' ? messages(state.messages) : messages
  })),
}));
