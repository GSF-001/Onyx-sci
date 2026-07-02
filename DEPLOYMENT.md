# Deployment Guide

## One-Click Deploy Options

### 🔵 Vercel (Frontend)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FGSF-001%2FOnyx-sci&project-name=onyx-sci&repository-name=onyx-sci&env=CLERK_PUBLISHABLE_KEY,CLERK_SECRET_KEY,DATABASE_URL,GROQ_API_KEY,OPENAI_API_KEY&envDescription=Configuration%20for%20Onyx%20deployment)

**Deployment Steps:**

1. Click the button above
2. Connect your GitHub account
3. Set environment variables:
   - `CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `DATABASE_URL`
   - `GROQ_API_KEY` (optional)
   - `OPENAI_API_KEY` (optional)
4. Deploy!

**Frontend will be live at:** `https://<project>.vercel.app`

---

### 🚂 Railway (Backend API)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new?templateUrl=https%3A%2F%2Fgithub.com%2FGSF-001%2FOnyx-sci&envs=CLERK_PUBLISHABLE_KEY,CLERK_SECRET_KEY,DATABASE_URL,GROQ_API_KEY,OPENAI_API_KEY)

**Deployment Steps:**

1. Click the button above
2. Sign in with GitHub
3. Create a new Railway project
4. Add PostgreSQL plugin (from Railway marketplace)
5. Set environment variables from `.env.production.example`
6. Deploy!

**API will be live at:** `https://<project>.up.railway.app`

---

### 🟢 Supabase (Database + Auth)

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Select PostgreSQL 15+
4. Get your connection string from project settings
5. Use it as `DATABASE_URL`

**Database URL format:**
```
postgresql://postgres:password@db.supabase.co:5432/postgres
```

---

## Automated Deployment Script

```bash
# Deploy everything at once
bash scripts/deploy-all.sh

# Or deploy individually
bash scripts/setup-supabase.sh      # Setup database
bash scripts/deploy-railway.sh      # Deploy backend
bash scripts/deploy-vercel.sh       # Deploy frontend
```

---

## Manual Deployment

### Backend on Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Add PostgreSQL
railway add

# Set variables
railway variables set DATABASE_URL postgresql://...
railway variables set CLERK_PUBLISHABLE_KEY pk_live_...
railway variables set CLERK_SECRET_KEY sk_live_...

# Deploy
railway up
```

### Frontend on Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Database on Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Link project
supabase link --project-ref <your-project-id>

# Push schema
pnpm run db:push
```

---

## Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key

**Optional:**
- `GROQ_API_KEY` - For AI features
- `OPENAI_API_KEY` - For AI features
- `SENTRY_DSN` - For error tracking

---

## Domain Setup

### Vercel Frontend

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Domains
4. Add your domain (e.g., `onyx-research.dev`)
5. Update DNS records

### Railway Backend

1. Go to Railway Dashboard
2. Select your project
3. Go to Settings → Domain
4. Add custom domain (e.g., `api.onyx-research.dev`)
5. Update DNS CNAME record

---

## Database Migrations

```bash
# Push schema to production
pnpm run db:push

# Generate migration files
pnpm run db:generate

# See schema in Drizzle Studio
pnpm run db:studio
```

---

## Monitoring

### Health Checks

```bash
# Frontend health
curl https://your-domain.com/health

# API health
curl https://api.your-domain.com/health

# Database connection
curl https://api.your-domain.com/api/health
```

### Logs

**Vercel:** Dashboard → Deployments → Logs
**Railway:** Dashboard → Logs tab
**Supabase:** Dashboard → Logs

---

## Troubleshooting

### Database Connection Error

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check migrations
pnpm run db:push
```

### API Won't Start

```bash
# Check logs
railway logs

# Verify environment variables
railway variables

# Redeploy
railway up --force
```

### CORS Errors

Update `VITE_API_URL` in Vercel environment to match Railway domain:
```
https://api.onyx-research.dev
```

---

## Cost Breakdown

| Service | Free Tier | Paid |
|---------|-----------|------|
| Vercel | 100GB/month | $20+/month |
| Railway | $5/month credit | $5+/month |
| Supabase | 500MB DB | $25+/month |
| Clerk | 10k MAU | $20/1000 MAU |
| **Total** | ~Free | ~$70+/month |

---

## Next Steps

1. ✅ Choose a deployment option
2. ✅ Set up environment variables
3. ✅ Deploy all services
4. ✅ Configure custom domains
5. ✅ Set up monitoring & alerts
6. ✅ Configure CI/CD (GitHub Actions)

Happy deploying! 🚀
