from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class SeverityLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class BreachRecord(Base):
    __tablename__ = "breach_records"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("monitored_assets.id"), nullable=False)
    breach_name = Column(String, nullable=False)
    breach_date = Column(DateTime(timezone=True), nullable=True)
    description = Column(Text, nullable=True)
    data_classes = Column(String, nullable=True)  # JSON string of data types
    severity = Column(Enum(SeverityLevel), default=SeverityLevel.medium)
    severity_score = Column(Float, default=5.0)
    source = Column(String, nullable=True)
    domain = Column(String, nullable=True)
    pwn_count = Column(Integer, nullable=True)
    detected_at = Column(DateTime(timezone=True), server_default=func.now())

    asset = relationship("MonitoredAsset", back_populates="breach_records")
    alerts = relationship("Alert", back_populates="breach")
    recommendations = relationship("Recommendation", back_populates="breach")
