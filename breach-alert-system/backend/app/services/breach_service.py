import httpx
import json
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from app.core.config import settings

# Demo breach dataset for local testing without HIBP API key
DEMO_BREACHES = [
    {
        "Name": "Adobe",
        "Title": "Adobe",
        "Domain": "adobe.com",
        "BreachDate": "2013-10-04",
        "AddedDate": "2013-12-04T00:00:00Z",
        "Description": "In October 2013, 153 million Adobe accounts were breached.",
        "DataClasses": ["Email addresses", "Password hints", "Passwords", "Usernames"],
        "PwnCount": 152445165,
        "IsVerified": True,
    },
    {
        "Name": "LinkedIn",
        "Title": "LinkedIn",
        "Domain": "linkedin.com",
        "BreachDate": "2012-05-05",
        "AddedDate": "2016-05-22T00:00:00Z",
        "Description": "In May 2016, LinkedIn had 164 million email addresses and passwords exposed.",
        "DataClasses": ["Email addresses", "Passwords"],
        "PwnCount": 164611595,
        "IsVerified": True,
    },
    {
        "Name": "Dropbox",
        "Title": "Dropbox",
        "Domain": "dropbox.com",
        "BreachDate": "2012-07-01",
        "AddedDate": "2016-08-31T00:00:00Z",
        "Description": "In mid-2012, Dropbox suffered a data breach exposing 68 million records.",
        "DataClasses": ["Email addresses", "Passwords"],
        "PwnCount": 68648009,
        "IsVerified": True,
    },
    {
        "Name": "MySpace",
        "Title": "MySpace",
        "Domain": "myspace.com",
        "BreachDate": "2008-07-01",
        "AddedDate": "2016-05-31T00:00:00Z",
        "Description": "In approximately 2008, MySpace suffered a data breach exposing 360 million records.",
        "DataClasses": ["Email addresses", "Passwords", "Usernames"],
        "PwnCount": 359420698,
        "IsVerified": False,
    },
    {
        "Name": "Twitter",
        "Title": "Twitter",
        "Domain": "twitter.com",
        "BreachDate": "2022-07-01",
        "AddedDate": "2023-01-12T00:00:00Z",
        "Description": "In 2022, Twitter suffered a data breach exposing 235 million email addresses.",
        "DataClasses": ["Email addresses", "Names", "Usernames"],
        "PwnCount": 235000000,
        "IsVerified": True,
    },
]

# Demo dataset - emails that will simulate being "breached"
DEMO_BREACHED_EMAILS = {
    "test@example.com": ["Adobe", "LinkedIn"],
    "demo@test.com": ["Dropbox", "MySpace"],
    "admin@demo.org": ["Twitter", "Adobe"],
    "user@breach.com": ["LinkedIn", "Twitter", "Dropbox"],
}

DEMO_BREACHED_DOMAINS = {
    "example.com": ["Adobe"],
    "test.com": ["LinkedIn", "Twitter"],
    "demo.org": ["MySpace"],
}


def calculate_severity(data_classes: List[str], pwn_count: int) -> tuple:
    """Calculate severity level and score based on data classes and breach size."""
    high_risk_classes = {"Passwords", "Credit card details", "Bank details", "Social security numbers", "Health records"}
    medium_risk_classes = {"Phone numbers", "Physical addresses", "Dates of birth", "Government issued IDs"}
    
    score = 0.0
    
    # Score by data classes
    for dc in data_classes:
        if dc in high_risk_classes:
            score += 3.0
        elif dc in medium_risk_classes:
            score += 2.0
        else:
            score += 1.0
    
    # Score by pwn count
    if pwn_count > 100_000_000:
        score += 3.0
    elif pwn_count > 10_000_000:
        score += 2.0
    elif pwn_count > 1_000_000:
        score += 1.0
    
    score = min(score, 10.0)
    
    if score >= 8.0:
        severity = "critical"
    elif score >= 6.0:
        severity = "high"
    elif score >= 3.0:
        severity = "medium"
    else:
        severity = "low"
    
    return severity, score


