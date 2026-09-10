import asyncio
import httpx
import time

async def test_tasks():
    # Enqueue a task
    async with httpx.AsyncClient() as client:
        print("Enqueuing task...")
        resp = await client.post(
            "http://127.0.0.1:8000/api/tasks/", 
            json={"session_id": "test_session", "user_message": "hello background task"}
        )
        print(f"Enqueue response: {resp.status_code} {resp.text}")
        
        if resp.status_code != 200:
            return
            
        data = resp.json()
        job_id = data.get("job_id")
        
        # Poll status
        for _ in range(5):
            print(f"Polling status for job {job_id}...")
            resp = await client.get(f"http://127.0.0.1:8000/api/tasks/{job_id}")
            print(f"Status response: {resp.status_code} {resp.text}")
            await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(test_tasks())
