"""
Lists CRUD router for Sonora backend.
Manages user-created album lists (create, read, add items, delete).
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from database import get_db
from auth import get_current_user, get_current_user_optional
import models, schemas
from spotify_service import spotify_service

router = APIRouter(prefix="/api/lists", tags=["Lists"])


# ===================== Public List Routes =====================

@router.get("", response_model=List[schemas.UserListResponse])
async def get_public_lists(
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """Get all public lists, ordered by most recent. Includes user info and item count."""
    lists = (
        db.query(models.UserList)
        .filter(models.UserList.is_public == True)
        .options(
            joinedload(models.UserList.user),
            joinedload(models.UserList.items).joinedload(models.ListItem.album),
        )
        .order_by(models.UserList.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    results = []
    for lst in lists:
        result = schemas.UserListResponse(
            id=lst.id,
            user_id=lst.user_id,
            title=lst.title,
            description=lst.description,
            is_public=lst.is_public,
            created_at=lst.created_at,
            updated_at=lst.updated_at,
            items_count=len(lst.items),
            items=[
                schemas.ListItemResponse(
                    id=item.id,
                    list_id=item.list_id,
                    album_spotify_id=item.album_spotify_id,
                    position=item.position,
                    description=item.description,
                    added_at=item.added_at,
                    album=schemas.AlbumResponse(
                        spotify_id=item.album.spotify_id,
                        name=item.album.name,
                        artist_name=item.album.artist_name,
                        cover_url=item.album.cover_url,
                        release_date=item.album.release_date,
                        cached_at=item.album.cached_at,
                    ) if item.album else None,
                )
                for item in lst.items
            ],
            user=schemas.PublicUserResponse(
                id=lst.user.id,
                username=lst.user.username,
                avatar_url=lst.user.avatar_url,
                bio=lst.user.bio,
                theme_preference=lst.user.theme_preference,
                created_at=lst.user.created_at,
            ) if lst.user else None,
        )
        results.append(result)

    return results


@router.get("/user/{user_id}", response_model=List[schemas.UserListResponse])
async def get_user_lists(
    user_id: int,
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """Get all public lists by a specific user."""
    lists = (
        db.query(models.UserList)
        .filter(
            models.UserList.user_id == user_id,
            models.UserList.is_public == True,
        )
        .options(
            joinedload(models.UserList.user),
            joinedload(models.UserList.items).joinedload(models.ListItem.album),
        )
        .order_by(models.UserList.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    results = []
    for lst in lists:
        result = schemas.UserListResponse(
            id=lst.id,
            user_id=lst.user_id,
            title=lst.title,
            description=lst.description,
            is_public=lst.is_public,
            created_at=lst.created_at,
            updated_at=lst.updated_at,
            items_count=len(lst.items),
            items=[
                schemas.ListItemResponse(
                    id=item.id,
                    list_id=item.list_id,
                    album_spotify_id=item.album_spotify_id,
                    position=item.position,
                    description=item.description,
                    added_at=item.added_at,
                    album=schemas.AlbumResponse(
                        spotify_id=item.album.spotify_id,
                        name=item.album.name,
                        artist_name=item.album.artist_name,
                        cover_url=item.album.cover_url,
                        release_date=item.album.release_date,
                        cached_at=item.album.cached_at,
                    ) if item.album else None,
                )
                for item in lst.items
            ],
            user=schemas.PublicUserResponse(
                id=lst.user.id,
                username=lst.user.username,
                avatar_url=lst.user.avatar_url,
                bio=lst.user.bio,
                theme_preference=lst.user.theme_preference,
                created_at=lst.user.created_at,
            ) if lst.user else None,
        )
        results.append(result)

    return results


@router.get("/{list_id}", response_model=schemas.UserListResponse)
async def get_list_detail(
    list_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user_optional)
):
    """Get a single list with all its items and album details."""
    lst = (
        db.query(models.UserList)
        .filter(models.UserList.id == list_id)
        .options(
            joinedload(models.UserList.user),
            joinedload(models.UserList.items).joinedload(models.ListItem.album),
        )
        .first()
    )

    if not lst:
        raise HTTPException(status_code=404, detail="List not found")

    if not lst.is_public:
        if not current_user or current_user.id != lst.user_id:
            raise HTTPException(status_code=403, detail="This list is private")

    return schemas.UserListResponse(
        id=lst.id,
        user_id=lst.user_id,
        title=lst.title,
        description=lst.description,
        is_public=lst.is_public,
        created_at=lst.created_at,
        updated_at=lst.updated_at,
        items_count=len(lst.items),
        items=[
            schemas.ListItemResponse(
                id=item.id,
                list_id=item.list_id,
                album_spotify_id=item.album_spotify_id,
                position=item.position,
                description=item.description,
                added_at=item.added_at,
                album=schemas.AlbumResponse(
                    spotify_id=item.album.spotify_id,
                    name=item.album.name,
                    artist_name=item.album.artist_name,
                    cover_url=item.album.cover_url,
                    release_date=item.album.release_date,
                    cached_at=item.album.cached_at,
                ) if item.album else None,
            )
            for item in lst.items
        ],
        user=schemas.PublicUserResponse(
            id=lst.user.id,
            username=lst.user.username,
            avatar_url=lst.user.avatar_url,
            bio=lst.user.bio,
            theme_preference=lst.user.theme_preference,
            created_at=lst.user.created_at,
        ) if lst.user else None,
    )


# ===================== Authenticated Routes =====================

@router.post("", response_model=schemas.UserListResponse, status_code=status.HTTP_201_CREATED)
async def create_list(
    list_data: schemas.UserListCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Create a new list. Requires authentication."""
    db_list = models.UserList(
        user_id=current_user.id,
        title=list_data.title,
        description=list_data.description,
        is_public=list_data.is_public,
    )
    db.add(db_list)
    db.commit()
    db.refresh(db_list)

    return schemas.UserListResponse(
        id=db_list.id,
        user_id=db_list.user_id,
        title=db_list.title,
        description=db_list.description,
        is_public=db_list.is_public,
        created_at=db_list.created_at,
        updated_at=db_list.updated_at,
        items_count=0,
        items=[],
        user=schemas.PublicUserResponse(
            id=current_user.id,
            username=current_user.username,
            avatar_url=current_user.avatar_url,
            bio=current_user.bio,
            theme_preference=current_user.theme_preference,
            created_at=current_user.created_at,
        ),
    )


