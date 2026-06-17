from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.asset import MonitoredAsset, AssetStatus
from app.schemas import AssetCreate, AssetOut

router = APIRouter()

@router.get("/", response_model=List[AssetOut])
def get_assets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(MonitoredAsset).filter(
        MonitoredAsset.user_id == current_user.id,
        MonitoredAsset.is_active == True
    ).all()

@router.post("/", response_model=AssetOut)
def add_asset(asset_data: AssetCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(MonitoredAsset).filter(
        MonitoredAsset.user_id == current_user.id,
        MonitoredAsset.asset_value == asset_data.asset_value,
        MonitoredAsset.is_active == True
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Asset already being monitored")
    
    asset = MonitoredAsset(
        user_id=current_user.id,
        asset_type=asset_data.asset_type,
        asset_value=asset_data.asset_value,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset

@router.delete("/{asset_id}")
def remove_asset(asset_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    asset = db.query(MonitoredAsset).filter(
        MonitoredAsset.id == asset_id,
        MonitoredAsset.user_id == current_user.id
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    asset.is_active = False
    db.commit()
    return {"message": "Asset removed"}
