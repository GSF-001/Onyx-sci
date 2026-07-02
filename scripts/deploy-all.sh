#!/bin/bash

# Deploy everything in one go

echo "🚀 Onyx Full Deployment Script"
echo "================================="
echo ""
echo "This script will deploy Onyx to:"
echo "1. Vercel (Frontend)"
echo "2. Railway (Backend API)"
echo "3. Supabase (Database)"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Step 1: Setup Supabase
echo ""
echo "📦 Step 1: Setting up Supabase..."
if bash scripts/setup-supabase.sh; then
    echo "✅ Supabase setup successful"
else
    echo "❌ Supabase setup failed"
    exit 1
fi

# Step 2: Deploy to Railway
echo ""
echo "📦 Step 2: Deploying backend to Railway..."
if bash scripts/deploy-railway.sh; then
    echo "✅ Railway deployment successful"
else
    echo "❌ Railway deployment failed"
    exit 1
fi

# Step 3: Deploy to Vercel
echo ""
echo "📦 Step 3: Deploying frontend to Vercel..."
if bash scripts/deploy-vercel.sh; then
    echo "✅ Vercel deployment successful"
else
    echo "❌ Vercel deployment failed"
    exit 1
fi

echo ""
echo "🎉 All deployments complete!"
echo ""
echo "Your apps are live at:"
echo "📱 Frontend: https://<your-vercel-project>.vercel.app"
echo "🔌 API: https://<your-railway-project>.up.railway.app"
echo "🗄️ Database: Supabase Project URL"
echo ""
echo "Next: Configure DNS and domain mapping in each platform"
