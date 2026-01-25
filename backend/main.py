"""
Sonora Backend - FastAPI Application
=====================================
Secure proxy for Spotify API and Reviews CRUD.
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from dotenv import load_dotenv

from database import get_db, engine, Base
import models, schemas
from spotify_service import spotify_service

load_dotenv()

# Create database tables on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Sonora API",
    description="Backend API for Sonora - Music Discovery & Reviews Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===================== Health Check =====================

@app.get("/api/health", tags=["Health"])
async def health_check():
    """Check if the API is running."""
    return {"status": "healthy", "message": "Sonora API is running!"}


# ===================== Spotify Proxy Routes =====================

@app.get("/api/spotify/search", tags=["Spotify"])
async def spotify_search(
    q: str = Query(..., min_length=1, description="Search query"),
    type: str = Query(default="album,artist,track", description="Types to search"),
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0)
):
    """
    Search for albums, artists, and tracks on Spotify.
    This endpoint proxies requests to Spotify, keeping credentials secure.
    """
    try:
        result = await spotify_service.search(q, type, limit, offset)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/spotify/new-releases", tags=["Spotify"])
async def spotify_new_releases(
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0)
):
    """Get new album releases from Spotify."""
    try:
        result = await spotify_service.get_new_releases(limit, offset)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/spotify/categories", tags=["Spotify"])
async def spotify_categories(
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0)
):
    """Get Spotify categories."""
    try:
        result = await spotify_service.get_categories(limit, offset)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/spotify/albums/{album_id}", tags=["Spotify"])
async def spotify_album_details(album_id: str):
    """Get album details by Spotify ID."""
    try:
        result = await spotify_service.get_album(album_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/spotify/artists/{artist_id}", tags=["Spotify"])
async def spotify_artist_details(artist_id: str):
    """Get artist details by Spotify ID."""
    try:
        result = await spotify_service.get_artist(artist_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/spotify/artists/{artist_id}/top-tracks", tags=["Spotify"])
async def spotify_artist_top_tracks(artist_id: str):
    """Get artist's top tracks."""
    try:
        result = await spotify_service.get_artist_top_tracks(artist_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/spotify/artists/{artist_id}/albums", tags=["Spotify"])
async def spotify_artist_albums(
    artist_id: str,
    limit: int = Query(default=20, ge=1, le=50)
):
    """Get artist's albums."""
    try:
        result = await spotify_service.get_artist_albums(artist_id, limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/spotify/tracks/{track_id}", tags=["Spotify"])
async def spotify_track_details(track_id: str):
    """Get track details by Spotify ID."""
    try:
        result = await spotify_service.get_track(track_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===================== Reviews CRUD =====================

def get_or_create_album(db: Session, review_data: schemas.ReviewCreate) -> models.Album:
    """Get existing album or create a new one from review data."""
    album = db.query(models.Album).filter(
        models.Album.spotify_id == review_data.album_spotify_id
    ).first()
    
    if not album:
        album = models.Album(
            spotify_id=review_data.album_spotify_id,
            name=review_data.album_name,
            artist_name=review_data.album_artist,
            cover_url=review_data.album_cover_url,
            release_date=review_data.album_release_date
        )
        db.add(album)
        db.commit()
        db.refresh(album)
    
    return album


@app.post("/api/reviews", response_model=schemas.ReviewResponse, tags=["Reviews"])
async def create_review(
    review: schemas.ReviewCreate,
    db: Session = Depends(get_db),
    # TODO: Add authentication dependency
    user_id: int = Query(default=1, description="Temporary: User ID (replace with auth)")
):
    """
    Create a new album review.
    A user can only have one review per album.
    """
    # Check if review already exists for this user and album
    existing = db.query(models.Review).filter(
        models.Review.user_id == user_id,
        models.Review.album_spotify_id == review.album_spotify_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="You already have a review for this album. Use PUT to update it."
        )
    
    # Ensure album exists in cache
    get_or_create_album(db, review)
    
    # Create review
    db_review = models.Review(
        user_id=user_id,
        album_spotify_id=review.album_spotify_id,
        rating=review.rating,
        review_text=review.review_text,
        is_favorite=review.is_favorite
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    
    return db_review


@app.get("/api/reviews/album/{album_id}", response_model=List[schemas.ReviewResponse], tags=["Reviews"])
async def get_album_reviews(
    album_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db)
):
    """Get all reviews for a specific album."""
    reviews = db.query(models.Review).filter(
        models.Review.album_spotify_id == album_id
    ).order_by(
        models.Review.created_at.desc()
    ).offset(offset).limit(limit).all()
    
    return reviews


@app.get("/api/reviews/user/{user_id}", response_model=List[schemas.ReviewResponse], tags=["Reviews"])
async def get_user_reviews(
    user_id: int,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db)
):
    """Get all reviews by a specific user."""
    reviews = db.query(models.Review).filter(
        models.Review.user_id == user_id
    ).order_by(
        models.Review.created_at.desc()
    ).offset(offset).limit(limit).all()
    
    return reviews


@app.get("/api/reviews/{review_id}", response_model=schemas.ReviewResponse, tags=["Reviews"])
async def get_review(review_id: int, db: Session = Depends(get_db)):
    """Get a specific review by ID."""
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    return review


@app.put("/api/reviews/{review_id}", response_model=schemas.ReviewResponse, tags=["Reviews"])
async def update_review(
    review_id: int,
    review_update: schemas.ReviewUpdate,
    db: Session = Depends(get_db),
    # TODO: Add authentication dependency
    user_id: int = Query(default=1, description="Temporary: User ID (replace with auth)")
):
    """Update an existing review. Only the review owner can update it."""
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if review.user_id != user_id:
        raise HTTPException(status_code=403, detail="You can only update your own reviews")
    
    # Update only provided fields
    update_data = review_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(review, field, value)
    
    db.commit()
    db.refresh(review)
    
    return review


@app.delete("/api/reviews/{review_id}", tags=["Reviews"])
async def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    # TODO: Add authentication dependency
    user_id: int = Query(default=1, description="Temporary: User ID (replace with auth)")
):
    """Delete a review. Only the review owner can delete it."""
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if review.user_id != user_id:
        raise HTTPException(status_code=403, detail="You can only delete your own reviews")
    
    db.delete(review)
    db.commit()
    
    return {"message": "Review deleted successfully"}


# ===================== Stats =====================

@app.get("/api/stats/album/{album_id}", tags=["Stats"])
async def get_album_stats(album_id: str, db: Session = Depends(get_db)):
    """Get statistics for an album (average rating, review count)."""
    from sqlalchemy import func
    
    stats = db.query(
        func.count(models.Review.id).label("review_count"),
        func.avg(models.Review.rating).label("average_rating")
    ).filter(models.Review.album_spotify_id == album_id).first()
    
    return {
        "album_id": album_id,
        "review_count": stats.review_count or 0,
        "average_rating": round(float(stats.average_rating), 2) if stats.average_rating else 0
    }


@app.get("/api/reviews/recent", response_model=List[schemas.ReviewResponse], tags=["Reviews"])
async def get_recent_reviews(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get the most recent reviews across all albums."""
    reviews = db.query(models.Review).order_by(
        models.Review.created_at.desc()
    ).limit(limit).all()
    
    return reviews


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
