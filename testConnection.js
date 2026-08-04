import WebSocket from 'ws';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const apiKeyMatch = env.match(/VITE_SARVAM_API_KEY\s*=\s*"([^"]+)"/);
const apiKey = apiKeyMatch ? apiKeyMatch[1] : null;

console.log("Testing with API Key:", apiKey ? apiKey.substring(0, 5) + "..." : "NULL");

// Test: Query param auth on legacy endpoint
const wsUrl = `wss://api.sarvam.ai/speech-to-text/ws?api-subscription-key=${apiKey}`;
const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log("✅ Legacy Query Param Auth: Socket Opened!");
  ws.close();
});
ws.on('message', (data) => {
  console.log("📥 Legacy Msg:", data.toString());
});
ws.on('unexpected-response', (req, res) => {
  console.log("❌ Legacy Query Param Auth: REJECTED with code", res.statusCode);
});
