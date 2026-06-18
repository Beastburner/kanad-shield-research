from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.asset import MonitoredAsset
from app.models.breach import BreachRecord
from app.schemas import BreachOut
from app.services.legal_service import get_legal_intelligence
from app.services.monitoring import scan_asset_record

router = APIRouter()

@router.post("/scan/{asset_id}")
async def scan_asset(asset_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    asset = db.query(MonitoredAsset).filter(
        MonitoredAsset.id == asset_id,
        MonitoredAsset.user_id == current_user.id,
        MonitoredAsset.is_active == True
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    new_breaches_count = await scan_asset_record(db, asset, current_user)
    db.commit()

    return {
        "asset_id": asset_id,
        "asset_value": asset.asset_value,
        "new_breaches": new_breaches_count,
        "status": asset.status,
        "message": f"Scan complete. {new_breaches_count} new breach(es) found." if new_breaches_count else "No new breaches found."
    }

@router.post("/scan-all")
async def scan_all_assets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assets = db.query(MonitoredAsset).filter(
        MonitoredAsset.user_id == current_user.id,
        MonitoredAsset.is_active == True
    ).all()

    results = []
    for asset in assets:
        new_count = await scan_asset_record(db, asset, current_user)
        results.append({"asset": asset.asset_value, "new_breaches": new_count})

    db.commit()
    total = sum(r["new_breaches"] for r in results)
    return {"scanned": len(assets), "total_new_breaches": total, "results": results}

@router.get("/asset/{asset_id}", response_model=List[BreachOut])
def get_asset_breaches(asset_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    asset = db.query(MonitoredAsset).filter(
        MonitoredAsset.id == asset_id,
        MonitoredAsset.user_id == current_user.id
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset.breach_records

@router.get("/{breach_id}/recommendations")
def get_breach_recommendations(breach_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    breach = (
        db.query(BreachRecord)
        .join(MonitoredAsset, BreachRecord.asset_id == MonitoredAsset.id)
        .filter(BreachRecord.id == breach_id, MonitoredAsset.user_id == current_user.id)
        .first()
    )
    if not breach:
        raise HTTPException(status_code=404, detail="Breach not found")
    return breach.recommendations

@router.get("/{breach_id}/legal")
def get_breach_legal_intelligence(breach_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Link a breach to applicable Indian statutes, govt advisories and compliance duties (PS Req #7)."""
    breach = (
        db.query(BreachRecord)
        .join(MonitoredAsset, BreachRecord.asset_id == MonitoredAsset.id)
        .filter(BreachRecord.id == breach_id, MonitoredAsset.user_id == current_user.id)
        .first()
    )
    if not breach:
        raise HTTPException(status_code=404, detail="Breach not found")
    data_classes = json.loads(breach.data_classes) if breach.data_classes else []
    return get_legal_intelligence(data_classes, breach.severity.value if hasattr(breach.severity, "value") else breach.severity)
