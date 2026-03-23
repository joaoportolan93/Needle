import asyncio
import httpx
from spotify_service import spotify_service

async def test():
    try:
        token = await spotify_service._get_access_token()
        print(f"Token length: {len(token)}")
        
        playlists = {
            "Top 50 Brasil": "37i9dQZEVXbMXbN3EUUhlg",
            "Top 50 Global": "37i9dQZEVXbMDoHDwVN2tF",
            "Today's Top Hits": "37i9dQZF1DXcBWIGoYBM5M",
            "Pop Brasil": "37i9dQZF1DWTkXjB1977A4",
            "Top Brasil": "37i9dQZF1DX0FOF1IUWK1W"
        }
        
        async with httpx.AsyncClient() as client:
            for name, pid in playlists.items():
                url = f"https://api.spotify.com/v1/playlists/{pid}"
                headers = {'Authorization': f'Bearer {token}'}
                res = await client.get(url, headers=headers)
                print(f"{name} ({pid}): {res.status_code}")
                if res.status_code != 200:
                    print(f"  {res.text[:100]}")
                else:
                    data = res.json()
                    print(f"  Tracks: {len(data.get('tracks', {}).get('items', []))}")
                    
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    asyncio.run(test())
