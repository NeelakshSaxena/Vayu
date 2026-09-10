import { useState, useRef, useCallback } from 'react';
import { useConversationStore } from '../../../stores/useConversationStore';
import { useOrbStore } from '../../../stores/useOrbStore';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { chatWebSocket } from '../../../services/websocket';
import { playTTS } from '../../../services/audio/tts';
import { OrbState } from '../../../types';

export type GenerationState = 'idle' | 'submitting' | 'streaming' | 'stopped' | 'completed' | 'error';

export const useChat = () => {
  const messages = useConversationStore((state) => state.messages);
  const setMessages = useConversationStore((state) => state.setMessages);
  const setState = useOrbStore((state) => state.setState);
  const setErrorMessage = useOrbStore((state) => state.setErrorMessage);
  const appMode = useSettingsStore((state) => state.appMode);
  const provider = useSettingsStore((state) => state.provider);
  
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const activeAiMessageId = useRef<string | null>(null);

  const sendMessage = async (userMessage: string) => {
    setState(OrbState.Thinking);
    setGenerationState('submitting');

    const aiMessageId = Date.now().toString() + Math.random().toString(36).substring(2);
    activeAiMessageId.current = aiMessageId;
    setMessages((prev) => [...prev, { id: aiMessageId, role: 'model', text: "" }]);

    try {
      await chatWebSocket.connect();
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to connect to backend");
      setState(OrbState.Error);
      setGenerationState('error');
      activeAiMessageId.current = null;
      setMessages((prev) => prev.filter(m => m.id !== aiMessageId));
      setTimeout(() => { 
        setState(OrbState.Idle); 
        setErrorMessage(null); 
        setGenerationState('idle');
      }, 3000);
      return;
    }

    let hasReceivedToken = false;

    chatWebSocket.sendMessage(
      userMessage,
      (token) => {
        if (!hasReceivedToken) {
           hasReceivedToken = true;
           setGenerationState('streaming');
        }
        setMessages((prev) =>
          prev.map(msg =>
            msg.id === aiMessageId
            ? { ...msg, text: msg.text + token }
            : msg
          )
        );
      },
      (fullResponse) => {
        setGenerationState('completed');
        activeAiMessageId.current = null;
        if (appMode === 'hands-on') {
          setState(OrbState.Idle);
          return;
        }

        playTTS(
          fullResponse,
          () => setState(OrbState.Speaking),
          () => setState(OrbState.Idle),
          (err) => {
            console.error("TTS Error:", err);
            setErrorMessage(`Audio Error: ${err.message}`);
            setState(OrbState.Error);
            setTimeout(() => {
              setState(OrbState.Idle);
              setErrorMessage(null);
            }, 8000);
          }
        );
      },
      (error) => {
        console.error("WebSocket Error:", error);
        setGenerationState(prev => prev === 'stopped' ? 'stopped' : 'error');
        setErrorMessage("WebSocket Error");
        setState(OrbState.Error);
        activeAiMessageId.current = null;
        setTimeout(() => { 
           setState(OrbState.Idle); 
           setErrorMessage(null); 
           setGenerationState(prev => prev === 'error' ? 'idle' : prev);
        }, 3000);
      },
      provider
    );
  };

  const handleSendMessage = useCallback((text: string) => {
    const finalMsg = { id: Date.now().toString() + Math.random().toString(36).substring(2), role: 'user' as const, text };
    setMessages((prev) => [...prev, finalMsg]);
    sendMessage(text);
  }, [setMessages, sendMessage]);

  const stopGeneration = useCallback(() => {
    if (generationState === 'submitting' || generationState === 'streaming') {
      chatWebSocket.cancel();
      chatWebSocket.disconnect();
      setGenerationState('stopped');
      setState(OrbState.Idle);
      activeAiMessageId.current = null;
    }
  }, [generationState, setState]);

  const regenerate = useCallback(() => {
    // find the last user message
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
       // slice history up to and including the last user message
       const lastUserIdx = messages.lastIndexOf(lastUserMsg);
       setMessages(messages.slice(0, lastUserIdx + 1));
       sendMessage(lastUserMsg.text);
    }
  }, [messages, setMessages, sendMessage]);

  const editMessage = useCallback((messageId: string, newText: string) => {
    const msgIdx = messages.findIndex(m => m.id === messageId);
    if (msgIdx !== -1) {
       // truncate everything after this message, replace this message with new text
       const newMessages = messages.slice(0, msgIdx);
       const updatedMsg = { ...messages[msgIdx], text: newText };
       newMessages.push(updatedMsg);
       setMessages(newMessages);
       sendMessage(newText);
    }
  }, [messages, setMessages, sendMessage]);

  return { 
    messages, 
    handleSendMessage, 
    stopGeneration, 
    regenerate, 
    editMessage,
    generationState,
    activeAiMessageId: activeAiMessageId.current
  };
};
