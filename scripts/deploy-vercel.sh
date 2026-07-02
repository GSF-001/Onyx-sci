#!/bin/bash

# Deploy to Vercel

echo "🚀 Deploying to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel
echo "🔐 Authenticating with Vercel..."
vercel login

# Deploy
echo "📦 Deploying project..."
vercel --prod

echo "✅ Deployment to Vercel complete!"
echo ""
echo "Your app is live at: https://<your-project>.vercel.app"
