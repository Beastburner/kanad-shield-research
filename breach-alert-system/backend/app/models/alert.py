from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class AlertStatus(str, enum.Enum):
    unread = "unread"
    read = "read"
    dismissed = "dismissed"

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    breach_id = Column(Integer, ForeignKey("breach_records.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(Enum(AlertStatus), default=AlertStatus.unread)
    email_sent = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="alerts")
    breach = relationship("BreachRecord", back_populates="alerts")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    breach_id = Column(Integer, ForeignKey("breach_records.id"), nullable=False)
    action = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Integer, default=1)

    breach = relationship("BreachRecord", back_populates="recommendations")


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    email_alerts = Column(Boolean, default=True)
    in_app_alerts = Column(Boolean, default=True)
    alert_low = Column(Boolean, default=True)
    alert_medium = Column(Boolean, default=True)
    alert_high = Column(Boolean, default=True)
    alert_critical = Column(Boolean, default=True)

    user = relationship("User", back_populates="notification_preferences")
