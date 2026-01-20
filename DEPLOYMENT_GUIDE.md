# 🚀 Deployment Setup Guide

This guide walks you through deploying Zomi Wealth Portal to Render and Supabase.

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ GitHub account with access to: https://github.com/Ahmedtambal/ZomiSaas
- ✅ Render account (free tier works): https://render.com
- ✅ Supabase account (free tier works): https://supabase.com

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

2. **Copy These Values** (you'll need them for Render):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJh...`
   
   📝 **Keep these safe** - add them to a notepad temporarily

### Step 3: Configure Authentication

1. **Go to Authentication Settings**
   - Click **🔐 Authentication** in left sidebar
   - Click **"Providers"** tab

2. **Enable Email Provider**
   - Find **"Email"** in the list
   - Toggle it **ON** (should be enabled by default)
   - Confirm Email is enabled

3. **Configure Site URL** (Do this AFTER Render deployment)
   - Go to **Authentication** → **URL Configuration**
   - You'll update this later with your Render URL
   - For now, leave it as default

---

## 🚀 Part 2: Render Setup (Hosting)

### Step 1: Connect GitHub to Render

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Sign up or log in (use GitHub for easy connection)

2. **New Web Service**
   - Click **"New +"** button (top right)
   - Select **"Web Service"**

3. **Connect Repository**
   - If first time: Click **"Connect GitHub"** and authorize Render
   - Search for: `Ahmedtambal/ZomiSaas`
   - Click **"Connect"** on the repository

### Step 2: Configure Build Settings

Render should auto-detect most settings from `render.yaml`, but verify:

1. **Basic Settings**
   - **Name**: `zomi-wealth-portal` (or your choice)
   - **Region**: **Europe (Frankfurt)** - closest to London
   - **Branch**: `main`
   - **Runtime**: Node

2. **Build & Deploy**
   - **Build Command**: 
     ```bash
     npm install && npm run build
     ```
   - **Start Command**: 
     ```bash
     npm run preview
     ```
   - **Auto-Deploy**: ✅ Yes

### Step 3: Add Environment Variables

**CRITICAL STEP** - Add your Supabase credentials:

1. **In Render Dashboard**
   - Scroll down to **"Environment Variables"** section
   - Click **"Add Environment Variable"**

2. **Add These Variables:**

   | Key | Value | Where to Get It |
   |-----|-------|-----------------|
   | `VITE_SUPABASE_URL` | Your Supabase Project URL | Supabase → Settings → API |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon public key | Supabase → Settings → API |

   **Example:**
   ```
   VITE_SUPABASE_URL = https://abcdefgh.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Click "Add"** for each variable

### Step 4: Deploy!

1. **Click "Create Web Service"**
   - Render will start building your app
   - This takes ~3-5 minutes
   - Watch the build logs in real-time

2. **Wait for Success**
   - You'll see: ✅ **"Live"** status
   - Your app URL will be shown (e.g., `https://zomi-wealth-portal.onrender.com`)

3. **Copy Your Render URL**
   - Click the URL to open your app
   - Save this URL - you'll need it for Supabase

---

## 🔗 Part 3: Connect Supabase to Render

### Update Supabase Authentication URLs

1. **Go Back to Supabase Dashboard**
   - Navigate to **Authentication** → **URL Configuration**

2. **Update Site URL**
   - **Site URL**: `https://your-app-name.onrender.com`
   - Replace with YOUR actual Render URL

3. **Add Redirect URLs**
   - **Redirect URLs**: Add these (replace with your domain):
     ```
     https://your-app-name.onrender.com/**
     https://your-app-name.onrender.com/auth/callback
     ```
   - Click **"Save"**

---

## ✅ Verification Checklist

### Test Your Deployment

- [ ] Open your Render URL in a browser
- [ ] Page loads without white screen or errors
- [ ] You see the login page with Zomi branding
- [ ] No console errors in browser DevTools (F12)

### Troubleshooting

**If you see a white screen:**
1. Check Render build logs for errors
2. Verify environment variables are set correctly in Render
3. Make sure both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present

**If login doesn't work yet:**
- This is expected! We haven't set up the database tables yet
- Continue to the next section (database setup)

---

## 📊 Part 4: Database Setup (Coming Next)

After completing the above steps, you'll have:
- ✅ Code deployed on Render
- ✅ Supabase project created
- ✅ Frontend and backend connected

**Next steps will cover:**
1. Running database migrations (creating tables)
2. Setting up Row Level Security policies
3. Implementing authentication flow
4. Creating your first admin invite code

---

## 🆘 Support & Common Issues

### Issue: Build Failed on Render
- Check that `package.json` and `package-lock.json` are in the repository
- Verify Node version compatibility (18+ required)
- Review build logs for specific errors

### Issue: Environment Variables Not Working
- Environment variables must start with `VITE_` to be accessible in frontend
- After adding/changing env vars, trigger a redeploy in Render
- Wait for full rebuild (not just restart)

### Issue: Can't Access Supabase Project URL
- Ensure you copied the FULL URL including `https://`
- Check there are no extra spaces in the environment variable values
- Verify the anon key is the PUBLIC anon key, not the service role key

---

## 📝 What You Should Have Now

✅ **GitHub Repository**: https://github.com/Ahmedtambal/ZomiSaas  
✅ **Render Deployment**: https://your-app-name.onrender.com  
✅ **Supabase Project**: https://xxxxx.supabase.co  
✅ **Environment Variables**: Configured in Render  
✅ **Auth Redirect URLs**: Configured in Supabase  

---

## 🎯 Next Steps

Once infrastructure is set up, we'll implement:
1. Database schema (tables for users, members, forms)
2. Supabase authentication integration
3. Replace mock data with real database queries
4. Set up invite code system
5. Configure admin access

**Ready to continue?** Let me know when the above steps are complete!

---

**Last Updated**: January 2026  
**Support**: Contact development team for assistance