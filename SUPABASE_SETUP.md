# Supabase + Stripe Setup Guide

**Status**: Ready to implement
**Time Required**: 2-3 hours
**Cost**: $0 (free tiers)

---

## Step 1: Create Supabase Project (10 minutes)

### 1.1 Sign Up
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub (recommended)

### 1.2 Create Project
1. Click "New Project"
2. Name: `snapmod` (or `snapmod-prod`)
3. Database Password: **Generate a strong one and save it**
4. Region: Choose closest to your users (e.g., `us-east-1`)
5. Plan: **Free** (50k MAU, 500MB database, 1GB storage)
6. Click "Create new project"
7. Wait 2-3 minutes for provisioning

### 1.3 Get API Keys
1. Go to Project Settings → API
2. Copy these values:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this SECRET)

### 1.4 Configure Auth
1. Go to Authentication → Settings
2. Enable **Email** provider
3. Disable email confirmation for now (or configure email provider)
4. Set Site URL: `http://localhost:3000` (update to production later)
5. Add Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.vercel.app/auth/callback`

---

## Step 2: Create Stripe Account (10 minutes)

### 2.1 Sign Up
1. Go to https://stripe.com
2. Click "Start now"
3. Create account

### 2.2 Create Product
1. Go to Product Catalog → Add Product
2. Name: `SnapMod Pro`
3. Description: `Unlimited AI edits, advanced features, and cloud sync`
4. Pricing:
   - Type: Recurring
   - Price: $4.99 USD
   - Billing period: Monthly
5. Click "Add product"
6. Copy the **Price ID** (starts with `price_`)

### 2.3 Get API Keys
1. Go to Developers → API keys
2. Copy these values:
   - `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `Secret key` → `STRIPE_SECRET_KEY` (keep this SECRET)

### 2.4 Get Webhook Secret (we'll set this up later)
- For now, just note you'll need it
- We'll create the webhook endpoint first

---

## Step 3: Add Environment Variables (5 minutes)

Create `.env.local` in your project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
STRIPE_PRICE_ID=price_xxxxxxxxxxxxx

# App URL (for callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: Add `.env.local` to `.gitignore` (it should already be there)

---

## Step 4: Set Up Supabase Database (10 minutes)

### 4.1 Create Tables

Go to Supabase Dashboard → SQL Editor → New Query:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  is_pro BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status TEXT, -- 'active', 'canceled', 'past_due'
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Usage tracking table
CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'edit', 'export', 'preset_save'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_usage_logs_user_date
  ON public.usage_logs(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own usage"
  ON public.usage_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON public.usage_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to check daily usage
CREATE OR REPLACE FUNCTION public.get_daily_usage(user_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.usage_logs
  WHERE user_id = user_uuid
    AND action = 'edit'
    AND created_at > CURRENT_DATE;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user is pro
CREATE OR REPLACE FUNCTION public.is_user_pro(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(is_pro, FALSE)
  FROM public.profiles
  WHERE id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER;
```

Click "Run" to execute the SQL.

### 4.2 Verify Tables
1. Go to Table Editor
2. You should see: `profiles`, `usage_logs`
3. Click on each to verify structure

---

## Step 5: Deploy to Vercel (5 minutes)

### 5.1 Add Environment Variables to Vercel
1. Go to your Vercel project
2. Settings → Environment Variables
3. Add all variables from `.env.local`
4. Make sure to add for all environments (Production, Preview, Development)

### 5.2 Redeploy
```bash
git push origin main
# Vercel will auto-deploy
```

---

## Step 6: Set Up Stripe Webhook (10 minutes)

### 6.1 For Local Testing
```bash
# Install Stripe CLI
# Mac: brew install stripe/stripe-cli/stripe
# Windows: Download from https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy the webhook signing secret (whsec_...)
# Add to .env.local as STRIPE_WEBHOOK_SECRET
```

### 6.2 For Production
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-domain.vercel.app/api/stripe/webhook`
4. Description: `SnapMod webhook`
5. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Click "Add endpoint"
7. Copy the "Signing secret" (whsec_...)
8. Add to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

---

## Step 7: Test Everything (30 minutes)

### 7.1 Test Auth Flow
1. Start dev server: `npm run dev`
2. Open app
3. Click "Sign In"
4. Enter email
5. Check email for magic link
6. Click link → should redirect back and be signed in

### 7.2 Test Payment Flow
1. Click "Upgrade to Pro"
2. Should show Stripe checkout
3. Use test card: `4242 4242 4242 4242`
4. Complete payment
5. Should redirect back
6. Check Supabase profiles table → `is_pro` should be true
7. App should show unlimited edits

### 7.3 Test Usage Limits
1. Sign out
2. Make 5 edits → should hit limit
3. Sign in with paid account → should have unlimited

---

## Troubleshooting

### Auth not working
- Check Supabase redirect URLs are correct
- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Clear browser cookies/localStorage

### Payment not updating user
- Check webhook is receiving events (Stripe Dashboard → Developers → Webhooks → Events)
- Check webhook signature is correct
- Check logs in Vercel deployment

### CORS errors
- Add your domain to Supabase allowed origins
- Settings → API → CORS Allowed Origins

---

## Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] Never commit API keys to Git
- [ ] Use `service_role` key only in API routes (server-side)
- [ ] Use `anon` key in client-side code
- [ ] Enable RLS on all Supabase tables
- [ ] Verify Stripe webhook signatures
- [ ] Use HTTPS in production
- [ ] Set proper CORS policies

---

## Cost Breakdown

### Free Tier Limits

**Supabase Free**:
- 50,000 MAU (Monthly Active Users)
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth

**What happens at limits**:
- Upgrade to Pro ($25/month) for 100k MAU
- Smooth scaling, no downtime

**Stripe**:
- No monthly fee
- 2.9% + $0.30 per transaction
- If you charge $4.99/month → Stripe takes $0.44 → You keep $4.55

**Example Revenue**:
- 10 paying users → $45.50/month revenue, $0 costs
- 100 paying users → $455/month revenue, $25 Supabase
- 1000 paying users → $4,550/month revenue, $25-100 Supabase

---

## Migration from localStorage

When users first sign in, migrate their data:

```typescript
// On first sign in after auth is added
if (user && !user.data_migrated) {
  // Get localStorage presets
  const presets = localStorage.getItem('custom_presets');

  if (presets) {
    // Upload to Supabase
    await supabase.from('user_presets').insert(JSON.parse(presets));

    // Mark as migrated
    await supabase.from('profiles')
      .update({ data_migrated: true })
      .eq('id', user.id);

    // Clear localStorage
    localStorage.removeItem('custom_presets');
  }
}
```

---

## Next Steps After Setup

1. Test with real users
2. Add user dashboard page
3. Add subscription management (cancel, update card)
4. Add usage analytics dashboard
5. Add preset cloud sync
6. Add preset marketplace

---

**Ready to implement? Let's go! 🚀**
