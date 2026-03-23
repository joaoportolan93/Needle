import asyncio
from spotify_service import spotify_service

async def test():
    try:
        res = await spotify_service._make_request('/playlists/37i9dQZEVXbMXbN3EUUhlg')
        print('name:', res.get('name'))
        tracks = res.get('tracks', {}).get('items', [])
        print('tracks:', len(tracks))
        if tracks:
            print('track 0:', tracks[0].get('track', {}).get('name'))
    except Exception as e:
        print('error:', e)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(test())
