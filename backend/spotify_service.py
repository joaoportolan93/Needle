"""
Spotify API service with secure token management.
Implements Client Credentials Flow with token caching.
"""
import os
import time
import httpx
from dotenv import load_dotenv
from typing import Optional, Dict, Any

load_dotenv(override=True)


class SpotifyService:
    """
    Service for interacting with the Spotify API.
    Handles authentication using Client Credentials Flow.
    """
    
    TOKEN_URL = "https://accounts.spotify.com/api/token"
    API_BASE_URL = "https://api.spotify.com/v1"
    
    def __init__(self):
        self.client_id = os.getenv("SPOTIFY_CLIENT_ID")
        self.client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
        
        if not self.client_id or not self.client_secret:
            raise ValueError(
                "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in environment variables"
            )
        
        self._access_token: Optional[str] = None
        self._token_expires_at: float = 0
    
    async def _get_access_token(self) -> str:
        """
        Get a valid access token, refreshing if necessary.
        Implements token caching to avoid unnecessary API calls.
        """
        # Check if current token is still valid (with 60 second buffer)
        if self._access_token and time.time() < self._token_expires_at - 60:
            return self._access_token
        
        # Request new token using Client Credentials Flow
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.TOKEN_URL,
                data={
                    "grant_type": "client_credentials"
                },
                auth=(self.client_id, self.client_secret),
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"Failed to get Spotify token: {response.text}")
            
            token_data = response.json()
            self._access_token = token_data["access_token"]
            # Token typically expires in 3600 seconds (1 hour)
            self._token_expires_at = time.time() + token_data.get("expires_in", 3600)
            
            return self._access_token
    
    async def _make_request(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict:
        """
        Make an authenticated request to the Spotify API.
        """
        token = await self._get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.API_BASE_URL}{endpoint}",
                params=params,
                headers={
                    "Authorization": f"Bearer {token}"
                }
            )
            
            if response.status_code == 401:
                # Token expired, clear cache and retry
                self._access_token = None
                self._token_expires_at = 0
                return await self._make_request(endpoint, params)
            
            if response.status_code != 200:
                raise Exception(f"Spotify API error: {response.status_code} - {response.text}")
            
            return response.json()
    
    # ===================== Spotify API Methods =====================
    
    # Spotify basic access apps have a hard limit of 10 results per search call
    SEARCH_MAX_LIMIT = 10

    async def search(
        self, 
        query: str, 
        types: str = "album,artist,track", 
        limit: int = 10,
        offset: int = 0
    ) -> Dict:
        """
        Search for items on Spotify.
        
        Args:
            query: Search query string
            types: Comma-separated list of item types (album, artist, track, playlist)
            limit: Number of results per type (1-10 for basic access)
            offset: Pagination offset
        """
        # Cap limit to Spotify basic access maximum
        capped_limit = min(limit, self.SEARCH_MAX_LIMIT)
        return await self._make_request("/search", {
            "q": query,
            "type": types,
            "limit": capped_limit,
            "offset": offset,
            "market": "BR"  # Brazilian market
        })
    
    async def get_new_releases(self, limit: int = 10, offset: int = 0) -> Dict:
        """
        Get new album releases using Search API (tag:new).
        The /browse/new-releases endpoint is restricted (403) without Extended Quota Mode.
        """
        capped_limit = min(limit, self.SEARCH_MAX_LIMIT)
        search_result = await self._make_request("/search", {
            "q": "tag:new",
            "type": "album",
            "limit": capped_limit,
            "offset": offset,
            "market": "BR"
        })
        # Re-format to match the old /browse/new-releases shape: { albums: { items: [...] } }
        return {
            "albums": search_result.get("albums", {"items": []})
        }
    
    def get_categories(self, limit: int = 20, offset: int = 0) -> Dict:
        """
        Return a curated list of music genres.
        The /browse/categories endpoint is restricted (403) without Extended Quota Mode.
        """
        all_categories = [
            {"id": "pop", "name": "Pop", "icons": [{"url": "https://t.scdn.co/media/derived/pop-702x702_e6113c5d8c5e808a284e6d876b898435_0_0_702_702.jpg"}]},
            {"id": "rock", "name": "Rock", "icons": [{"url": "https://t.scdn.co/media/derived/rock_702x702_ed1d4d112341265e5a1ed4b1a17e006f_0_0_702_702.jpg"}]},
            {"id": "hip-hop", "name": "Hip Hop", "icons": [{"url": "https://t.scdn.co/media/original/hip-702x702_5765f0b5-01e1-424c-a4d1-86f346e1f8c4.jpg"}]},
            {"id": "r-n-b", "name": "R&B", "icons": [{"url": "https://t.scdn.co/media/derived/r-b-702x702_0e32d04b84d0d8ad3d8d6b22ed3c9832_0_0_702_702.jpg"}]},
            {"id": "sertanejo", "name": "Sertanejo", "icons": [{"url": "https://t.scdn.co/images/ad57c257-b1f4-4f40-baaa-f1f10a498075.jpeg"}]},
            {"id": "funk", "name": "Funk", "icons": [{"url": "https://t.scdn.co/images/573b51b0c1e94df29b18edfb87999f1b.jpeg"}]},
            {"id": "mpb", "name": "MPB", "icons": [{"url": "https://t.scdn.co/images/3770e5e5a3264a53b2bddbc32ab0e9b1.jpeg"}]},
            {"id": "electronic", "name": "Eletrônica", "icons": [{"url": "https://t.scdn.co/media/derived/edm-702x702_ec94d280bb9c23ac1a4a89bc5ce17da1_0_0_702_702.jpg"}]},
            {"id": "indie", "name": "Indie", "icons": [{"url": "https://t.scdn.co/media/derived/indie-702x702_be51c55f15f80aa753faff04fdc44a66_0_0_702_702.jpg"}]},
            {"id": "latin", "name": "Latin", "icons": [{"url": "https://t.scdn.co/media/derived/latin-702x702_3e354e65d1a5e0aa0a1acb8a2e12e5de_0_0_702_702.jpg"}]},
            {"id": "jazz", "name": "Jazz", "icons": [{"url": "https://t.scdn.co/media/derived/jazz-702x702_4b18f907e64faadcbf5693bb0d3e0b72_0_0_702_702.jpg"}]},
            {"id": "classical", "name": "Clássica", "icons": [{"url": "https://t.scdn.co/media/derived/classical-702x702_b3e70e5be61f0a6c5ae4a07a9eb8e95f_0_0_702_702.jpg"}]},
            {"id": "reggae", "name": "Reggae", "icons": [{"url": "https://t.scdn.co/media/derived/reggae-702x702_5da39c38f062e7f19e0d30a6ef4c2a6e_0_0_702_702.jpg"}]},
            {"id": "metal", "name": "Metal", "icons": [{"url": "https://t.scdn.co/media/derived/metal-702x702_2e33a2bba3d8ef0acf2c85c4c0b3e1b6_0_0_702_702.jpg"}]},
            {"id": "country", "name": "Country", "icons": [{"url": "https://t.scdn.co/media/derived/icon-702x702_8bf7e04bcfae5743dc0d42b75ef0e6c4_0_0_702_702.jpg"}]},
            {"id": "blues", "name": "Blues", "icons": [{"url": "https://t.scdn.co/media/derived/blues-702x702_37bcbd7e66dac3e0d74614b28d2b0d07_0_0_702_702.jpg"}]},
            {"id": "pagode", "name": "Pagode", "icons": [{"url": "https://t.scdn.co/images/0cbf1ce8-f6ad-49cf-8f6a-de2715b2e55c.jpeg"}]},
            {"id": "gospel", "name": "Gospel", "icons": [{"url": "https://t.scdn.co/media/derived/icon-702x702_0f897db97d27ec7c6c3e5def96a8d973_0_0_702_702.jpg"}]},
            {"id": "soul", "name": "Soul", "icons": [{"url": "https://t.scdn.co/media/derived/soul-702x702_fd56c0a98a514366e9e0a6b0e65b4b05_0_0_702_702.jpg"}]},
            {"id": "reggaeton", "name": "Reggaeton", "icons": [{"url": "https://t.scdn.co/media/original/reggaeton-702x702_be3a4a5b9c7d432cba8e44a51ee1e949.jpg"}]},
        ]
        # Apply pagination
        paginated = all_categories[offset:offset + limit]
        return {
            "categories": {
                "items": paginated,
                "total": len(all_categories),
                "limit": limit,
                "offset": offset,
            }
        }
    
    async def get_album(self, album_id: str) -> Dict:
        """
        Get album details by ID.
        """
        return await self._make_request(f"/albums/{album_id}", {"market": "BR"})
    
    async def get_artist(self, artist_id: str) -> Dict:
        """
        Get artist details by ID.
        """
        return await self._make_request(f"/artists/{artist_id}")
    
    async def get_artist_top_tracks(self, artist_id: str) -> Dict:
        """
        Get artist's top tracks.
        The /artists/{id}/top-tracks endpoint is restricted (403).
        Using Search API as a fallback.
        """
        artist = await self.get_artist(artist_id)
        artist_name = artist.get("name", "")
        
        search_result = await self.search(
            query=f"artist:{artist_name}",
            types="track",
            limit=10
        )
        
        tracks = search_result.get("tracks", {}).get("items", [])
        # Sort by popularity to simulate "top tracks"
        tracks.sort(key=lambda x: x.get("popularity", 0), reverse=True)
        
        return {"tracks": tracks}
    
    async def get_artist_albums(self, artist_id: str, limit: int = 20) -> Dict:
        """
        Get artist's albums.
        The /artists/{id}/albums endpoint is restricted (403).
        Using Search API as a fallback.
        """
        artist = await self.get_artist(artist_id)
        artist_name = artist.get("name", "")
        
        search_result = await self.search(
            query=f"artist:{artist_name}",
            types="album",
            limit=limit
        )
        
        albums_data = search_result.get("albums", {})
        
        return {
            "items": albums_data.get("items", []),
            "total": albums_data.get("total", 0),
            "limit": limit,
            "offset": 0
        }
    
    async def get_track(self, track_id: str) -> Dict:
        """
        Get track details by ID.
        """
        return await self._make_request(f"/tracks/{track_id}", {"market": "BR"})


# Singleton instance
spotify_service = SpotifyService()
