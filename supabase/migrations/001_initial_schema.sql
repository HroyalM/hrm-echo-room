-- HRM ECHO ROOM - Initial Schema (Supabase / PostgreSQL)

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  display_name text,
  bio text,
  avatar_url text,
  cover_url text,
  location text,
  is_verified boolean default false,
  is_official_creator boolean default false,
  is_admin boolean default false,
  verification_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Posts
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text,
  media_urls text[],
  privacy text default 'public' check (privacy in ('public', 'friends', 'private')),
  like_count int default 0,
  comment_count int default 0,
  share_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Echoes (the core feature)
create table public.echoes (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  recipient_type text not null check (recipient_type in ('self', 'friend', 'multiple')),
  recipient_ids uuid[],
  recipient_emails text[],
  recipient_whatsapps text[],
  content text not null,
  media_urls text[],
  privacy text default 'private' check (privacy in ('public', 'friends', 'private')),
  scheduled_at timestamptz not null,
  timezone text default 'UTC',
  delivery_methods text[] default array['inapp'],
  status text default 'scheduled' check (status in ('scheduled', 'processing', 'delivered', 'failed', 'retrying', 'cancelled')),
  delivery_attempts int default 0,
  last_error text,
  delivered_at timestamptz,
  created_at timestamptz default now()
);

-- Notifications
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text,
  body text,
  data jsonb,
  read boolean default false,
  created_at timestamptz default now()
);

-- Basic RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.echoes enable row level security;
alter table public.notifications enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Posts policies
create policy "Public posts are viewable by everyone"
  on public.posts for select using (privacy = 'public' or author_id = auth.uid());

create policy "Users can create posts"
  on public.posts for insert with check (auth.uid() = author_id);

create policy "Users can update/delete own posts"
  on public.posts for all using (auth.uid() = author_id);

-- Echoes policies
create policy "Users can view own echoes or received ones"
  on public.echoes for select using (
    sender_id = auth.uid() or auth.uid() = any(recipient_ids)
  );

create policy "Users can create echoes"
  on public.echoes for insert with check (auth.uid() = sender_id);

create policy "Users can update own echoes"
  on public.echoes for update using (auth.uid() = sender_id);

-- Notifications
create policy "Users can view own notifications"
  on public.notifications for select using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update using (auth.uid() = user_id);

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
