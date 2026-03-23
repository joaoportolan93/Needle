"""
Refresh album cover URLs AND fix stale spotify_ids.
Only updates the albums table — does NOT touch users, reviews, or lists.
Uses Spotify Search API (by name + artist) as fallback when ID lookup fails.

Run: python refresh_covers.py
"""
import asyncio
import httpx
import os
from dotenv import load_dotenv
from database import SessionLocal
import models

load_dotenv()


async def get_spotify_token() -> str:
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
    if not client_id or not client_secret:
        return None
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://accounts.spotify.com/api/token",
            data={"grant_type": "client_credentials"},
            auth=(client_id, client_secret),
        )
        if response.status_code == 200:
            return response.json()["access_token"]
    return None


async def api_get(client, url, token, params=None, retries=2):
    """GET with retry on timeout."""
    for attempt in range(retries + 1):
        try:
            r = await client.get(
                url,
                headers={"Authorization": f"Bearer {token}"},
                params=params,
            )
            return r
        except (httpx.ReadTimeout, httpx.ConnectTimeout):
            if attempt < retries:
                await asyncio.sleep(1)
            else:
                return None


async def search_album(client, token, name, artist):
    """Search Spotify for an album. Returns (id, cover_url) or (None, None)."""
    # Clean special chars from search query
    clean_name = name.replace("&", "").replace(">", "").replace("<", "")
    query = f"album:{clean_name} artist:{artist}"
    response = await api_get(
        client,
        "https://api.spotify.com/v1/search",
        token,
        params={"q": query, "type": "album", "limit": 1, "market": "BR"},
    )
    if response and response.status_code == 200:
        albums = response.json().get("albums", {}).get("items", [])
        if albums:
            album = albums[0]
            cover_url = album["images"][0]["url"] if album.get("images") else None
            return album["id"], cover_url
    return None, None


async def refresh_covers():
    print("Refreshing album IDs and cover URLs...\n")
    token = await get_spotify_token()
    if not token:
        print("ERROR: Could not get Spotify token. Check your .env credentials.")
        return

    db = SessionLocal()
    try:
        albums = db.query(models.Album).all()
        print(f"Found {len(albums)} albums in database.\n")

        updated = 0
        failed = 0

        async with httpx.AsyncClient(timeout=10.0) as client:
            for i, album in enumerate(albums):
                try:
                    # Rate limit: small delay between requests
                    if i > 0:
                        await asyncio.sleep(0.3)

                    # First try direct ID lookup
                    direct = await api_get(
                        client,
                        f"https://api.spotify.com/v1/albums/{album.spotify_id}",
                        token,
                        params={"market": "BR"},
                    )

                    if direct and direct.status_code == 200:
                        data = direct.json()
                        images = data.get("images", [])
                        new_url = images[0]["url"] if images else None
                        if new_url and new_url != album.cover_url:
                            album.cover_url = new_url
                            print(f"  UPDATED cover: {album.name}")
                            updated += 1
                        else:
                            print(f"  OK: {album.name}")
                        continue

                    # ID returned 404 → search by name + artist
                    await asyncio.sleep(0.3)
                    new_id, new_url = await search_album(
                        client, token, album.name, album.artist_name
                    )

                    if new_id:
                        old_id = album.spotify_id
                        album.spotify_id = new_id
                        if new_url:
                            album.cover_url = new_url

                        # Also update all reviews that reference the old ID
                        review_count = (
                            db.query(models.Review)
                            .filter(models.Review.album_spotify_id == old_id)
                            .update({"album_spotify_id": new_id})
                        )

                        # Also update all list items that reference the old ID
                        list_item_count = (
                            db.query(models.ListItem)
                            .filter(models.ListItem.album_spotify_id == old_id)
                            .update({"album_spotify_id": new_id})
                        )

                        print(f"  FIXED: {album.name} (id: {old_id[:8]}→{new_id[:8]}, {review_count} reviews, {list_item_count} list items)")
                        updated += 1
                    else:
                        print(f"  FAILED: {album.name}")
                        failed += 1

                except Exception as e:
                    print(f"  ERROR: {album.name} — {e}")
                    failed += 1

        db.commit()
        print(f"\nDone! {updated} fixed, {failed} failed, "
              f"{len(albums) - updated - failed} already correct.")
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(refresh_covers())
