# 🚀 Render Production Deployment Guide

## Overview

This guide covers deploying both frontend and backend to Render in **production mode** with live Supabase database.

## Prerequisites

- ✅ GitHub repository: https://github.com/Ahmedtambal/ZomiSaas
- ✅ Supabase project created in eu-west-2 (London)
- ✅ SQL migrations executed in Supabase
- ✅ Code pushed to GitHub

## 📋 Deployment Order

Deploy in this order:
1. **Backend first** (to get API URL)
2. **Frontend second** (using backend API URL)

---

## 🔧 Part 1: Deploy Backend to Render

### Step 1: Create Backend Web Service

1. Go to https://render.com/dashboard
2. Click **New +** → **Web Service**
3. Connect your GitHub repository: `Ahmedtambal/ZomiSaas`
4. Configure service:

**Basic Settings:**
- **Name**: `zomi-backend` (or your choice)
- **Region**: `Frankfurt (EU Central)` (closest to London Supabase)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Python 3`
- **Build Command**: 
  ```bash
  pip install -r requirements.txt
  ```
- **Start Command**: 
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```

**Instance Type:**
- Free tier (for testing) or Starter ($7/month)

### Step 2: Add Backend Environment Variables

Click **Environment** tab and add these variables:

```env
# Supabase Configuration (from Supabase Settings → API)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here

# JWT Configuration (generate SECRET_KEY with: python -c "import secrets; print(secrets.token_urlsafe(32))")
SECRET_KEY=your-generated-secret-key-32-chars-minimum
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Password Requirements
MIN_PASSWORD_LENGTH=8
REQUIRE_UPPERCASE=true
REQUIRE_LOWERCASE=true
REQUIRE_DIGIT=true
REQUIRE_SPECIAL_CHAR=true

# Invite Code Configuration
INVITE_CODE_EXPIRY_HOURS=2

# Frontend URL (will update after frontend deployment)
FRONTEND_URL=https://your-frontend-app.onrender.com

# Environment
ENVIRONMENT=production
```

**⚠️ Important Notes:**
- Use **service_role** key for `SUPABASE_KEY` (not anon key)
- Generate a strong `SECRET_KEY` (32+ characters)
- Update `FRONTEND_URL` after deploying frontend (Step 2 below)

### Step 3: Deploy Backend

1. Click **Create Web Service**
2. Wait for deployment (5-10 minutes)
3. Once deployed, you'll get a URL like: `https://zomi-backend.onrender.com`
4. **Copy this URL** - you'll need it for frontend

### Step 4: Test Backend

Open your backend URL in browser:
```
https://zomi-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "environment": "production",
  "version": "1.0.0"
}
```

Check API docs (will be disabled in production):
```
https://zomi-backend.onrender.com/docs
```
Note: Swagger docs are disabled in production for security.

---

## 🎨 Part 2: Deploy Frontend to Render

### Step 1: Create Frontend Static Site

1. In Render Dashboard, click **New +** → **Static Site**
2. Connect same GitHub repository: `Ahmedtambal/ZomiSaas`
3. Configure service:

**Basic Settings:**
- **Name**: `zomi-frontend` (or your choice)
- **Region**: `Frankfurt (EU Central)` (same as backend)
- **Branch**: `main`
- **Root Directory**: `frontend`
- **Build Command**: 
  ```bash
  npm install && npm run build
  ```
- **Publish Directory**: `dist`

### Step 2: Add Frontend Environment Variables

Click **Environment** tab and add:

```env
# Backend API URL (from Part 1, Step 3)
VITE_API_URL=https://zomi-backend.onrender.com

# Environment
VITE_ENVIRONMENT=production
```

### Step 3: Deploy Frontend

1. Click **Create Static Site**
2. Wait for deployment (3-5 minutes)
3. Once deployed, you'll get a URL like: `https://zomi-frontend.onrender.com`
4. **Copy this URL**

### Step 4: Update Backend FRONTEND_URL

Now that frontend is deployed, update backend:

1. Go to backend service in Render Dashboard
2. Click **Environment** tab
3. Update `FRONTEND_URL` variable:
   ```
   FRONTEND_URL=https://zomi-frontend.onrender.com
   ```
4. Click **Save Changes**
5. Backend will automatically redeploy with new CORS settings

---

## ✅ Part 3: Verify Production Deployment

### Test Backend Health
```bash
curl https://zomi-backend.onrender.com/health
```

### Test Admin Signup
```bash
curl -X POST https://zomi-backend.onrender.com/api/auth/signup/admin \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Production Admin",
    "email": "admin@yourcompany.com",
    "password": "SecurePass123!",
    "job_title": "Administrator",
    "organization_name": "Your Company",
    "role": "admin"
  }'
```

### Test Frontend
1. Open `https://zomi-frontend.onrender.com` in browser
2. You should see the login page
3. Try to register (admin tab)
4. Try to login
5. After login, verify redirect to dashboard

### Verify Supabase Data
1. Go to Supabase Dashboard → Table Editor
2. Check **organizations** table - should have your company
3. Check **users** table - should have your admin user
4. Check **audit_logs** - should show signup and login events

---

## 🔒 Production Security Checklist