def get_recommendations(severity: str, data_classes: List[str]) -> List[Dict]:
    """Generate recommendations based on severity and data classes."""
    recs = []
    
    if "Passwords" in data_classes:
        recs.append({"action": "Change Password Immediately", "description": "Your password was exposed. Change it on this service and any other service where you use the same password.", "priority": 1})
    
    recs.append({"action": "Enable Two-Factor Authentication", "description": "Enable 2FA on all accounts to add an extra layer of security.", "priority": 2})
    
    if severity in ["high", "critical"]:
        recs.append({"action": "Monitor Account Activity", "description": "Regularly check your account for suspicious activity or unauthorized access.", "priority": 3})
        recs.append({"action": "Contact Service Provider", "description": "Notify the affected service provider and follow their data breach response process.", "priority": 4})
    
    if "Credit card details" in data_classes or "Bank details" in data_classes:
        recs.append({"action": "Monitor Financial Accounts", "description": "Check your bank and credit card statements for unauthorized transactions immediately.", "priority": 1})
        recs.append({"action": "Consider Credit Freeze", "description": "Place a credit freeze with credit bureaus to prevent new accounts being opened in your name.", "priority": 2})
    
    if "Email addresses" in data_classes:
        recs.append({"action": "Watch for Phishing Emails", "description": "Be extra vigilant about suspicious emails. Do not click unknown links.", "priority": 5})
    
    return recs


async def check_email_breach(email: str) -> List[Dict]:
    """Check if email is in a breach. Falls back to demo dataset if no API key."""
    if settings.HIBP_API_KEY:
        return await _check_hibp_email(email)
    else:
        return _check_demo_email(email)


async def check_domain_breach(domain: str) -> List[Dict]:
    """Check if domain is in a breach."""
    if settings.HIBP_API_KEY:
        return await _check_hibp_domain(domain)
    else:
        return _check_demo_domain(domain)


async def _check_hibp_email(email: str) -> List[Dict]:
    """Query HIBP API for email breaches."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.HIBP_API_URL}/breachedaccount/{email}",
                headers={
                    "hibp-api-key": settings.HIBP_API_KEY,
                    "user-agent": "BreachAlertSystem/1.0",
                },
                params={"truncateResponse": "false"},
                timeout=10.0
            )
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                return []
            else:
                return []
        except Exception:
            return _check_demo_email(email)


async def _check_hibp_domain(domain: str) -> List[Dict]:
    """Query HIBP API for domain breaches."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.HIBP_API_URL}/breaches",
                headers={
                    "hibp-api-key": settings.HIBP_API_KEY,
                    "user-agent": "BreachAlertSystem/1.0",
                },
                params={"domain": domain},
                timeout=10.0
            )
            if response.status_code == 200:
                return response.json()
            return []
        except Exception:
            return _check_demo_domain(domain)


def _check_demo_email(email: str) -> List[Dict]:
    """Check demo dataset for email breaches."""
    email_lower = email.lower()
    breach_names = DEMO_BREACHED_EMAILS.get(email_lower, [])
    
    # For non-demo emails, simulate a random breach detection (25% chance)
    if not breach_names:
        import hashlib
        hash_val = int(hashlib.md5(email_lower.encode()).hexdigest(), 16)
        if hash_val % 4 == 0:  # 25% chance
            breach_names = [DEMO_BREACHES[hash_val % len(DEMO_BREACHES)]["Name"]]
    
    return [b for b in DEMO_BREACHES if b["Name"] in breach_names]


def _check_demo_domain(domain: str) -> List[Dict]:
    """Check demo dataset for domain breaches."""
    domain_lower = domain.lower()
    breach_names = DEMO_BREACHED_DOMAINS.get(domain_lower, [])
    return [b for b in DEMO_BREACHES if b["Name"] in breach_names]


def normalize_breach_data(raw_breach: Dict) -> Dict:
    """Normalize breach data from any source into our format."""
    data_classes = raw_breach.get("DataClasses", [])
    pwn_count = raw_breach.get("PwnCount", 0)
    severity, score = calculate_severity(data_classes, pwn_count)
    
    breach_date = None
    date_str = raw_breach.get("BreachDate")
    if date_str:
        try:
            breach_date = datetime.strptime(date_str, "%Y-%m-%d")
        except Exception:
            pass

    return {
        "breach_name": raw_breach.get("Name", "Unknown"),
        "breach_date": breach_date,
        "description": raw_breach.get("Description", ""),
        "data_classes": json.dumps(data_classes),
        "severity": severity,
        "severity_score": score,
        "source": "Have I Been Pwned" if settings.HIBP_API_KEY else "Demo Dataset",
        "domain": raw_breach.get("Domain"),
        "pwn_count": pwn_count,
    }
