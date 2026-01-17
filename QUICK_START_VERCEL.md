# 🚀 Quick Start - Deploy to Vercel

## 1️⃣ Set Environment Variable (2 minutes)

Go to: https://vercel.com/dashboard
1. Click your project: **Expense-Traker-Frontend**
2. **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter:
   ```
   Name: VITE_API_BASE_URL
   Value: https://expense-tracker-backend-production.up.railway.app
   ```
5. Select: ✅ Production, ✅ Preview, ✅ Development
6. Click **Save**

## 2️⃣ Redeploy (1 minute)

Two options:

**Option A - Trigger from Git:**
```bash
cd frontend
git add .
git commit -m "fix: connect to Railway backend"
git push origin main
```

**Option B - Manual Redeploy:**
1. Go to **Deployments** tab
2. Click **...** on latest deployment
3. Click **Redeploy**

## 3️⃣ Test (1 minute)

1. Open: https://expense-tracker-frontend.vercel.app
2. Open Browser DevTools (F12)
3. Click **Console** tab
4. Should see: `🌐 API Base URL: https://expense-tracker-backend-production.up.railway.app`
5. Try to **Login** or **Sign Up**
6. Check **Network** tab - requests go to Railway (not localhost)

---

## ✅ Success = No Errors

You should see:
- ✅ Console shows Railway URL
- ✅ Network tab shows Railway requests
- ✅ Login/Signup works
- ✅ NO `localhost` anywhere
- ✅ NO CORS errors

---

## ❌ If You See Errors

### "Still showing localhost"
→ Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

### "CORS error"
→ Check backend `CORS_ALLOWED_ORIGINS` includes your Vercel URL

### "Connection refused"
→ Verify Railway backend is live: Visit Railway URL directly

---

## 📝 What Changed?

3 files updated to use environment variables instead of hardcoded URLs:
- ✅ `src/services/api.ts`
- ✅ `src/components/Auth.tsx`  
- ✅ `src/components/Reports.tsx`

All API calls now read from `VITE_API_BASE_URL` environment variable.

---

**That's it! 3 steps, 4 minutes total.** 🎉
