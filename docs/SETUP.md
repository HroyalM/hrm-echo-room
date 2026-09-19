# HRM ECHO ROOM — Supabase Setup Guide (Beginner Friendly)

## 1. Create a Supabase project
1. Go to https://supabase.com and sign up (free).
2. Click "New Project".
3. Choose organization → name the project `hrm-echo-room`.
4. Set a strong database password (save it!).
5. Choose a region close to you.
6. Wait for the project to be ready (1–2 minutes).

## 2. Get your API keys
1. In Supabase dashboard go to **Project Settings** (gear icon) → **API**.
2. Copy:
   - Project URL
   - `anon` `public` key
3. Keep them ready.

## 3. Create the database tables
1. In Supabase go to **SQL Editor**.
2. Click **New query**.
3. Copy the entire content of `supabase/migrations/001_initial_schema.sql` and paste it.
4. Click **Run**.

## 4. Enable Authentication providers
1. Go to **Authentication** → **Providers**.
2. Enable **Email**.
3. (Optional) Enable Google if you want.

## 5. Create Storage buckets
1. Go to **Storage**.
2. Create a new bucket called `avatars` (public).
3. Create another bucket called `echo-media` (private or public as needed).

## 6. Frontend setup
1. Open the `frontend` folder.
2. Copy `.env.example` to `.env.local`.
3. Paste your Project URL and anon key.
4. Run:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 7. Deploy
- Frontend → Vercel (Root Directory = `frontend`)
- Edge Functions → deploy with Supabase CLI (see docs)

## Important notes
- Free tier has limits (good enough for starting).
- For reliable long-term Echo delivery you will later need a cron job (Supabase supports it on paid plans, or you can use an external free cron service calling your Edge Function).
