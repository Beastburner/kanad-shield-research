import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, assets, breaches, alerts, analytics, notifications
from app.core.database import engine, Base
from app.core.config import settings
from app.services.monitoring import monitoring_loop

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Real-Time Data Breach Alert System", version="1.0.0")

@app.on_event("startup")
async def _start_background_monitoring():
    if settings.BACKGROUND_SCAN_ENABLED:
        asyncio.create_task(monitoring_loop())

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(assets.router, prefix="/api/assets", tags=["Assets"])
app.include_router(breaches.router, prefix="/api/breaches", tags=["Breaches"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])

@app.get("/")
def root():
    return {"message": "Real-Time Data Breach Alert System API"}

@app.get("/health")
def health():
    return {"status": "healthy"}
