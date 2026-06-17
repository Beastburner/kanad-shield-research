from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class AssetType(str, enum.Enum):
    email = "email"
    phone = "phone"
    domain = "domain"

class AssetStatus(str, enum.Enum):
    safe = "safe"
    breached = "breached"
    monitoring = "monitoring"

class MonitoredAsset(Base):
    __tablename__ = "monitored_assets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    asset_type = Column(Enum(AssetType), nullable=False)
    asset_value = Column(String, nullable=False)
    status = Column(Enum(AssetStatus), default=AssetStatus.monitoring)
    is_active = Column(Boolean, default=True)
    last_checked = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="assets")
    breach_records = relationship("BreachRecord", back_populates="asset")
