# DCMT Platform

A full-stack platform for document management and technical services with customer/provider workflows.

## Architecture

- **Frontend**: Next.js (React) - Server-side rendering and static site generation
- **Backend**: Django REST Framework - RESTful API with JWT authentication
- **Database**: PostgreSQL - ACID-compliant relational database
- **Background Tasks**: Celery with Redis
- **Storage**: Cloud object storage (AWS S3/GCS)

## Project Structure

```
├── backend/
│   ├── apps/
│   │   ├── accounts/          # User management & authentication
│   │   ├── requests/          # Project requests & documents
│   │   ├── payments/          # Transactions & invoices
│   │   ├── notifications/     # In-app & email notifications
│   │   ├── messaging/         # Real-time messaging
│   │   ├── analytics/         # KPIs & reports
│   │   └── core_utils/        # Shared models & utilities
│   └── config/                # Django settings
└── frontend/
    ├── components/
    │   ├── common/            # Shared components
    │   └── ui/                # UI library
    ├── modules/
    │   ├── auth/              # Auth pages
    │   ├── customer/          # Customer dashboard & workflow
    │   ├── provider/          # Provider dashboard & workspace
    │   └── admin/             # Admin panel
    ├── hooks/                 # Custom React hooks
    └── lib/                   # API client & store
```

## Setup

### Backend (Django)
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

### Docker
```bash
docker-compose up -d
```

## API Endpoints (v1)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register/` | Register new user |
| POST | `/auth/login/` | JWT authentication |
| GET | `/requests/` | List customer requests |
| POST | `/requests/` | Create project request |
| GET | `/providers/requests/` | Provider's assigned requests |
| POST | `/payments/initiate/` | Start payment process |
| POST | `/payments/webhook/` | Payment gateway webhook |