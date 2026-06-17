"""
Seed script - run once to populate demo data.
Usage: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models import *
from app.core.security import hash_password
from datetime import datetime, timedelta
import json

Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # Clear existing data
    db.query(Recommendation).delete()
    db.query(Alert).delete()
    db.query(BreachRecord).delete()
    db.query(MonitoredAsset).delete()
    db.query(NotificationPreference).delete()
    db.query(User).delete()
    db.commit()

    # Create demo users
    users = [
        User(email="admin@breachalert.com", full_name="Admin User", organization="BreachAlert HQ",
             role=UserRole.admin, hashed_password=hash_password("admin123")),
        User(email="legal@lawfirm.com", full_name="Sarah Johnson", organization="Johnson & Associates Law",
             role=UserRole.legal, hashed_password=hash_password("legal123")),
        User(email="gov@ministry.gov", full_name="Rajesh Kumar", organization="Ministry of Electronics",
             role=UserRole.government, hashed_password=hash_password("gov123")),
        User(email="test@example.com", full_name="Test User", organization="Test Corp",
             role=UserRole.user, hashed_password=hash_password("test123")),
    ]
    for u in users:
        db.add(u)
    db.flush()

    for u in users:
        db.add(NotificationPreference(user_id=u.id))

    # Add assets
    assets_data = [
        (users[0].id, AssetType.email, "admin@breachalert.com"),
        (users[0].id, AssetType.domain, "breachalert.com"),
        (users[1].id, AssetType.email, "legal@lawfirm.com"),
        (users[1].id, AssetType.email, "test@example.com"),
        (users[1].id, AssetType.domain, "lawfirm.com"),
        (users[2].id, AssetType.email, "gov@ministry.gov"),
        (users[2].id, AssetType.domain, "ministry.gov"),
        (users[3].id, AssetType.email, "test@example.com"),
        (users[3].id, AssetType.phone, "+91-9876543210"),
    ]
    assets = []
    for uid, atype, val in assets_data:
        a = MonitoredAsset(user_id=uid, asset_type=atype, asset_value=val,
                          status=AssetStatus.monitoring, last_checked=datetime.utcnow())
        db.add(a)
        assets.append(a)
    db.flush()

    # Add breach records
    sample_breaches = [
        {
            "asset_idx": 0,
            "breach_name": "Adobe",
            "breach_date": datetime(2013, 10, 4),
            "description": "In October 2013, 153 million Adobe accounts were breached exposing encrypted passwords and password hints.",
            "data_classes": json.dumps(["Email addresses", "Password hints", "Passwords", "Usernames"]),
            "severity": SeverityLevel.high,
            "severity_score": 7.5,
            "source": "Have I Been Pwned",
            "domain": "adobe.com",
            "pwn_count": 152445165,
            "detected_at": datetime.utcnow() - timedelta(days=5),
        },
        {
            "asset_idx": 3,
            "breach_name": "LinkedIn",
            "breach_date": datetime(2012, 5, 5),
            "description": "In May 2016, LinkedIn had 164 million email addresses and passwords exposed in a data breach.",
            "data_classes": json.dumps(["Email addresses", "Passwords"]),
            "severity": SeverityLevel.high,
            "severity_score": 7.0,
            "source": "Have I Been Pwned",
            "domain": "linkedin.com",
            "pwn_count": 164611595,
            "detected_at": datetime.utcnow() - timedelta(days=3),
        },
        {
            "asset_idx": 3,
            "breach_name": "Dropbox",
            "breach_date": datetime(2012, 7, 1),
            "description": "In mid-2012, Dropbox suffered a data breach exposing 68 million records including email addresses and hashed passwords.",
            "data_classes": json.dumps(["Email addresses", "Passwords"]),
            "severity": SeverityLevel.medium,
            "severity_score": 5.5,
            "source": "Have I Been Pwned",
            "domain": "dropbox.com",
            "pwn_count": 68648009,
            "detected_at": datetime.utcnow() - timedelta(days=1),
        },
        {
            "asset_idx": 7,
            "breach_name": "MySpace",
            "breach_date": datetime(2008, 7, 1),
            "description": "In approximately 2008, MySpace suffered a data breach exposing 360 million records.",
            "data_classes": json.dumps(["Email addresses", "Passwords", "Usernames"]),
            "severity": SeverityLevel.critical,
            "severity_score": 9.0,
            "source": "Have I Been Pwned",
            "domain": "myspace.com",
            "pwn_count": 359420698,
            "detected_at": datetime.utcnow() - timedelta(hours=6),
        },
        {
            "asset_idx": 7,
            "breach_name": "Twitter 2022",
            "breach_date": datetime(2022, 7, 1),
            "description": "In 2022, a Twitter vulnerability was exploited to scrape 235 million user email addresses.",
            "data_classes": json.dumps(["Email addresses", "Names", "Usernames"]),
            "severity": SeverityLevel.high,
            "severity_score": 6.5,
            "source": "Have I Been Pwned",
            "domain": "twitter.com",
            "pwn_count": 235000000,
            "detected_at": datetime.utcnow() - timedelta(hours=2),
        },
    ]

    breaches = []
    for bd in sample_breaches:
        asset_idx = bd.pop("asset_idx")
        det = bd.pop("detected_at")
        b = BreachRecord(asset_id=assets[asset_idx].id, **bd)
        b.detected_at = det
        db.add(b)
        assets[asset_idx].status = AssetStatus.breached
        breaches.append(b)
    db.flush()

    # Alerts
    alert_data = [
        (users[0].id, breaches[0], "🚨 Breach Detected: Adobe", "Your monitored email was found in the Adobe breach. Severity: HIGH."),
        (users[1].id, breaches[1], "🚨 Breach Detected: LinkedIn", "Your monitored email was found in the LinkedIn breach. Severity: HIGH."),
        (users[1].id, breaches[2], "⚠️ Breach Detected: Dropbox", "Your monitored email was found in the Dropbox breach. Severity: MEDIUM."),
        (users[3].id, breaches[3], "🔴 CRITICAL: MySpace Breach", "Your asset was found in the MySpace breach. Severity: CRITICAL."),
        (users[3].id, breaches[4], "🚨 Breach Detected: Twitter 2022", "Your asset was found in the Twitter 2022 breach. Severity: HIGH."),
    ]
    for uid, breach, title, msg in alert_data:
        db.add(Alert(user_id=uid, breach_id=breach.id, title=title, message=msg))

    # Recommendations
    recs = [
        (breaches[0].id, "Change Your Password", "Update your password on Adobe and any other service using the same password.", 1),
        (breaches[0].id, "Enable Two-Factor Authentication", "Add 2FA to your Adobe account immediately.", 2),
        (breaches[1].id, "Change LinkedIn Password", "Update your LinkedIn password and enable 2FA.", 1),
        (breaches[1].id, "Monitor Account Activity", "Review your LinkedIn account for any suspicious activity.", 2),
        (breaches[3].id, "Critical: Change All Passwords", "This is a critical breach. Change passwords on all accounts immediately.", 1),
        (breaches[3].id, "Enable 2FA Everywhere", "Enable two-factor authentication on all important accounts.", 2),
        (breaches[3].id, "Contact Service Provider", "Notify affected service providers about the breach.", 3),
        (breaches[4].id, "Watch for Phishing Emails", "Be vigilant about suspicious emails attempting to impersonate Twitter.", 1),
    ]
    for bid, action, desc, priority in recs:
        db.add(Recommendation(breach_id=bid, action=action, description=desc, priority=priority))

    db.commit()
    print("✅ Database seeded successfully!")
    print("\nDemo accounts:")
    print("  Admin:      admin@breachalert.com / admin123")
    print("  Legal:      legal@lawfirm.com / legal123")
    print("  Government: gov@ministry.gov / gov123")
    print("  Test User:  test@example.com / test123")

except Exception as e:
    db.rollback()
    print(f"❌ Seed failed: {e}")
    raise
finally:
    db.close()
