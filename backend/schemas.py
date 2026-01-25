"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime


# ============== User Schemas ==============

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=500)


class UserResponse(UserBase):
    id: int
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============== Album Schemas ==============

class AlbumBase(BaseModel):
    spotify_id: str
    name: str
    artist_name: str
    cover_url: Optional[str] = None
    release_date: Optional[str] = None


class AlbumCreate(AlbumBase):
    pass


class AlbumResponse(AlbumBase):
    cached_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============== Review Schemas ==============

class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    review_text: Optional[str] = Field(None, max_length=5000)
    is_favorite: bool = False


class ReviewCreate(ReviewBase):
    album_spotify_id: str
    # Album metadata for caching
    album_name: str
    album_artist: str
    album_cover_url: Optional[str] = None
    album_release_date: Optional[str] = None


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    review_text: Optional[str] = Field(None, max_length=5000)
    is_favorite: Optional[bool] = None


class ReviewResponse(ReviewBase):
    id: int
    user_id: int
    album_spotify_id: str
    created_at: datetime
    updated_at: datetime
    # Include user info
    user: Optional[UserResponse] = None
    # Include album info
    album: Optional[AlbumResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ReviewWithAlbum(ReviewBase):
    """Review response that includes album details for user profile pages."""
    id: int
    album_spotify_id: str
    created_at: datetime
    album_name: str
    album_artist: str
    album_cover_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ============== Auth Schemas ==============

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ============== Spotify Proxy Schemas ==============

class SpotifySearchParams(BaseModel):
    q: str = Field(..., min_length=1, max_length=200)
    type: str = Field(default="album,artist,track")
    limit: int = Field(default=20, ge=1, le=50)
    offset: int = Field(default=0, ge=0)
