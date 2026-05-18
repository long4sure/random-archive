# BizlERP — Restaurant Management System
## Complete Deployment Guide

---

## Project Structure

```
erp/
├── frontend/          ← React + Vite app (deploy to Vercel)
│   ├── src/
│   │   ├── pages/     ← Dashboard, Inventory, Expenses, Contacts
│   │   ├── components/← Layout, Modal
│   │   ├── hooks/     ← useAuth (context)
│   │   └── lib/       ← api.js (fetch wrapper)
│   └── index.html
└── backend/           ← Node.js + Express API (deploy to Railway)
    ├── src/
    │   ├── routes/    ← auth, dashboard, inventory, expenses, contacts
    │   ├── middleware/← JWT auth
    │   └── lib/       ← supabase client
    └── schema.sql     ← Run this in Supabase first
```

---

## STEP 1 — Set up the database (Supabase) — FREE

1. Go to https://supabase.com and create a free account
2. Click **New project**, name it `bizlerp`, choose a strong password
3. Wait ~2 minutes for it to provision
4. Go to **SQL Editor** → **New Query**
5. Copy the entire contents of `backend/schema.sql` and click **Run**
6. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **service_role** key (under "Project API keys" — keep this secret!)

---

## STEP 2 — Deploy the backend (Railway) — ~$5/mo

1. Push your code to GitHub (create a new repo at github.com)
   ```bash
   cd erp
   git init
   git add .
   git commit -m "Initial BizlERP setup"
   git remote add origin https://github.com/YOUR_USERNAME/bizlerp.git
   git push -u origin main
   ```

2. Go to https://railway.app → **New Project** → **Deploy from GitHub repo**
3. Select your repo → choose the `backend/` folder as the root
4. Railway will auto-detect Node.js — click **Deploy**
5. Go to **Variables** tab and add:
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key
   JWT_SECRET=run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   FRONTEND_URL=https://your-app.vercel.app
   PORT=3001
   ```
6. Go to **Settings → Networking** → **Generate Domain**
7. Copy your Railway URL (e.g. `https://bizlerp-api.up.railway.app`)

---

## STEP 3 — Deploy the frontend (Vercel) — FREE

1. Go to https://vercel.com → **Add New Project**
2. Import your GitHub repo → set **Root Directory** to `frontend`
3. Add environment variable:
   ```
   VITE_API_URL=https://your-railway-url.up.railway.app
   ```
4. Click **Deploy**
5. Your app is live at `https://bizlerp.vercel.app` (or custom domain)

---

## STEP 4 — Connect your domain (optional) — ~$12/yr

1. Buy a `.com` or `.ph` domain at https://namecheap.com
2. In Vercel → **Settings → Domains** → add your domain
3. Point DNS to Vercel (they give you exact instructions)
4. HTTPS is automatic and free

---

## Local Development

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env        # fill in your Supabase keys
npm install
npm run dev                 # runs on http://localhost:3001

# Terminal 2 — frontend
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:3001
npm install
npm run dev                 # runs on http://localhost:5173
```

---

## Monthly Cost Summary

| Service    | Plan         | Cost        |
|------------|--------------|-------------|
| Supabase   | Free tier    | ₱0          |
| Railway    | Hobby plan   | ~₱280–450   |
| Vercel     | Hobby plan   | ₱0          |
| Domain     | Namecheap    | ~₱55/mo     |
| **Total**  |              | **~₱340–510/mo** |

Upgrade Supabase to Pro ($25/mo) when your database hits 400MB or you need automatic backups.

---

## Tech Stack

| Layer     | Technology            | Why                              |
|-----------|-----------------------|----------------------------------|
| Frontend  | React 18 + Vite       | Fast, modern, easy to build      |
| Hosting   | Vercel (free)         | CDN, HTTPS, custom domain        |
| Backend   | Node.js + Express     | Simple REST API, easy to deploy  |
| API host  | Railway ($5/mo)       | Best DX, usage-based billing     |
| Database  | Supabase PostgreSQL   | Managed Postgres, generous free  |
| Auth      | JWT (jsonwebtoken)    | Stateless, works anywhere        |
| Domain    | Namecheap             | Cheapest reputable registrar     |
