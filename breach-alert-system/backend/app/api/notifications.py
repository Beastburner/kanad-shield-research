from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.alert import NotificationPreference
from app.schemas import NotificationPrefOut, NotificationPrefUpdate

router = APIRouter()

@router.get("/preferences", response_model=NotificationPrefOut)
def get_preferences(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prefs = db.query(NotificationPreference).filter(NotificationPreference.user_id == current_user.id).first()
    if not prefs:
        prefs = NotificationPreference(user_id=current_user.id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return prefs

@router.patch("/preferences", response_model=NotificationPrefOut)
def update_preferences(update: NotificationPrefUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prefs = db.query(NotificationPreference).filter(NotificationPreference.user_id == current_user.id).first()
    if not prefs:
        prefs = NotificationPreference(user_id=current_user.id)
        db.add(prefs)
    
    for field, value in update.dict(exclude_none=True).items():
        setattr(prefs, field, value)
    
    db.commit()
    db.refresh(prefs)
    return prefs
