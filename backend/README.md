# Zomi Wealth Portal - Backend

Backend API for the Zomi Wealth Management Portal (MVVM Architecture).

## 🏗️ Architecture

This backend follows the **MVVM (Model-View-ViewModel)** pattern:

- **Models** (`app/models/`): Data structures and database schemas
- **Views** (`app/views/`): API endpoints and request/response handling
- **ViewModels** (`app/viewmodels/`): Business logic and data transformation
- **Services** (`app/services/`): External service integrations (Supabase, email, etc.)
- **Utils** (`app/utils/`): Helper functions and utilities

## 📁 Project Structure

```
backend/
├── app/
│   ├── models/          # Database models
│   ├── views/           # API routes/endpoints
│   ├── viewmodels/      # Business logic layer
│   ├── services/        # External services
│   ├── utils/           # Utility functions
│   ├── config.py        # Configuration
│   └── __init__.py      # App initialization
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## 🛠️ Tech Stack

- **FastAPI** - Modern Python web framework
- **Supabase** - Database and auth client
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server
- **PostgreSQL** - Database (via Supabase)

## 📋 Prerequisites

- Python 3.11+
- pip or poetry
- Supabase account

## 🚀 Development Setup

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Variables

Create a `.env` file in the backend directory:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=True

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
FRONTEND_URL=http://localhost:5173
```

### 4. Run Development Server

```bash
# Coming soon - no logic implemented yet
# uvicorn app.main:app --reload
```

## 📚 API Documentation

Once running, API docs will be available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🧪 Testing

```bash
pytest
```

## 📦 Dependencies

See `requirements.txt` for full list.

### Key Packages:
- `fastapi` - Web framework
- `supabase` - Supabase client
- `pydantic` - Data validation
- `python-jose` - JWT handling
- `passlib` - Password hashing
- `pandas` - Data export (CSV/Excel)

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Environment-based secrets

## 🚀 Deployment

Backend will be deployed to Render alongside the frontend.

---

**Status**: Structure only - no logic implemented yet
