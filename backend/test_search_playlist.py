import asyncio
import httpx
from spotify_service import spotify_service

async def test():
    try:
        # Get token
        token = await spotify_service._get_access_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        async with httpx.AsyncClient() as client:
            # 1. Search for "Top 50 Brasil" playlists
            url = "https://api.spotify.com/v1/search"
            params = {"q": "Top 50 Brasil", "type": "playlist", "limit": 3, "market": "BR"}
            
            print("Searching for Top 50 Brasil playlists...")
            res = await client.get(url, params=params, headers=headers)
            if res.status_code == 200:
                playlists = res.json().get('playlists', {}).get('items', [])
                for idx, p in enumerate(playlists):
                    if not p: continue
                    print(f"\n[{idx}] Name: {p.get('name')} | ID: {p.get('id')} | Owner: {p.get('owner', {}).get('id')}")
                    # Try to fetch it
                    p_res = await client.get(f"https://api.spotify.com/v1/playlists/{p.get('id')}", headers=headers)
                    print(f"Fetch status: {p_res.status_code}")
                    if p_res.status_code == 200:
                        tracks = p_res.json().get('tracks', {}).get('items', [])
                        print(f"Tracks count: {len(tracks)}")
                        if tracks and tracks[0].get('track'):
                            print(f"First track: {tracks[0]['track'].get('name')}")
            else:
                print(f"Search failed: {res.status_code} {res.text}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    asyncio.run(test())
