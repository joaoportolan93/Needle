"""
SQLAlchemy models for Sonora database.
Defines User, Album (cache), and Review tables.
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    """
    User model for storing user account information.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"


class Album(Base):
    """
    Album model for caching Spotify album metadata.
    This reduces API calls and allows reviews to display even if Spotify is down.
    """
    __tablename__ = "albums"

    spotify_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    artist_name = Column(String(255), nullable=False)
    cover_url = Column(String(500), nullable=True)
    release_date = Column(String(20), nullable=True)
    cached_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    reviews = relationship("Review", back_populates="album")

    def __repr__(self):
        return f"<Album(spotify_id='{self.spotify_id}', name='{self.name}')>"


class Review(Base):
    """
    Review model for storing user album reviews.
    Each user can have only one review per album.
    """
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    album_spotify_id = Column(String(50), ForeignKey("albums.spotify_id"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    review_text = Column(Text, nullable=True)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Check constraint for rating (1-5)
    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
    )

    # Relationships
    user = relationship("User", back_populates="reviews")
    album = relationship("Album", back_populates="reviews")

    def __repr__(self):
        return f"<Review(id={self.id}, user_id={self.user_id}, album='{self.album_spotify_id}', rating={self.rating})>"
