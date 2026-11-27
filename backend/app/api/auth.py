from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DatabaseSession
from app.core.security import create_access_token, hash_password, verify_password
from app.models.driver import DriverProfile
from app.models.user import User, UserRole
from app.schemas.auth import LoginResponse, RegisterRequest, UserRead

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: DatabaseSession) -> User:
    user = User(
        email=str(payload.email).lower(),
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    if payload.role == UserRole.DRIVER:
        user.driver_profile = DriverProfile()
    db.add(user)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered") from error
    db.refresh(user)
    return user


@router.post("/login", response_model=LoginResponse)
def login(
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: DatabaseSession,
) -> LoginResponse:
    email = form.username.strip().lower()
    user = db.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")
    return LoginResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserRead)
def get_me(user: CurrentUser) -> User:
    return user
