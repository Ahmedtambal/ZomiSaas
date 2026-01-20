# Frontend Environment Variables

Add these to your Render static site:

```
VITE_API_URL=https://your-backend-app.onrender.com
VITE_ENVIRONMENT=production
```

## Local Development

Create a `.env` file in the frontend folder:

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:8000
VITE_ENVIRONMENT=development
```

## Production (Render)

In Render Dashboard → Frontend Service → Environment:
```
VITE_API_URL=https://zomi-backend.onrender.com
VITE_ENVIRONMENT=production
```

Replace `zomi-backend.onrender.com` with your actual backend URL.