- [x] `ENVIRONMENT=production` set in backend
- [x] Using HTTPS URLs (Render provides SSL automatically)
- [x] `FRONTEND_URL` matches actual frontend URL (no wildcards)
- [x] Service role key used (not anon key)
- [x] Strong `SECRET_KEY` generated (32+ chars)
- [x] Swagger docs disabled in production (`docs_url=None`)
- [x] TrustedHostMiddleware enabled for production
- [x] All sensitive keys in environment variables (not in code)
- [ ] Enable Render's DDoS protection (in service settings)
- [ ] Set up monitoring/alerts in Render
- [ ] Configure custom domain (optional)

---

## 🌐 Custom Domain Setup (Optional)

### For Frontend
1. Go to frontend service in Render
2. Click **Settings** → **Custom Domain**
3. Add your domain (e.g., `app.yourcompany.com`)
4. Update DNS records as shown
5. Wait for SSL certificate (automatic)

### For Backend
1. Go to backend service in Render
2. Click **Settings** → **Custom Domain**
3. Add your API subdomain (e.g., `api.yourcompany.com`)
4. Update DNS records
5. Update frontend `VITE_API_URL` to use custom domain
6. Update backend `FRONTEND_URL` if using custom domain

---

## 📊 Monitoring & Logs

### View Backend Logs
1. Go to backend service in Render Dashboard
2. Click **Logs** tab
3. Monitor for errors, authentication events, requests

### View Frontend Logs
1. Go to frontend service in Render Dashboard
2. Click **Logs** tab
3. Monitor build logs and deployment status

### Monitor Supabase
1. Go to Supabase Dashboard
2. Click **Database** → **Logs**
3. Monitor queries and errors
4. Check **Auth** → **Users** for user activity

---

## 🚨 Troubleshooting Production

### Issue: CORS Error in Frontend

**Error**: `Access-Control-Allow-Origin` error in browser console

**Solution**:
1. Verify `FRONTEND_URL` in backend matches frontend URL exactly
2. No trailing slash in URL
3. Must use HTTPS (not HTTP)
4. Redeploy backend after changing `FRONTEND_URL`

### Issue: Backend Connection Refused

**Error**: Frontend can't connect to backend API

**Solution**:
1. Check `VITE_API_URL` in frontend env variables
2. Verify backend is deployed and running (check `/health` endpoint)
3. Check backend logs for errors
4. Ensure backend didn't fail build (check Render Dashboard)

### Issue: Supabase Connection Error

**Error**: `Connection refused` or `Unauthorized` from Supabase

**Solution**:
1. Verify `SUPABASE_URL` is correct (from Supabase Settings → API)
2. Verify `SUPABASE_KEY` is **service_role** key (not anon key)
3. Check Supabase project is active (not paused)
4. Verify Supabase project region matches your setup (eu-west-2)

### Issue: Login Not Working

**Error**: Login fails or doesn't redirect to dashboard

**Solution**:
1. Check browser console for errors
2. Verify backend `/api/auth/login` endpoint works (check logs)
3. Check Supabase **users** table has the user
4. Verify password hash was created correctly
5. Check frontend is making requests to correct backend URL

### Issue: Render Service Suspended (Free Tier)

**Problem**: Free tier services sleep after inactivity

**Solution**:
1. Upgrade to Starter plan ($7/month) for always-on service
2. Or accept 50 second cold start on first request
3. Consider using a service like UptimeRobot to keep service warm

---

## 💰 Cost Summary

### Render Costs
- **Backend** (Free): $0/month (sleeps after 15 min inactivity)
- **Backend** (Starter): $7/month (always on, better performance)
- **Frontend**: $0/month (static sites are always free)

### Supabase Costs
- **Free Tier**: $0/month
  - 500 MB database
  - 1 GB file storage
  - 50,000 monthly active users
  - 2 GB bandwidth
- **Pro**: $25/month (if you exceed free tier)

**Recommended for Production**: 
- Backend Starter ($7) + Supabase Free = **$7/month**

---

## 🔄 Updating Production

### Update Backend Code
1. Push changes to GitHub `main` branch
2. Render will auto-deploy backend (if auto-deploy enabled)
3. Or click **Manual Deploy** in Render Dashboard

### Update Frontend Code
1. Push changes to GitHub `main` branch
2. Render will auto-deploy frontend
3. Check deployment logs for success

### Update Environment Variables
1. Go to service in Render Dashboard
2. Click **Environment** tab
3. Update variables
4. Click **Save Changes**
5. Service will auto-redeploy

---

## 📋 Production URLs Reference

After deployment, save these URLs:

```
# Frontend
https://zomi-frontend.onrender.com

# Backend API
https://zomi-backend.onrender.com

# API Health Check
https://zomi-backend.onrender.com/health

# Supabase Dashboard
https://supabase.com/dashboard/project/your-project-id
```

---

## 🎯 Next Steps After Deployment

1. **Test complete user flow**:
   - Admin signup → creates org
   - Login → redirects to dashboard
   - Create invite code (manually in Supabase for now)
   - User signup with invite code
   - All features working

2. **Monitor for 24 hours**:
   - Check Render logs for errors
   - Monitor Supabase usage
   - Test on different devices/browsers

3. **Optional enhancements**:
   - Add custom domains
   - Set up monitoring/alerts
   - Implement rate limiting
   - Add email verification
   - Create admin panel for invite code generation

4. **Backup strategy**:
   - Supabase has automatic daily backups (Free tier: 7 days)
   - Consider exporting important data weekly
   - Document recovery procedures

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **React Docs**: https://react.dev

---

**🎉 Deployment Complete!**

Your wealth management tool is now live in production on Render with Supabase backend!
