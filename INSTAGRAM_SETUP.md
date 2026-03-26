# Instagram Feed Setup - One-Time Steps

## Step 1: Switch @nccbmsit to Professional Account
1. Open Instagram -> @nccbmsit -> Settings -> Account
2. Switch to Professional Account -> Choose "Creator"
3. This is free and does not change how the account looks publicly

## Step 2: Create a Meta Developer App
1. Go to developers.facebook.com and log in with the Facebook account linked to @nccbmsit
2. Click "Create App" -> Choose "Other" -> "Consumer"
3. App name: "NCC BMSIT Gallery"
4. Add product: "Instagram" -> "Instagram API with Instagram Login"

## Step 3: Get Your Short-Lived Token
1. In App Dashboard -> Instagram -> API Setup with Instagram Login
2. Under "Generate access tokens" -> click "Add Instagram Test User" -> add @nccbmsit
3. Click "Generate Token" -> copy the token (valid for 1 hour only)

## Step 4: Exchange for Long-Lived Token (60 days)
Open your browser and go to:

```
https://graph.instagram.com/access_token
  ?grant_type=ig_exchange_token
  &client_secret=YOUR_APP_SECRET
  &access_token=YOUR_SHORT_LIVED_TOKEN
```

Copy the access_token from the response. This is your long-lived token.

## Step 5: Add Token to Vercel
1. Vercel Dashboard -> Project -> Settings -> Environment Variables
2. Add: INSTAGRAM_TOKEN = your long-lived token
3. Add: CRON_SECRET = any random 32-character string
4. Go to Settings -> Git -> Deploy Hooks -> Create "instagram-refresh" -> copy URL
5. Add: DEPLOY_HOOK_URL = that URL

## Step 6: Trigger First Run
Visit in browser with your CRON_SECRET:

```
https://your-site.vercel.app/api/refresh-instagram
```

Header: Authorization: Bearer YOUR_CRON_SECRET

Or use curl:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-site.vercel.app/api/refresh-instagram
```

## After That - Nothing to Do
The cron runs every night at midnight IST.
It fetches new posts and refreshes the token.
The gallery updates itself.

## Token Emergency (if token expires)
Repeat Steps 3 and 4 to get a new long-lived token.
Update INSTAGRAM_TOKEN in Vercel Environment Variables.
Trigger a manual run as in Step 6.
