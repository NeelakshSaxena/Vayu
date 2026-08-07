import { useConversationStore } from '../../../stores/useConversationStore';
import { useOrbStore } from '../../../stores/useOrbStore';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { chatWebSocket } from '../../../services/websocket';
import { playTTS } from '../../../services/audio/tts';
import { OrbState } from '../../../types';

export const useChat = () => {
  const messages = useConversationStore((state) => state.messages);
  const setMessages = useConversationStore((state) => state.setMessages);
  const setState = useOrbStore((state) => state.setState);
  const setErrorMessage = useOrbStore((state) => state.setErrorMessage);
  const appMode = useSettingsStore((state) => state.appMode);

  const sendMessage = async (userMessage: string) => {
    setState(OrbState.Thinking);

    const aiMessageId = Date.now().toString() + Math.random().toString(36).substring(2);
    setMessages((prev) => [...prev, { id: aiMessageId, role: 'model', text: "" }]);

    try {
      await chatWebSocket.connect();
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to connect to backend");
      setState(OrbState.Error);
      setTimeout(() => { setState(OrbState.Idle); setErrorMessage(null); }, 3000);
      return;
    }

    chatWebSocket.sendMessage(
      userMessage,
      (token) => {
        setMessages((prev) =>
          prev.map(msg =>
            msg.id === aiMessageId
            ? { ...msg, text: msg.text + token }
            : msg
          )
        );
      },
      (fullResponse) => {
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
        setErrorMessage("WebSocket Error");
        setState(OrbState.Error);
        setTimeout(() => { setState(OrbState.Idle); setErrorMessage(null); }, 3000);
      }
    );
  };

  const handleSendMessage = (text: string) => {
    const finalMsg = { id: Date.now().toString() + Math.random().toString(36).substring(2), role: 'user' as const, text };
    setMessages((prev) => [...prev, finalMsg]);
    sendMessage(text);
  };

  return { messages, handleSendMessage };
};
