create extension if not exists "pgcrypto";

create type booking_status as enum ('pending', 'accepted', 'rejected', 'completed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  bio text default '',
  city text default '',
  rating numeric default 0,
  review_count integer default 0,
  verified boolean default false,
  role text default 'renter',
  banned boolean default false,
  created_at timestamptz default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  city text not null,
  area text not null,
  price_per_day integer not null,
  security_deposit integer not null default 0,
  delivery text not null default 'pickup',
  availability text not null default 'available',
  available_from date not null,
  available_to date not null,
  images text[] not null default '{}',
  reports integer not null default 0,
  created_at timestamptz default now()
);

create table public.favorites (
  user_id uuid references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, listing_id)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  renter_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status booking_status not null default 'pending',
  note text default '',
  created_at timestamptz default now()
);

create table public.threads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  renter_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text not null,
  moderated boolean default false,
  created_at timestamptz default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'system',
  read boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.favorites enable row level security;
alter table public.bookings enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;

create policy "profiles are public" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "listings are public" on public.listings for select using (true);
create policy "owners manage own listings" on public.listings for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "favorites are private" on public.favorites for select using (auth.uid() = user_id);
create policy "users manage own favorites" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "booking participants can read" on public.bookings for select using (auth.uid() in (renter_id, owner_id));
create policy "renters create bookings" on public.bookings for insert with check (auth.uid() = renter_id);
create policy "participants update bookings" on public.bookings for update using (auth.uid() in (renter_id, owner_id));

create policy "thread participants can read" on public.threads for select using (auth.uid() in (renter_id, owner_id));
create policy "participants create threads" on public.threads for insert with check (auth.uid() in (renter_id, owner_id));

create policy "message participants can read" on public.messages
for select using (
  exists (
    select 1 from public.threads t
    where t.id = thread_id and auth.uid() in (t.renter_id, t.owner_id)
  )
);
create policy "message participants can insert" on public.messages
for insert with check (
  auth.uid() = sender_id and exists (
    select 1 from public.threads t
    where t.id = thread_id and auth.uid() in (t.renter_id, t.owner_id)
  )
);

create policy "reviews are public" on public.reviews for select using (moderated = false);
create policy "users create reviews" on public.reviews for insert with check (auth.uid() = from_user_id);

create policy "notifications are private" on public.notifications for select using (auth.uid() = user_id);
create policy "users update own notifications" on public.notifications for update using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

create policy "listing images are public" on storage.objects
for select using (bucket_id = 'listing-images');

create policy "authenticated users upload listing images" on storage.objects
for insert with check (bucket_id = 'listing-images' and auth.role() = 'authenticated');
