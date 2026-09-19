# HRM ECHO ROOM (Supabase Version)

**Leave a message. Meet it in the future.**

This is a free-plan friendly version of HRM ECHO ROOM built with:

- **Frontend**: Next.js 14 + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)

## Why Supabase?
- Generous free tier
- No forced credit card for basic usage in most regions
- Auth + Database + Storage + Edge Functions included

## Project Structure
```
hrm-echo-room-supabase/
├── frontend/          # Next.js app
├── supabase/
│   ├── migrations/    # Database schema
│   └── functions/     # Edge Functions (Echo delivery)
├── docs/              # Setup guides
└── scripts/
```

## Quick Start
1. Create a free project at https://supabase.com
2. Run the SQL migration
3. Put your keys in `frontend/.env.local`
4. Deploy frontend to Vercel
5. Deploy Edge Function for Echo delivery

See `docs/SETUP.md` for full instructions.
