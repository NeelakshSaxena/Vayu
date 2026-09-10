import asyncio
import os
import sys
from dotenv import load_dotenv

sys.path.insert(0, os.path.abspath('g:/Projects/Vayu/apps/api'))

from app.llm.providers.runpod import RunpodProvider
from app.core.config import settings

async def main():
    print('Testing Runpod Provider...')
    provider = RunpodProvider()
    messages = [{'role': 'user', 'content': 'Hello'}]
    async for chunk in provider.generate_stream(messages):
        print(chunk, end='', flush=True)
    print('\nDone')

if __name__ == '__main__':
    asyncio.run(main())
