# Important Notes for Supabase Version

## Free Tier Limitations
- Supabase free plan is generous for starting.
- Database, Auth, Storage work well on free plan.
- Edge Functions have monthly limits on free plan.
- For long-term reliable scheduling (years), you may later need:
  - Supabase Pro, or
  - An external free cron service (cron-job.org, EasyCron, etc.) that calls your Edge Function every few minutes.

## What works now
- User registration & login
- Profiles
- Creating Echoes
- Viewing Echo Vault
- Basic feed structure
- In-app delivery of Echoes (via the Edge Function)

## Next things you can add later
- Full messaging
- Stories
- Admin panel
- Email / WhatsApp delivery
- Verification payments
