"""
Breach scanning + continuous monitoring (PS Req #1).

`scan_asset_record` is the single source of truth for scanning one asset against
every source (HIBP / demo + dark-web threat-intel feed) and recording breaches,
alerts and recommendations. It is reused by the manual API endpoints and by the
background monitoring loop, so behaviour can't drift between them. The caller owns
the transaction (commit/rollback).
"""
import asyncio
import json
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.user import User
from app.models.asset import MonitoredAsset, AssetType, AssetStatus
from app.models.breach import BreachRecord
from app.models.alert import Alert, Recommendation, NotificationPreference
from app.services.breach_service import (
    check_email_breach, check_domain_breach, normalize_breach_data, get_recommendations,
)
from app.services.darkweb_service import query_darkweb
from app.services.email_service import send_breach_alert_email


async def scan_asset_record(db: Session, asset: MonitoredAsset, user: User) -> int:
    """Scan one asset across all sources; persist new breaches/alerts. Returns new-breach count."""
    raw_breaches = []
    if asset.asset_type == AssetType.email:
        raw_breaches = await check_email_breach(asset.asset_value)
    elif asset.asset_type == AssetType.domain:
        raw_breaches = await check_domain_breach(asset.asset_value)
    # Dark-web / threat-intel feed applies to every asset type.
    raw_breaches = raw_breaches + await query_darkweb(asset.asset_value, asset.asset_type)

    asset.last_checked = datetime.utcnow()
    new_breaches_count = 0

    for raw in raw_breaches:
        normalized = normalize_breach_data(raw)
        existing = db.query(BreachRecord).filter(
            BreachRecord.asset_id == asset.id,
            BreachRecord.breach_name == normalized["breach_name"],
        ).first()
        if existing:
            continue

        breach = BreachRecord(asset_id=asset.id, **normalized)
        db.add(breach)
        db.flush()
        new_breaches_count += 1
        asset.status = AssetStatus.breached

        data_classes = json.loads(normalized.get("data_classes", "[]"))
        db.add(Alert(
            user_id=user.id,
            breach_id=breach.id,
            title=f"Breach Detected: {normalized['breach_name']}",
            message=f"Your asset '{asset.asset_value}' was found in the '{normalized['breach_name']}' breach. "
                    f"Severity: {normalized['severity'].upper()}. Exposed data: {', '.join(data_classes[:3])}.",
        ))

        recs = get_recommendations(normalized["severity"], data_classes)
        for rec in recs:
            db.add(Recommendation(breach_id=breach.id, **rec))

        prefs = db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user.id
        ).first()
        if prefs and prefs.email_alerts:
            send_breach_alert_email(
                to_email=user.email, user_name=user.full_name, asset_value=asset.asset_value,
                breach_name=normalized["breach_name"], severity=normalized["severity"],
                data_classes=data_classes, recommendations=recs,
            )

    if not raw_breaches:
        asset.status = AssetStatus.safe

    return new_breaches_count


async def _scan_all_active_assets() -> int:
    """One monitoring pass over every active asset of every active user."""
    db = SessionLocal()
    total_new = 0
    try:
        assets = db.query(MonitoredAsset).filter(MonitoredAsset.is_active == True).all()
        users = {u.id: u for u in db.query(User).filter(User.is_active == True).all()}
        for asset in assets:
            user = users.get(asset.user_id)
            if user:
                total_new += await scan_asset_record(db, asset, user)
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()
    return total_new


async def monitoring_loop():
    """Background loop that re-scans all assets every SCAN_INTERVAL_MINUTES."""
    interval = max(1, settings.SCAN_INTERVAL_MINUTES) * 60
    while True:
        await asyncio.sleep(interval)
        await _scan_all_active_assets()
