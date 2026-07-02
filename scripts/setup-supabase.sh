#!/bin/bash

# Setup Supabase for Onyx

echo "🚀 Setting up Supabase for Onyx..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Installing Supabase CLI..."
    npm install -g supabase
fi

# Initialize Supabase
echo "📦 Initializing Supabase project..."
supabase init

# Create database
echo "🗄️ Creating PostgreSQL database..."
supabase db start

# Run migrations
echo "🔄 Running database migrations..."
pnpm run db:push

# Create storage buckets
echo "📁 Creating storage buckets..."
supabase storage create-bucket papers --public false
supabase storage create-bucket exports --public true

# Setup auth
echo "🔐 Setting up Clerk authentication..."
echo "Please configure Clerk in Supabase dashboard"

echo "✅ Supabase setup complete!"
echo ""
echo "Next steps:"
echo "1. Get your Supabase URL and API key from the dashboard"
echo "2. Update .env.local with SUPABASE_URL and SUPABASE_KEY"
echo "3. Run: pnpm run dev"
