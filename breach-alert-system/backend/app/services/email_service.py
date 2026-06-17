import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings


def send_breach_alert_email(
    to_email: str,
    user_name: str,
    asset_value: str,
    breach_name: str,
    severity: str,
    data_classes: list,
    recommendations: list
):
    """Send breach alert email notification."""
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        print(f"[EMAIL SIMULATION] Would send breach alert to {to_email} for {breach_name}")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🚨 Data Breach Alert: {breach_name} - Severity: {severity.upper()}"
        msg["From"] = settings.FROM_EMAIL
        msg["To"] = to_email

        severity_colors = {
            "low": "#10B981",
            "medium": "#F59E0B",
            "high": "#EF4444",
            "critical": "#7C3AED",
        }
        color = severity_colors.get(severity, "#7C3AED")

        recs_html = "".join([f"<li>{r['action']}: {r.get('description','')}</li>" for r in recommendations[:3]])
        data_html = ", ".join(data_classes) if data_classes else "Unknown"

        html_body = f"""
        <html><body style="font-family:Arial,sans-serif;background:#050816;color:#fff;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:#0F172A;border-radius:16px;padding:30px;border:1px solid rgba(255,255,255,0.08);">
            <h1 style="color:{color};margin-bottom:8px;">🚨 Data Breach Detected</h1>
            <p style="color:#94A3B8;">Hello {user_name},</p>
            <p style="color:#94A3B8;">Your monitored asset <strong style="color:#fff;">{asset_value}</strong> was found in a known data breach.</p>
            <div style="background:#1E293B;border-radius:12px;padding:20px;margin:20px 0;border-left:4px solid {color};">
                <h3 style="color:#fff;margin:0 0 10px;">Breach Details</h3>
                <p style="color:#94A3B8;margin:5px 0;"><strong style="color:#fff;">Breach:</strong> {breach_name}</p>
                <p style="color:#94A3B8;margin:5px 0;"><strong style="color:#fff;">Severity:</strong> <span style="color:{color};">{severity.upper()}</span></p>
                <p style="color:#94A3B8;margin:5px 0;"><strong style="color:#fff;">Data Exposed:</strong> {data_html}</p>
            </div>
            <div style="background:#1E293B;border-radius:12px;padding:20px;margin:20px 0;">
                <h3 style="color:#fff;margin:0 0 10px;">Recommended Actions</h3>
                <ul style="color:#94A3B8;">{recs_html}</ul>
            </div>
            <p style="color:#64748B;font-size:12px;margin-top:20px;">This is an automated alert from your Data Breach Alert System.</p>
        </div>
        </body></html>
        """

        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.FROM_EMAIL, to_email, msg.as_string())
        
        return True
    except Exception as e:
        print(f"Email send failed: {e}")
        return False
