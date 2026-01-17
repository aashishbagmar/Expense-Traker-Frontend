# 🚀 Frontend-Backend Connection - Deployment Checklist

## ✅ Changes Made

### Frontend (Vite + React)

1. **Environment Variable Setup**
   - ✅ Changed from hardcoded `localhost:9000` to `import.meta.env.VITE_API_BASE_URL`
   - ✅ Added fallback to localhost for local development
   - ✅ Added production validation warning

2. **Files Updated**
   - ✅ `src/services/api.ts` - Central API configuration with env variable
   - ✅ `src/components/Auth.tsx` - Signup and login endpoints
   - ✅ `src/components/Reports.tsx` - PDF export and financial report endpoints
   - ✅ Created `.env.example` - Template for environment variables

3. **API Base URL Pattern**
   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000';
   ```

---

## 🔧 Vercel Deployment Steps

### Step 1: Set Environment Variable in Vercel

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Environment Variables**
3. Add new variable:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://expense-tracker-backend-production.up.railway.app`
   - **Environments:** Select **Production**, **Preview**, and **Development**
4. Click **Save**

### Step 2: Redeploy Frontend

Option A - Automatic (recommended):
```bash
git add .
git commit -m "fix: use environment variable for API base URL"
git push origin main
```
Vercel will automatically deploy.

Option B - Manual:
1. Go to Vercel Dashboard → **Deployments**
2. Click **...** on latest deployment
3. Click **Redeploy**

### Step 3: Verify Deployment

1. Open browser DevTools → **Network** tab
2. Navigate to your Vercel URL
3. Try to login/signup
4. Check Network requests - should show:
   ```
   POST https://expense-tracker-backend-production.up.railway.app/api/token/
   ```
5. **NO** `localhost` URLs should appear

---

## 🔧 Railway Backend CORS Configuration

### Required Changes in Django `settings.py`

```python
# Install django-cors-headers if not already installed
INSTALLED_APPS = [
    ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be at the top
    'django.middleware.common.CommonMiddleware',
    ...
]

# Allow your Vercel frontend domain
CORS_ALLOWED_ORIGINS = [
    "https://expense-tracker-frontend.vercel.app",  # Replace with your actual Vercel domain
    "https://your-preview-deployments.vercel.app",  # If using preview deployments
]

# Optional: Allow credentials (cookies, auth headers)
CORS_ALLOW_CREDENTIALS = True

# For debugging ONLY (remove in production):
# CORS_ALLOW_ALL_ORIGINS = True
```

### Update Railway Environment Variables

1. Go to **Railway Dashboard** → Your Project
2. Add environment variables if needed:
   ```
   ALLOWED_HOSTS=expense-tracker-backend-production.up.railway.app
   CORS_ALLOWED_ORIGINS=https://expense-tracker-frontend.vercel.app
   ```

---

## 🧪 Testing Checklist

### Local Development
- [ ] Create `.env.local` file:
  ```
  VITE_API_BASE_URL=http://localhost:9000
  ```
- [ ] Run `npm run dev`
- [ ] Test signup/login with local backend
- [ ] Verify console shows: `🌐 API Base URL: http://localhost:9000`

### Production (Vercel)
- [ ] Environment variable `VITE_API_BASE_URL` set in Vercel
- [ ] Frontend redeployed after setting env variable
- [ ] Backend CORS configured to allow Vercel domain
- [ ] Open Vercel URL in browser
- [ ] Check browser console for API Base URL
- [ ] Test signup - should work without CORS errors
- [ ] Test login - should receive JWT tokens
- [ ] Network tab shows Railway URLs only (no localhost)

---

## 🐛 Troubleshooting

### Issue: Still seeing `localhost` in production

**Cause:** Browser cache or environment variable not set

**Fix:**
1. Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Check Vercel deployment logs for env variable
3. Verify env variable name is exactly `VITE_API_BASE_URL` (case-sensitive)

### Issue: CORS errors in browser console

**Error:** `Access-Control-Allow-Origin` blocked

**Fix:**
1. Add your Vercel domain to `CORS_ALLOWED_ORIGINS` in Django settings
2. Ensure `corsheaders` middleware is **first** in MIDDLEWARE list
3. Redeploy Railway backend
4. Clear browser cache

### Issue: 401 Unauthorized

**Cause:** JWT token not being sent or invalid

**Fix:**
1. Check localStorage has `authToken`
2. Verify `Authorization: Bearer <token>` header is sent
3. Check token expiry (Django JWT settings)

### Issue: Connection refused / Network error

**Cause:** Wrong backend URL or backend not running

**Fix:**
1. Verify Railway backend is live: Visit Railway URL directly
2. Check Vercel env variable is correct (no trailing slash)
3. Check Railway logs for errors

---

## 📋 Summary of Key Changes

| File | Change |
|------|--------|
| `src/services/api.ts` | Uses `import.meta.env.VITE_API_BASE_URL` instead of hardcoded URL |
| `src/components/Auth.tsx` | Imports and uses `API_BASE_URL` from api.ts |
| `src/components/Reports.tsx` | Imports and uses `API_BASE_URL` from api.ts |
| `.env.example` | Template showing required environment variables |

---

## ✅ Success Criteria

- ✅ No hardcoded `localhost` URLs in production build
- ✅ Frontend reads API URL from Vercel environment variable
- ✅ Backend accepts requests from Vercel domain (CORS)
- ✅ Login/signup work end-to-end on live Vercel URL
- ✅ Network tab shows only Railway backend URLs

---

## 🔗 Quick Links

- **Frontend (Vercel):** https://expense-tracker-frontend.vercel.app
- **Backend (Railway):** https://expense-tracker-backend-production.up.railway.app
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Railway Dashboard:** https://railway.app/dashboard

---

## 📞 Next Steps

1. Set `VITE_API_BASE_URL` in Vercel environment variables
2. Update `CORS_ALLOWED_ORIGINS` in Railway Django settings
3. Redeploy both frontend and backend
4. Test signup/login on live Vercel URL
5. Monitor browser console and Network tab for any errors

**All localhost references have been removed from the codebase!** 🎉
