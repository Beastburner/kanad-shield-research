from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.user import UserRole
from app.models.asset import AssetType, AssetStatus
from app.models.breach import SeverityLevel
from app.models.alert import AlertStatus

# Auth schemas
class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    organization: Optional[str] = None
    role: Optional[UserRole] = UserRole.user

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    organization: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Asset schemas
class AssetCreate(BaseModel):
    asset_type: AssetType
    asset_value: str

class AssetOut(BaseModel):
    id: int
    asset_type: AssetType
    asset_value: str
    status: AssetStatus
    last_checked: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

# Breach schemas
class BreachOut(BaseModel):
    id: int
    breach_name: str
    breach_date: Optional[datetime]
    description: Optional[str]
    data_classes: Optional[str]
    severity: SeverityLevel
    severity_score: float
    source: Optional[str]
    domain: Optional[str]
    pwn_count: Optional[int]
    detected_at: datetime

    class Config:
        from_attributes = True

# Alert schemas
class AlertOut(BaseModel):
    id: int
    title: str
    message: str
    status: AlertStatus
    created_at: datetime
    breach: Optional[BreachOut]

    class Config:
        from_attributes = True

class AlertUpdate(BaseModel):
    status: AlertStatus

# Recommendation schema
class RecommendationOut(BaseModel):
    id: int
    action: str
    description: Optional[str]
    priority: int

    class Config:
        from_attributes = True

# Notification preference schemas
class NotificationPrefUpdate(BaseModel):
    email_alerts: Optional[bool] = None
    in_app_alerts: Optional[bool] = None
    alert_low: Optional[bool] = None
    alert_medium: Optional[bool] = None
    alert_high: Optional[bool] = None
    alert_critical: Optional[bool] = None

class NotificationPrefOut(BaseModel):
    email_alerts: bool
    in_app_alerts: bool
    alert_low: bool
    alert_medium: bool
    alert_high: bool
    alert_critical: bool

    class Config:
        from_attributes = True

# Analytics schema
class AnalyticsSummary(BaseModel):
    total_assets: int
    total_breaches: int
    active_alerts: int
    critical_alerts: int
    breach_by_severity: dict
    recent_breaches: List[BreachOut]
    most_leaked_data_types: List[dict]
