from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.alert import Alert, AlertStatus
from app.schemas import AlertOut, AlertUpdate

router = APIRouter()

@router.get("/", response_model=List[AlertOut])
def get_alerts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Alert)
        .options(joinedload(Alert.breach))
        .filter(Alert.user_id == current_user.id)
        .order_by(Alert.created_at.desc())
        .all()
    )

@router.get("/unread-count")
def get_unread_count(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(Alert).filter(
        Alert.user_id == current_user.id,
        Alert.status == AlertStatus.unread
    ).count()
    return {"count": count}

@router.patch("/{alert_id}", response_model=AlertOut)
def update_alert(alert_id: int, update: AlertUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id, Alert.user_id == current_user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = update.status
    db.commit()
    db.refresh(alert)
    return alert

@router.post("/mark-all-read")
def mark_all_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Alert).filter(
        Alert.user_id == current_user.id,
        Alert.status == AlertStatus.unread
    ).update({"status": AlertStatus.read})
    db.commit()
    return {"message": "All alerts marked as read"}

@router.delete("/{alert_id}")
def dismiss_alert(alert_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id, Alert.user_id == current_user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = AlertStatus.dismissed
    db.commit()
    return {"message": "Alert dismissed"}
