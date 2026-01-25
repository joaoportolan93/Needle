"""
Spotify API service with secure token management.
Implements Client Credentials Flow with token caching.
"""
import os
import time
import httpx
from dotenv import load_dotenv
from typing import Optional, Dict, Any

load_dotenv()


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
    
    async def search(
        self, 
        query: str, 
        types: str = "album,artist,track", 
        limit: int = 20,
        offset: int = 0
    ) -> Dict:
        """
        Search for items on Spotify.
        
        Args:
            query: Search query string
            types: Comma-separated list of item types (album, artist, track, playlist)
            limit: Number of results per type (1-50)
            offset: Pagination offset
        """
        return await self._make_request("/search", {
            "q": query,
            "type": types,
            "limit": limit,
            "offset": offset,
            "market": "BR"  # Brazilian market
        })
    
    async def get_new_releases(self, limit: int = 20, offset: int = 0) -> Dict:
        """
        Get new album releases.
        """
        return await self._make_request("/browse/new-releases", {
            "limit": limit,
            "offset": offset,
            "country": "BR"
        })
    
    async def get_categories(self, limit: int = 20, offset: int = 0) -> Dict:
        """
        Get Spotify categories.
        """
        return await self._make_request("/browse/categories", {
            "limit": limit,
            "offset": offset,
            "country": "BR",
            "locale": "pt_BR"
        })
    
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
        """
        return await self._make_request(f"/artists/{artist_id}/top-tracks", {"market": "BR"})
    
    async def get_artist_albums(self, artist_id: str, limit: int = 20) -> Dict:
        """
        Get artist's albums.
        """
        return await self._make_request(f"/artists/{artist_id}/albums", {
            "limit": limit,
            "include_groups": "album,single",
            "market": "BR"
        })
    
    async def get_track(self, track_id: str) -> Dict:
        """
        Get track details by ID.
        """
        return await self._make_request(f"/tracks/{track_id}", {"market": "BR"})


# Singleton instance
spotify_service = SpotifyService()
