"""
User management routes: Registration, Login, Profile, and Settings.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from auth import hash_password, verify_password, create_access_token, get_current_user
import models, schemas

router = APIRouter(prefix="/api/users", tags=["Users"])

VALID_THEMES = {"dark", "light", "system"}


# ===================== Register =====================

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    Checks for duplicate email and username before creating.
    """
    # Check duplicate email
    if db.query(models.User).filter(models.User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Check duplicate username
    if db.query(models.User).filter(models.User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This username is already taken.",
        )

    # Create user
    db_user = models.User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


# ===================== Login =====================

@router.post("/login", response_model=schemas.LoginResponse)
async def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate a user by email and password.
    Returns a JWT access token and the user's theme preference.
    """
    user = db.query(models.User).filter(models.User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "theme_preference": user.theme_preference,
        "user": user,
    }


# ===================== Current User =====================

@router.get("/me", response_model=schemas.UserResponse)
async def get_me(current_user: models.User = Depends(get_current_user)):
    """Return the profile of the currently authenticated user."""
    return current_user


# ===================== Settings =====================

@router.put("/settings", response_model=schemas.UserResponse)
async def update_settings(
    settings: schemas.UserSettingsUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update account settings (bio, avatar, theme).
    Only updates fields that are explicitly provided.
    """
    update_data = settings.model_dump(exclude_unset=True)

    # Validate theme_preference if provided
    if "theme_preference" in update_data:
        if update_data["theme_preference"] not in VALID_THEMES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"theme_preference must be one of: {', '.join(sorted(VALID_THEMES))}",
            )

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return current_user


# ===================== Public Profile =====================

@router.get("/{username}", response_model=schemas.UserProfileResponse)
async def get_public_profile(username: str, db: Session = Depends(get_db)):
    """
    Get the public profile of a user by username.
    Returns user info with follower, following, and review counts.
    """
    user = db.query(models.User).filter(models.User.username == username).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    # Count followers (users who follow this user)
    followers_count = db.query(models.followers).filter(
        models.followers.c.followed_id == user.id
    ).count()

    # Count following (users this user follows)
    following_count = db.query(models.followers).filter(
        models.followers.c.follower_id == user.id
    ).count()

    # Count reviews
    reviews_count = db.query(models.Review).filter(
        models.Review.user_id == user.id
    ).count()

    return schemas.UserProfileResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        avatar_url=user.avatar_url,
        bio=user.bio,
        theme_preference=user.theme_preference,
        created_at=user.created_at,
        followers_count=followers_count,
        following_count=following_count,
        reviews_count=reviews_count,
    )
