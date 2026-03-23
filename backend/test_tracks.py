import httpx
import asyncio
from spotify_service import spotify_service

async def test():
    token = await spotify_service._get_access_token()
    headers = {'Authorization': f'Bearer {token}'}
    async with httpx.AsyncClient() as client:
        r = await client.get('https://api.spotify.com/v1/playlists/37i9dQZEVXbMXbN3EUUhlg/tracks?limit=5', headers=headers)
        print("Status", r.status_code)
        print("Text", r.text[:200])

if __name__ == '__main__':
    asyncio.run(test())