@router.post("/{list_id}/items", response_model=schemas.ListItemResponse, status_code=status.HTTP_201_CREATED)
async def add_list_item(
    list_id: int,
    item_data: schemas.ListItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Add an album to a list. Only the list owner can add items."""
    lst = db.query(models.UserList).filter(models.UserList.id == list_id).first()

    if not lst:
        raise HTTPException(status_code=404, detail="List not found")

    if lst.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only add items to your own lists")

    # Check if album already in list
    existing = db.query(models.ListItem).filter(
        models.ListItem.list_id == list_id,
        models.ListItem.album_spotify_id == item_data.album_spotify_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Album already in this list")

    # Check if album exists in the local cache
    album = db.query(models.Album).filter(models.Album.spotify_id == item_data.album_spotify_id).first()
    if not album:
        try:
            # Fetch album from Spotify and cache it
            spotify_album = await spotify_service.get_album(item_data.album_spotify_id)
            
            cover_url = None
            if spotify_album.get("images") and len(spotify_album.get("images")) > 0:
                cover_url = spotify_album["images"][0].get("url")
                
            artist_name = "Artista Desconhecido"
            if spotify_album.get("artists") and len(spotify_album.get("artists")) > 0:
                artist_name = spotify_album["artists"][0].get("name", artist_name)
                
            album = models.Album(
                spotify_id=item_data.album_spotify_id,
                name=spotify_album.get("name", "Álbum Desconhecido"),
                artist_name=artist_name,
                cover_url=cover_url,
                release_date=spotify_album.get("release_date")
            )
            db.add(album)
            db.commit()
            db.refresh(album)
        except Exception as e:
            # If Spotify API fails, add a placeholder to satisfy the foreign key constraint
            album = models.Album(
                spotify_id=item_data.album_spotify_id,
                name="Álbum Desconhecido",
                artist_name="Artista Desconhecido",
                cover_url=None
            )
            db.add(album)
            db.commit()
            db.refresh(album)

    db_item = models.ListItem(
        list_id=list_id,
        album_spotify_id=item_data.album_spotify_id,
        position=item_data.position,
        description=item_data.description,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    return db_item


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_list(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Delete a list. Only the list owner can delete it."""
    lst = db.query(models.UserList).filter(models.UserList.id == list_id).first()

    if not lst:
        raise HTTPException(status_code=404, detail="List not found")

    if lst.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own lists")

    db.delete(lst)
    db.commit()
