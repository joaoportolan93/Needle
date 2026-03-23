import httpx
import asyncio
from spotify_service import spotify_service

async def test():
    try:
        # Get a token using your existing method
        token = await spotify_service._get_access_token()
        print(f"Token length: {len(token)}")
        
        # Make a direct request using httpx
        url = 'https://api.spotify.com/v1/playlists/37i9dQZEVXbMXbN3EUUhlg'
        headers = {'Authorization': f'Bearer {token}'}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    asyncio.run(test())
