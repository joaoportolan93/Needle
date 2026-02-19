"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
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
    theme_preference: Optional[str] = Field(None, max_length=20)


class UserResponse(UserBase):
    """Full user data — only for authenticated endpoints (e.g. /me, /settings)."""
    id: int
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    theme_preference: str = "dark"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PublicUserResponse(BaseModel):
    """User data without email — safe for public endpoints (feed, lists, profiles)."""
    id: int
    username: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    theme_preference: str = "dark"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProfileResponse(PublicUserResponse):
    """Extended public user response with social counts for profile pages."""
    followers_count: int = 0
    following_count: int = 0
    reviews_count: int = 0

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
    rating: Optional[float] = Field(None, ge=0.5, le=5.0, description="Rating from 0.5 to 5 stars")
    review_text: Optional[str] = Field(None, max_length=5000)
    is_favorite: bool = False
    listened_on: Optional[datetime] = None


class ReviewCreate(ReviewBase):
    album_spotify_id: str
    # Album metadata for caching
    album_name: str
    album_artist: str
    album_cover_url: Optional[str] = None
    album_release_date: Optional[str] = None


class ReviewUpdate(BaseModel):
    rating: Optional[float] = Field(None, ge=0.5, le=5.0)
    review_text: Optional[str] = Field(None, max_length=5000)
    is_favorite: Optional[bool] = None
    listened_on: Optional[datetime] = None


class ReviewResponse(ReviewBase):
    id: int
    user_id: int
    album_spotify_id: str
    created_at: datetime
    updated_at: datetime
    likes_count: int = 0
    # Include user info (without email for privacy)
    user: Optional[PublicUserResponse] = None
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


# ============== Follow Schemas ==============

class FollowResponse(BaseModel):
    follower_id: int
    followed_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============== Review Like Schemas ==============

class ReviewLikeResponse(BaseModel):
    user_id: int
    review_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============== Custom List Schemas ==============

class ListItemBase(BaseModel):
    album_spotify_id: str
    position: int = 0
    description: Optional[str] = None


class ListItemCreate(ListItemBase):
    pass


class ListItemResponse(ListItemBase):
    id: int
    list_id: int
    added_at: datetime
    album: Optional[AlbumResponse] = None

    model_config = ConfigDict(from_attributes=True)


class UserListBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    is_public: bool = True


class UserListCreate(UserListBase):
    pass


class UserListUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    is_public: Optional[bool] = None


class UserListResponse(UserListBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    items_count: int = 0
    items: List[ListItemResponse] = []
    user: Optional[PublicUserResponse] = None

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


class LoginResponse(Token):
    """Login response with token, user data, and theme for immediate frontend use."""
    theme_preference: str = "dark"
    user: UserResponse

    model_config = ConfigDict(from_attributes=True)


class UserSettingsUpdate(BaseModel):
    """Schema for updating account settings (bio, avatar, theme)."""
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = None
    theme_preference: Optional[str] = Field(None, max_length=20)


# ============== Spotify Proxy Schemas ==============

class SpotifySearchParams(BaseModel):
    q: str = Field(..., min_length=1, max_length=200)
    type: str = Field(default="album,artist,track")
    limit: int = Field(default=20, ge=1, le=50)
    offset: int = Field(default=0, ge=0)
