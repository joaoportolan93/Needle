"""
SQLAlchemy models for Sonora database.
Defines User, Album, Review, social (followers, likes), and custom lists.
"""
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, Float,
    ForeignKey, CheckConstraint, UniqueConstraint, Table
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


# ===================== Associative Tables =====================

followers = Table(
    "followers",
    Base.metadata,
    Column("follower_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("followed_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
    UniqueConstraint("follower_id", "followed_id", name="uq_follower_followed"),
)

review_likes = Table(
    "review_likes",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("review_id", Integer, ForeignKey("reviews.id", ondelete="CASCADE"), primary_key=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
    UniqueConstraint("user_id", "review_id", name="uq_user_review_like"),
)


# ===================== User =====================

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
    theme_preference = Column(String(20), nullable=False, server_default="dark")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    lists = relationship("UserList", back_populates="user", cascade="all, delete-orphan")

    # Social: followers / following (self-referential many-to-many)
    following = relationship(
        "User",
        secondary=followers,
        primaryjoin=(id == followers.c.follower_id),
        secondaryjoin=(id == followers.c.followed_id),
        backref="followers_list",
        lazy="dynamic",
    )

    # Reviews this user has liked
    liked_reviews = relationship(
        "Review",
        secondary=review_likes,
        backref="liked_by",
        lazy="dynamic",
    )

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"


# ===================== Album =====================

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


# ===================== Review =====================

class Review(Base):
    """
    Review model for storing user album reviews / listening logs.
    Each user can have only one review per album.
    Rating and review_text are optional to support simple "log" entries.
    """
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    album_spotify_id = Column(String(50), ForeignKey("albums.spotify_id"), nullable=False, index=True)
    rating = Column(Float, nullable=True)
    review_text = Column(Text, nullable=True)
    is_favorite = Column(Boolean, default=False)
    listened_on = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint(
            "rating IS NULL OR (rating >= 0.5 AND rating <= 5.0)",
            name="check_rating_range",
        ),
    )

    # Relationships
    user = relationship("User", back_populates="reviews")
    album = relationship("Album", back_populates="reviews")

    def __repr__(self):
        return f"<Review(id={self.id}, user_id={self.user_id}, album='{self.album_spotify_id}', rating={self.rating})>"


# ===================== Custom Lists =====================

class UserList(Base):
    """
    User-created custom list of albums (e.g. "Top 10 Jazz Albums", "2024 Favorites").
    """
    __tablename__ = "user_lists"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="lists")
    items = relationship("ListItem", back_populates="user_list", cascade="all, delete-orphan", order_by="ListItem.position")

    def __repr__(self):
        return f"<UserList(id={self.id}, title='{self.title}')>"


class ListItem(Base):
    """
    An album entry within a user's custom list, with ordering support.
    """
    __tablename__ = "list_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    list_id = Column(Integer, ForeignKey("user_lists.id", ondelete="CASCADE"), nullable=False, index=True)
    album_spotify_id = Column(String(50), ForeignKey("albums.spotify_id"), nullable=False)
    position = Column(Integer, nullable=False, default=0)
    description = Column(Text, nullable=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("list_id", "album_spotify_id", name="uq_list_album"),
    )

    # Relationships
    user_list = relationship("UserList", back_populates="items")
    album = relationship("Album")

    def __repr__(self):
        return f"<ListItem(list_id={self.list_id}, album='{self.album_spotify_id}', pos={self.position})>"
