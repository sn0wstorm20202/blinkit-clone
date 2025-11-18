-- Enable extensions required for UUID generation
create extension if not exists pgcrypto;

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  address jsonb,
  phone text,
  created_at timestamp with time zone default now()
);

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon_url text,
  created_at timestamp with time zone default now()
);

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  category_id uuid references public.categories(id) on delete set null,
  category text,
  weight text,
  stock_quantity integer default 0,
  is_available boolean default true,
  created_at timestamp with time zone default now()
);

-- Cart Items
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  quantity integer not null default 1,
  created_at timestamp with time zone default now(),
  unique(user_id, product_id)
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  total_amount numeric(10,2) not null,
  status text default 'pending',
  delivery_address jsonb not null,
  payment_status text default 'pending',
  created_at timestamp with time zone default now()
);

-- Order Items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  quantity integer not null,
  price_at_time numeric(10,2) not null,
  created_at timestamp with time zone default now()
);

-- Addresses (for multiple saved addresses per user)
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  full_name text not null,
  phone_number text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  is_default boolean default false,
  created_at timestamp with time zone default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.addresses enable row level security;

-- Profiles policies
drop policy if exists "Profiles: users can view own profile" on public.profiles;
create policy "Profiles: users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles: users can update own profile" on public.profiles;
create policy "Profiles: users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Profiles: insert own profile" on public.profiles;
create policy "Profiles: insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Categories & Products are readable by everyone
drop policy if exists "Categories: read for all" on public.categories;
create policy "Categories: read for all"
  on public.categories for select
  using (true);

drop policy if exists "Products: read for all" on public.products;
create policy "Products: read for all"
  on public.products for select
  using (true);

-- Cart items policies
drop policy if exists "Cart: users view own" on public.cart_items;
create policy "Cart: users view own"
  on public.cart_items for select
  using (auth.uid() = user_id);

drop policy if exists "Cart: users insert own" on public.cart_items;
create policy "Cart: users insert own"
  on public.cart_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "Cart: users update own" on public.cart_items;
create policy "Cart: users update own"
  on public.cart_items for update
  using (auth.uid() = user_id);

drop policy if exists "Cart: users delete own" on public.cart_items;
create policy "Cart: users delete own"
  on public.cart_items for delete
  using (auth.uid() = user_id);

-- Orders policies
drop policy if exists "Orders: users view own" on public.orders;
create policy "Orders: users view own"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "Orders: users insert own" on public.orders;
create policy "Orders: users insert own"
  on public.orders for insert
  with check (auth.uid() = user_id);

drop policy if exists "Orders: users update own" on public.orders;
create policy "Orders: users update own"
  on public.orders for update
  using (auth.uid() = user_id);

-- Order items policies
drop policy if exists "OrderItems: users view" on public.order_items;
create policy "OrderItems: users view"
  on public.order_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  ));

drop policy if exists "OrderItems: users insert" on public.order_items;
create policy "OrderItems: users insert"
  on public.order_items for insert
  with check (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  ));

-- Addresses policies
drop policy if exists "Addresses: users view own" on public.addresses;
create policy "Addresses: users view own"
  on public.addresses for select
  using (auth.uid() = user_id);

drop policy if exists "Addresses: users insert own" on public.addresses;
create policy "Addresses: users insert own"
  on public.addresses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Addresses: users update own" on public.addresses;
create policy "Addresses: users update own"
  on public.addresses for update
  using (auth.uid() = user_id);

drop policy if exists "Addresses: users delete own" on public.addresses;
create policy "Addresses: users delete own"
  on public.addresses for delete
  using (auth.uid() = user_id);

-- Profile auto-population on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do update
  set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
