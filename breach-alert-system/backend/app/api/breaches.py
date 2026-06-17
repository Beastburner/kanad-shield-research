from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.asset import MonitoredAsset, AssetType, AssetStatus
from app.models.breach import BreachRecord
from app.models.alert import Alert, Recommendation, NotificationPreference
from app.schemas import BreachOut
from app.services.breach_service import check_email_breach, check_domain_breach, normalize_breach_data, get_recommendations
from app.services.email_service import send_breach_alert_email
import asyncio

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
    
    # Run breach check
    raw_breaches = []
    if asset.asset_type == AssetType.email:
        raw_breaches = await check_email_breach(asset.asset_value)
    elif asset.asset_type == AssetType.domain:
        raw_breaches = await check_domain_breach(asset.asset_value)
    elif asset.asset_type == AssetType.phone:
        # Phone not supported by HIBP; use demo logic
        raw_breaches = []
    
    asset.last_checked = datetime.utcnow()
    new_breaches_count = 0
    
    for raw in raw_breaches:
        normalized = normalize_breach_data(raw)
        
        # Check if breach already recorded
        existing = db.query(BreachRecord).filter(
            BreachRecord.asset_id == asset.id,
            BreachRecord.breach_name == normalized["breach_name"]
        ).first()
        if existing:
            continue
        
        breach = BreachRecord(asset_id=asset.id, **normalized)
        db.add(breach)
        db.flush()
        new_breaches_count += 1
        
        asset.status = AssetStatus.breached
        
        # Create alert
        data_classes = json.loads(normalized.get("data_classes", "[]"))
        alert = Alert(
            user_id=current_user.id,
            breach_id=breach.id,
            title=f"Breach Detected: {normalized['breach_name']}",
            message=f"Your asset '{asset.asset_value}' was found in the '{normalized['breach_name']}' breach. Severity: {normalized['severity'].upper()}. Exposed data: {', '.join(data_classes[:3])}.",
        )
        db.add(alert)
        
        # Create recommendations
        recs = get_recommendations(normalized["severity"], data_classes)
        for rec in recs:
            recommendation = Recommendation(breach_id=breach.id, **rec)
            db.add(recommendation)
        
        # Send email if preference is set
        prefs = db.query(NotificationPreference).filter(NotificationPreference.user_id == current_user.id).first()
        if prefs and prefs.email_alerts:
            send_breach_alert_email(
                to_email=current_user.email,
                user_name=current_user.full_name,
                asset_value=asset.asset_value,
                breach_name=normalized["breach_name"],
                severity=normalized["severity"],
                data_classes=data_classes,
                recommendations=recs
            )
    
    if not raw_breaches:
        asset.status = AssetStatus.safe
    
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
        raw_breaches = []
        if asset.asset_type == AssetType.email:
            raw_breaches = await check_email_breach(asset.asset_value)
        elif asset.asset_type == AssetType.domain:
            raw_breaches = await check_domain_breach(asset.asset_value)
        
        asset.last_checked = datetime.utcnow()
        new_count = 0
        
        for raw in raw_breaches:
            normalized = normalize_breach_data(raw)
            existing = db.query(BreachRecord).filter(
                BreachRecord.asset_id == asset.id,
                BreachRecord.breach_name == normalized["breach_name"]
            ).first()
            if existing:
                continue
            breach = BreachRecord(asset_id=asset.id, **normalized)
            db.add(breach)
            db.flush()
            new_count += 1
            asset.status = AssetStatus.breached
            data_classes = json.loads(normalized.get("data_classes", "[]"))
            alert = Alert(
                user_id=current_user.id,
                breach_id=breach.id,
                title=f"Breach Detected: {normalized['breach_name']}",
                message=f"Your asset '{asset.asset_value}' was found in '{normalized['breach_name']}'. Severity: {normalized['severity'].upper()}.",
            )
            db.add(alert)
            recs = get_recommendations(normalized["severity"], data_classes)
            for rec in recs:
                db.add(Recommendation(breach_id=breach.id, **rec))
        
        if not raw_breaches:
            asset.status = AssetStatus.safe
        
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
    breach = db.query(BreachRecord).filter(BreachRecord.id == breach_id).first()
    if not breach:
        raise HTTPException(status_code=404, detail="Breach not found")
    return breach.recommendations
