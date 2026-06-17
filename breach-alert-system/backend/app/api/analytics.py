from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import json
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.asset import MonitoredAsset, AssetStatus
from app.models.breach import BreachRecord, SeverityLevel
from app.models.alert import Alert, AlertStatus

router = APIRouter()

@router.get("/summary")
def get_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_asset_ids = [a.id for a in db.query(MonitoredAsset).filter(
        MonitoredAsset.user_id == current_user.id, MonitoredAsset.is_active == True
    ).all()]

    total_assets = len(user_asset_ids)
    total_breaches = db.query(BreachRecord).filter(BreachRecord.asset_id.in_(user_asset_ids)).count() if user_asset_ids else 0
    active_alerts = db.query(Alert).filter(Alert.user_id == current_user.id, Alert.status == AlertStatus.unread).count()
    critical_alerts = db.query(Alert).join(BreachRecord).filter(
        Alert.user_id == current_user.id,
        Alert.status == AlertStatus.unread,
        BreachRecord.severity == SeverityLevel.critical
    ).count() if user_asset_ids else 0

    breached_assets = db.query(MonitoredAsset).filter(
        MonitoredAsset.user_id == current_user.id,
        MonitoredAsset.status == AssetStatus.breached,
        MonitoredAsset.is_active == True
    ).count()

    breach_by_severity = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    if user_asset_ids:
        for sev in SeverityLevel:
            count = db.query(BreachRecord).filter(
                BreachRecord.asset_id.in_(user_asset_ids),
                BreachRecord.severity == sev
            ).count()
            breach_by_severity[sev.value] = count

    recent_breaches = []
    if user_asset_ids:
        records = db.query(BreachRecord).filter(
            BreachRecord.asset_id.in_(user_asset_ids)
        ).order_by(BreachRecord.detected_at.desc()).limit(5).all()
        for r in records:
            recent_breaches.append({
                "id": r.id,
                "breach_name": r.breach_name,
                "severity": r.severity,
                "severity_score": r.severity_score,
                "data_classes": json.loads(r.data_classes) if r.data_classes else [],
                "detected_at": r.detected_at.isoformat() if r.detected_at else None,
                "pwn_count": r.pwn_count,
            })

    # Most leaked data types
    data_type_counts = {}
    if user_asset_ids:
        all_breaches = db.query(BreachRecord).filter(BreachRecord.asset_id.in_(user_asset_ids)).all()
        for b in all_breaches:
            if b.data_classes:
                try:
                    classes = json.loads(b.data_classes)
                    for dc in classes:
                        data_type_counts[dc] = data_type_counts.get(dc, 0) + 1
                except Exception:
                    pass

    most_leaked = sorted([{"type": k, "count": v} for k, v in data_type_counts.items()], key=lambda x: x["count"], reverse=True)[:6]

    # Monthly trend (last 6 months)
    from datetime import datetime, timedelta
    monthly_trend = []
    for i in range(5, -1, -1):
        month_start = datetime.utcnow().replace(day=1) - timedelta(days=30 * i)
        month_end = month_start.replace(day=28) + timedelta(days=4)
        month_end = month_end.replace(day=1)
        count = 0
        if user_asset_ids:
            count = db.query(BreachRecord).filter(
                BreachRecord.asset_id.in_(user_asset_ids),
                BreachRecord.detected_at >= month_start,
                BreachRecord.detected_at < month_end
            ).count()
        monthly_trend.append({
            "month": month_start.strftime("%b %Y"),
            "breaches": count
        })

    return {
        "total_assets": total_assets,
        "total_breaches": total_breaches,
        "active_alerts": active_alerts,
        "critical_alerts": critical_alerts,
        "breached_assets": breached_assets,
        "breach_by_severity": breach_by_severity,
        "recent_breaches": recent_breaches,
        "most_leaked_data_types": most_leaked,
        "monthly_trend": monthly_trend,
    }
