type WSMessageCallback = (content: string) => void;
type WSEndCallback = (fullResponse: string) => void;
type WSErrorCallback = (error: Error) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    
    this.ws = new WebSocket(this.url);
    return new Promise((resolve, reject) => {
      if (!this.ws) return reject(new Error("WebSocket not created"));
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
    });
  }

  sendMessage(message: string, onToken: WSMessageCallback, onEnd: WSEndCallback, onError: WSErrorCallback) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      onError(new Error("WebSocket is not connected"));
      return;
    }

    let fullResponse = "";

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "start") {
          // Stream starting
        } else if (data.type === "token") {
          const content = data.content;
          if (content) {
            fullResponse += content;
            onToken(content);
          }
        } else if (data.type === "end") {
          onEnd(fullResponse);
        }
      } catch (e: any) {
        onError(e);
      }
    };

    this.ws.onerror = () => {
      onError(new Error("WebSocket Error"));
    };

    this.ws.send(JSON.stringify({
      type: "chat",
      session_id: "default_session",
      message: message
    }));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const chatWebSocket = new WebSocketService('ws://localhost:8000/api/chat/ws');
