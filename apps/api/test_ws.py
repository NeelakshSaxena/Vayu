import asyncio
import websockets
import json

async def test_ws():
    uri = "ws://127.0.0.1:8000/api/chat/ws"
    print(f"Connecting to {uri}...")
    async with websockets.connect(uri) as websocket:
        print("Connected!")
        payload = {
            "type": "chat",
            "session_id": "test_session",
            "message": "hello bro",
            "provider": "runpod"
        }
        await websocket.send(json.dumps(payload))
        
        while True:
            try:
                msg = await asyncio.wait_for(websocket.recv(), timeout=20.0)
                data = json.loads(msg)
                print(f"Received: {data}")
                if data.get("type") in ["end", "error"]:
                    break
            except asyncio.TimeoutError:
                print("Timeout waiting for message!")
                break

if __name__ == "__main__":
    asyncio.run(test_ws())
