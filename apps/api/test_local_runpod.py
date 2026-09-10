import requests
import json
import websockets
import asyncio

async def test_ws():
    uri = "ws://127.0.0.1:8000/api/chat/ws"
    try:
        async with websockets.connect(uri) as websocket:
            payload = {
                "type": "chat",
                "message": "hello, wrodl",
                "provider": "runpod",
                "model": "Qwen/Qwen3-14B"
            }
            await websocket.send(json.dumps(payload))
            
            while True:
                response = await websocket.recv()
                print("WS Response:", response)
                data = json.loads(response)
                if data.get("type") in ["error", "end"]:
                    break
    except Exception as e:
        print("WS Error:", e)

def test_rest():
    url = "http://127.0.0.1:8000/api/chat/"
    payload = {
        "message": "hello, wrodl",
        "provider": "runpod"
    }
    try:
        res = requests.post(url, json=payload)
        print("REST Status:", res.status_code)
        print("REST Response:", res.text)
    except Exception as e:
        print("REST Error:", e)

if __name__ == "__main__":
    test_rest()
    asyncio.run(test_ws())
