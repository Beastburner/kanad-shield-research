# BreachAlert — Real-Time Data Breach Alert System
### Legal & Government Ecosystem Edition

A full-stack web application for monitoring emails, domains, and phone numbers against known data breaches in real time.

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend  | FastAPI (Python), SQLAlchemy, JWT Auth |
| Database | PostgreSQL                          |
| Breach Data | Have I Been Pwned API (+ built-in demo dataset) |

---

## Prerequisites

Make sure these are installed on your machine:

- **Python 3.10+** → https://python.org
- **Node.js 18+** → https://nodejs.org
- **PostgreSQL 14+** → https://postgresql.org

---

## Setup Instructions

### 1. Extract the project

Unzip the downloaded file. You'll get a `breach-alert/` folder with two subfolders: `backend/` and `frontend/`.

---

### 2. Set up PostgreSQL

Open your terminal and run:

```bash
psql -U postgres
```

Then inside psql:

```sql
CREATE DATABASE breach_alert;
\q
```

> If your postgres username/password is different, update it in `backend/.env` below.

---

### 3. Set up the Backend

```bash
cd breach-alert/backend

# Create and activate virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate

# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Edit `backend/.env` and confirm your database credentials:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/breach_alert
SECRET_KEY=change-this-to-a-random-secret-key-at-least-32-chars
```

Run the seed script to create tables and demo data:

```bash
python seed.py
```

You should see:
```
✅ Database seeded successfully!

Demo accounts:
  Admin:      admin@breachalert.com / admin123
  Legal:      legal@lawfirm.com / legal123
  Government: gov@ministry.gov / gov123
  Test User:  test@example.com / test123
```

Start the backend server:

```bash
uvicorn app.main:app --reload --port 8000
```

The API is now running at: http://localhost:8000
API docs available at: http://localhost:8000/docs

---

### 4. Set up the Frontend

Open a **new terminal tab/window**:

```bash
cd breach-alert/frontend

npm install

npm run dev
```

The app is now running at: **http://localhost:3000**

---

## Using the App

1. Open http://localhost:3000 in your browser
2. Log in with any demo account (shown on the login page)
3. Go to **Monitored Assets** → add an email or domain
4. Click **Scan** on an asset (or **Scan All Assets** on the dashboard)
5. Check **Alerts** for breach notifications with recommendations
6. Check **Analytics** for visual breach intelligence

### Demo Emails That Show Breaches

These emails will return breach results without an API key:
- `test@example.com` — Adobe, LinkedIn breaches
- `demo@test.com` — Dropbox, MySpace breaches
- `admin@demo.org` — Twitter, Adobe breaches
- `user@breach.com` — LinkedIn, Twitter, Dropbox breaches

Any other email has a 25% random chance of showing a demo breach.

---

## Optional: Real HIBP API Key

To use real breach data from Have I Been Pwned:

1. Get a key at https://haveibeenpwned.com/API/Key
2. Add it to `backend/.env`:
   ```
   HIBP_API_KEY=your-key-here
   ```
3. Restart the backend server

---

## Optional: Email Alerts via SMTP

To receive real email notifications, add to `backend/.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your@gmail.com
```

Without SMTP config, email alerts are simulated (printed to console).

---

## Project Structure

```
breach-alert/
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers
│   │   ├── core/         # DB, config, security
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Breach detection, email
│   │   └── main.py
│   ├── seed.py           # Demo data seeder
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── pages/        # Dashboard, Assets, Alerts, Analytics, Notifications
    │   ├── components/   # Layout, Sidebar
    │   ├── hooks/        # useAuth
    │   ├── services/     # API client
    │   └── styles/
    ├── package.json
    └── vite.config.js
```

---

## Stopping the App

- Backend: Press `Ctrl+C` in the backend terminal
- Frontend: Press `Ctrl+C` in the frontend terminal
