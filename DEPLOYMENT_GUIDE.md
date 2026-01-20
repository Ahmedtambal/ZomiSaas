# 🚀 Deployment Setup Guide

Complete guide for deploying Zomi Wealth Portal with separate frontend and backend services.

---

## 📋 Prerequisites

- ✅ GitHub repository: https://github.com/Ahmedtambal/ZomiSaas
- ✅ Render account (free tier): https://render.com
- ✅ Supabase account (free tier): https://supabase.com

---

## 🗄️ Part 1: Supabase Setup (Database & Auth)

### Step 1: Create Supabase Project

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Click **"New Project"**

2. **Configure Project**
   - **Organization**: Select or create organization
   - **Project Name**: `zomi-wealth-portal` (or your choice)
   - **Database Password**: Generate a strong password (save it securely!)
   - **Region**: Select **"Europe West (London)"** or closest to your users
   - **Pricing Plan**: Free tier is sufficient to start
   - Click **"Create new project"**

3. **Wait for Project Setup** (takes ~2 minutes)
   - You'll see a progress indicator
   - Once complete, you'll land on the project dashboard

### Step 2: Get Your API Credentials

1. **Navigate to Project Settings**
   - In your Supabase project, click the **⚙️ Settings** icon (bottom left)
   - Click **"API"** in the sidebar

2. **Copy API Credentials** (save these for later):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Starts with `eyJh...`
   - **service_role key**: Starts with `eyJh...` (keep secret!)

---

## 🚀 Part 2: Deploy Frontend (React App)

### Step 1: Create Frontend Web Service

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Click **"New +"** → **"Web Service"**

2. **Connect Repository**
   - Authorize GitHub if first time
   - Select: `Ahmedtambal/ZomiSaas`
   - Click **"Connect"**

### Step 2: Configure Frontend Service

**Basic Settings:**
- **Name**: `zomi-frontend`
- **Region**: **Europe (Frankfurt)**
- **Branch**: `main`
- **Root Directory**: Leave empty
- **Runtime**: **Node**

**Build & Deploy:**
- **Build Command**:
  ```bash
  cd frontend && npm install && npm run build
  ```
- **Start Command**:
  ```bash
  cd frontend && npm run preview
  ```

### Step 3: Add Frontend Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

| Key | Value |
|-----|-------|
| `NODE_VERSION` | `18.18.0` |
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

### Step 4: Deploy Frontend

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for build
3. Note your frontend URL: `https://zomi-frontend.onrender.com`

---

## 🐍 Part 3: Deploy Backend (Python API)

### Step 1: Create Backend Web Service

1. **In Render Dashboard**
   - Click **"New +"** → **"Web Service"**
   - Select same repository: `Ahmedtambal/ZomiSaas`

### Step 2: Configure Backend Service

**Basic Settings:**
- **Name**: `zomi-backend`
- **Region**: **Europe (Frankfurt)**
- **Branch**: `main`
- **Root Directory**: Leave empty
- **Runtime**: **Python 3.11**

**Build & Deploy:**
- **Build Command**:
  ```bash
  cd backend && pip install -r requirements.txt
  ```
- **Start Command**:
  ```bash
  cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```

### Step 3: Add Backend Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

| Key | Value |
|-----|-------|
| `PYTHON_VERSION` | `3.11.0` |
| `SUPABASE_URL` | Your Supabase Project URL |
| `SUPABASE_KEY` | Your Supabase **service_role** key |
| `SUPABASE_JWT_SECRET` | From Supabase Settings → API → JWT Secret |
| `SECRET_KEY` | Generate random string (32+ chars) |
| `FRONTEND_URL` | Your frontend Render URL |

**Generate SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 4: Deploy Backend

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for build
3. Note your backend URL: `https://zomi-backend.onrender.com`

---

## 🔗 Part 4: Connect Everything

### Update Supabase Auth URLs

1. **Go to Supabase Dashboard**
   - Navigate to **Authentication** → **URL Configuration**

2. **Site URL**:
   ```
   https://zomi-frontend.onrender.com
   ```

3. **Redirect URLs** (add both):
   ```
   https://zomi-frontend.onrender.com/**
   https://zomi-frontend.onrender.com/auth/callback
   ```

4. Click **"Save"**

### Update Frontend Environment Variables

1. **Go to Render → Frontend Service → Environment**
2. **Add new variable**:
   
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://zomi-backend.onrender.com` |

3. Click **"Save Changes"** (triggers auto-redeploy)

---

## ✅ Verification Checklist

### Frontend
- [ ] Opens at: `https://zomi-frontend.onrender.com`
- [ ] Login page loads
- [ ] No console errors (F12)

### Backend (when logic is added)
- [ ] Opens at: `https://zomi-backend.onrender.com`
- [ ] Shows API documentation: `/docs`
- [ ] Health check works: `/health`

### Supabase
- [ ] Project is active
- [ ] Auth URLs configured
- [ ] API keys copied

---

## 🆘 Troubleshooting

### Frontend Issues

**White screen:**
- Check Render logs for build errors
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Ensure build command includes `cd frontend`

**Build fails:**
- Check Node version is 18+
- Verify `package.json` exists in `frontend/` folder
- Review build logs for missing dependencies

### Backend Issues

**Service won't start:**
- Backend has no logic yet - this is expected
- Need to create `backend/app/main.py` with FastAPI app
- Check Python version is 3.11

**Import errors:**
- Verify `requirements.txt` is in `backend/` folder
- Check build command includes `cd backend`

### Supabase Issues

**Auth not working:**
- Verify redirect URLs include `/**` wildcard
- Check frontend URL matches exactly (no trailing slash)
- Confirm email provider is enabled

---

## 📝 What You Should Have Now

✅ **Frontend Service**: `https://zomi-frontend.onrender.com`  
✅ **Backend Service**: `https://zomi-backend.onrender.com`  
✅ **Supabase Project**: `https://xxxxx.supabase.co`  
✅ **GitHub Repo**: https://github.com/Ahmedtambal/ZomiSaas

---

## 🎯 Next Steps

1. Create minimal `backend/app/main.py` for backend to run
2. Implement database migrations in Supabase
3. Add authentication logic
4. Connect frontend to backend API
5. Implement business logic

---

**Note**: Backend will fail to start until `app/main.py` is created with FastAPI initialization.

---

**Last Updated**: January 2026