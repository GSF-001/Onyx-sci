#!/bin/bash

# Deploy to Railway

echo "🚀 Deploying to Railway..."

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "🔐 Authenticating with Railway..."
railway login

# Initialize project
echo "📦 Initializing Railway project..."
railway init

# Add PostgreSQL plugin
echo "🗄️ Adding PostgreSQL to project..."
railway add

# Set environment variables
echo "🔐 Setting up environment variables..."
echo "Please set the following variables in Railway dashboard:"
echo "- CLERK_PUBLISHABLE_KEY"
echo "- CLERK_SECRET_KEY"
echo "- GROQ_API_KEY (optional)"
echo "- OPENAI_API_KEY (optional)"
echo "- SENTRY_DSN (optional)"

# Deploy
echo "🚀 Deploying..."
railway up

echo "✅ Deployment to Railway complete!"
echo ""
echo "Your API is live at: https://<your-project>.up.railway.app"
