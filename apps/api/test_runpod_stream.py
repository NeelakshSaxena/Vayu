import requests
import time
import json
import os

RUNPOD_API_KEY = os.environ.get("RUNPOD_API_KEY")
RUNPOD_ENDPOINT = os.environ.get("RUNPOD_ENDPOINT", "https://api.runpod.ai/v2/pzvq8btnwhle7h")

def test_stream_polling():
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {RUNPOD_API_KEY}"
    }
    
    data = {
        'input': {
            "prompt": "Write a short poem about artificial intelligence."
        }
    }
    
    print("Starting job...")
    response = requests.post(f"{RUNPOD_ENDPOINT}/run", headers=headers, json=data)
    job_data = response.json()
    job_id = job_data.get("id")
    print(f"Job ID: {job_id}")
    
    if not job_id:
        return
        
    url_stream = f"{RUNPOD_ENDPOINT}/stream/{job_id}"
    print("Polling stream...")
    for i in range(15):
        time.sleep(0.5)
        res = requests.get(url_stream, headers=headers)
        print(f"Poll {i+1} status:", res.status_code)
        if res.status_code == 200:
            sdata = res.json()
            print("Response:", json.dumps(sdata, indent=2))
            if sdata.get("status") in ["COMPLETED", "FAILED", "CANCELLED"]:
                print("Job finished with status:", sdata.get("status"))
                break

if __name__ == "__main__":
    test_stream_polling()
