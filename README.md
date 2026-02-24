# 🎯 Malvia — India's Premium Satta Platform

A full-stack, production-ready Satta Matka betting platform with real-time markets, instant payouts, and an admin dashboard.

---

## 🏗️ Tech Stack

| Layer      | Technology       |
|------------|-----------------|
| Frontend   | React 19 + Vite + Vanilla CSS |
| Backend    | Node.js + Express 5 |
| Database   | PostgreSQL (Supabase) |
| Auth       | JWT + OTP (mobile-based) |
| Deployment | Docker + docker-compose |

---

## 📁 Project Structure

```
malviaproject/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # PostgreSQL connection pool
│   │   ├── controllers/          # Auth, bet, market, result logic
│   │   ├── middleware/           # JWT auth middleware
│   │   ├── routes/               # Express routes
│   │   └── utils/pannaLogic.js   # Panna sorting algorithm
│   ├── schema.sql                # Database schema + seed data
│   ├── .env                      # Backend environment variables
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/                # Login, Dashboard, AdminDashboard
│   │   ├── components/           # Reusable components
│   │   ├── context/              # WalletContext (balance state)
│   │   ├── services/apiService.js # Axios API client
│   │   └── utils/pannaLogic.js   # Frontend panna utilities
│   ├── nginx.conf                # SPA routing for production
│   ├── .env                      # Frontend env vars
│   └── Dockerfile
└── docker-compose.yml
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 20+
- A Supabase project (free tier works)

### 1. Set up the Database

1. Go to [supabase.com](https://supabase.com) → your project → **SQL Editor**
2. Paste and run the contents of `backend/schema.sql`

### 2. Backend

```bash
cd backend

# Copy and fill in your env vars
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

**Backend `.env`:**
```env
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_REF.supabase.co:5432/postgres
JWT_SECRET=your-long-random-secret-here
NODE_ENV=development
```

### 3. Frontend

```bash
cd frontend

# Copy env file
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:5000/api
```

Visit: [http://localhost:5173](http://localhost:5173)

**Demo Login:** Any 10-digit number + OTP `123456`

---

## 🌐 Hosting for FREE

Here are the best free hosting options for each part:

---

### Option A — Easiest: Railway (Backend) + Vercel (Frontend)

#### 🔵 Backend on Railway (Free $5/month credit)

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub Repo**
2. Select your repo → choose the `backend/` folder
3. Add environment variables:
   - `DATABASE_URL` → your Supabase connection string
   - `JWT_SECRET` → a long random string
   - `NODE_ENV` → `production`
   - `ALLOWED_ORIGINS` → your frontend Vercel URL (e.g. `https://malvia.vercel.app`)
4. Railway auto-detects Node.js and deploys. Copy your **public URL** (e.g. `https://malvia-backend.up.railway.app`)

> **Note:** Railway gives $5 free credit/month. A small Node.js server costs ~$0.50/month. Essentially free.

#### 🟣 Frontend on Vercel (Always Free)

1. Go to [vercel.com](https://vercel.com) → **New Project → Import from GitHub**
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   - `VITE_API_URL` → `https://your-backend.up.railway.app/api`
4. Click **Deploy** — done!

---

### Option B — Render (Backend Free Tier)

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo, set **Root Directory** to `backend`
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `node src/index.js`
5. Add all environment variables from `.env.example`
6. The free tier spins down after 15 min of inactivity (cold starts ~30s)

#### Frontend on Netlify (Always Free)

1. Go to [netlify.com](https://netlify.com) → **New Site → Import from GitHub**
2. Set **Base directory** to `frontend`
3. Set **Build command**: `npm run build`
4. Set **Publish directory**: `frontend/dist`
5. Add env var: `VITE_API_URL=https://your-render-backend.onrender.com/api`

---

### Option C — Supabase Edge Functions (Backend) + Vercel (Frontend)

If you want truly free and scalable, you can migrate the backend logic to Supabase Edge Functions. This is more advanced but keeps everything on Supabase's free tier.

---

### Option D — Docker + VPS (Full Control)

If you have a VPS from providers like **Oracle Cloud Free Tier** (always free) or **Fly.io** (generous free plan):

```bash
# On your VPS
git clone your-repo
cd malviaproject

# Create .env file
cat > .env << EOF
DATABASE_URL=your_supabase_url
JWT_SECRET=your_secret
VITE_API_URL=http://your-server-ip:5000/api
FRONTEND_URL=http://your-server-ip
EOF

# Deploy
docker-compose up -d --build
```

---

## 📊 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/login` | No | Login with mobile + OTP |
| `GET`  | `/api/auth/profile` | JWT | Get user profile |
| `GET`  | `/api/markets` | No | List active markets |
| `PUT`  | `/api/markets/update` | Admin | Update market timings |
| `POST` | `/api/bets/place` | JWT | Place a bet |
| `GET`  | `/api/bets/live` | JWT | All live bets (admin) |
| `GET`  | `/api/bets/my-bets` | JWT | User's own bets |
| `POST` | `/api/admin/declare-result` | Admin | Declare result & settle |
| `GET`  | `/api/admin/results` | No | Recent results |

---

## 🎮 Bet Types & Payouts

| Bet Type | Digits | Payout |
|----------|--------|--------|
| Single | 1 (0-9) | ×9 |
| Jodi | 2 | ×90 |
| Single Panna | 3 (all unique) | ×140 |
| Double Panna | 3 (2 same) | ×270 |
| Triple Panna | 3 (all same) | ×600 |

---

## 🔒 Production Checklist

- [ ] Change `JWT_SECRET` to a long random string: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [ ] Set `NODE_ENV=production`  
- [ ] Set `ALLOWED_ORIGINS` to your frontend domain only
- [ ] Remove the "DEV MODE" OTP hint from Login.jsx
- [ ] Integrate real OTP provider (Twilio / MSG91 / 2Factor)
- [ ] Set up database backups in Supabase
- [ ] Enable Supabase Row Level Security (RLS)
- [ ] Set up monitoring (e.g., Sentry, UptimeRobot)

---

## 🔑 Admin Access

To make a user an admin, run this in your Supabase SQL editor:

```sql
UPDATE users SET is_admin = TRUE WHERE mobile = 'YOUR_MOBILE_NUMBER';
```

Then log in again to get the updated token. You'll be redirected to `/admin`.

---

## 🧪 Development Notes

- **OTP**: Currently uses `123456` as master OTP for all numbers. Replace with real OTP in production.  
- **Wallet**: New users start with ₹50,000 demo balance.
- **Markets**: Seeded with 4 markets. Add more via SQL.
- **Panna**: Uses Panna sorting algorithm where `0` ranks highest (value 10).

---

## 📝 License

MIT
