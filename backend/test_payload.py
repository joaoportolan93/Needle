import asyncio
from spotify_service import spotify_service

async def test():
    try:
        artist_id = '3MZsBdqDrRTJihTHQrO6Dq'
        print("Testing getting artist top tracks")
        res = await spotify_service.get_artist_top_tracks(artist_id)
        tracks = res.get('tracks', [])
        print(f"Got {len(tracks)} tracks")
        if tracks:
            track = tracks[0]
            print("Track data keys:", list(track.keys()))
            print("Has album?", 'album' in track)
            if 'album' in track:
                print("Album keys:", list(track['album'].keys()))
                print("Has images?", 'images' in track['album'])
                if 'images' in track['album']:
                    print("First image:", track['album']['images'][0] if track['album']['images'] else "EMPTY")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(test())
