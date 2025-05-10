-- Enable RLS (Row Level Security)
alter table if exists public.profiles enable row level security;
alter table if exists public.portfolios enable row level security;
alter table if exists public.portfolio_stocks enable row level security;
alter table if exists public.portfolio_performance enable row level security;
alter table if exists public.stocks enable row level security;
alter table if exists public.stock_quotes enable row level security;
alter table if exists public.stock_history enable row level security;
alter table if exists public.stock_searches enable row level security;
alter table if exists public.popular_stocks enable row level security;
alter table if exists public.company_profiles enable row level security;
alter table if exists public.latest_news enable row level security;
alter table if exists public.stock_news enable row level security;
alter table if exists public.trending_news enable row level security;
alter table if exists public.news_bookmarks enable row level security;
alter table if exists public.conversations enable row level security;
alter table if exists public.chat_messages enable row level security;
alter table if exists public.financial_plans enable row level security;

-- Create profiles table to store user profile data
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text not null,
  first_name text,
  last_name text,
  phone text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone
);

-- Create portfolios table
create table if not exists public.portfolios (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  name text not null,
  description text,
  is_public boolean default false,
  total_value numeric(15, 2) default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone
);

-- Create stocks table to store stock information
create table if not exists public.stocks (
  id uuid default uuid_generate_v4() primary key,
  ticker text not null unique,
  name text,
  sector text,
  industry text,
  current_price numeric(15, 2),
  price_updated_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone
);

-- Create portfolio_stocks junction table
create table if not exists public.portfolio_stocks (
  id uuid default uuid_generate_v4() primary key,
  portfolio_id uuid references public.portfolios(id) on delete cascade not null,
  stock_id uuid references public.stocks(id) not null,
  quantity numeric not null,
  purchase_price numeric(15, 2) not null,
  purchase_date timestamp with time zone default now(),
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone,
  unique(portfolio_id, stock_id, purchase_date)
);

-- Create portfolio_performance table to track portfolio value over time
create table if not exists public.portfolio_performance (
  id uuid default uuid_generate_v4() primary key,
  portfolio_id uuid references public.portfolios(id) on delete cascade not null,
  value numeric(15, 2) not null,
  date timestamp with time zone default now()
);

-- Create stock_quotes table to cache stock quotes
create table if not exists public.stock_quotes (
  id uuid default uuid_generate_v4() primary key,
  ticker text not null,
  price numeric(15, 2),
  change numeric(15, 2),
  change_percent numeric(15, 2),
  volume bigint,
  market_cap numeric(20, 2),
  timestamp timestamp with time zone default now(),
  raw_data jsonb
);

-- Create stock_history table to cache historical data
create table if not exists public.stock_history (
  id uuid default uuid_generate_v4() primary key,
  ticker text not null,
  cache_key text not null unique,
  period text not null,
  interval text not null,
  history_data jsonb not null,
  timestamp timestamp with time zone default now()
);

-- Create stock_searches table to cache search results
create table if not exists public.stock_searches (
  id uuid default uuid_generate_v4() primary key,
  query text not null,
  results jsonb not null,
  timestamp timestamp with time zone default now()
);

-- Create popular_stocks table to cache popular stocks lists
create table if not exists public.popular_stocks (
  id uuid default uuid_generate_v4() primary key,
  type text not null, -- 'active', 'gainers', 'losers'
  stocks jsonb not null,
  timestamp timestamp with time zone default now()
);

-- Create company_profiles table to cache company profiles
create table if not exists public.company_profiles (
  id uuid default uuid_generate_v4() primary key,
  ticker text not null,
  profile_data jsonb not null,
  timestamp timestamp with time zone default now()
);

-- Create latest_news table to cache latest financial news
create table if not exists public.latest_news (
  id uuid default uuid_generate_v4() primary key,
  news_data jsonb not null,
  timestamp timestamp with time zone default now()
);

-- Create stock_news table to cache news for specific stocks
create table if not exists public.stock_news (
  id uuid default uuid_generate_v4() primary key,
  ticker text not null,
  news_data jsonb not null,
  timestamp timestamp with time zone default now()
);

-- Create trending_news table to cache trending financial news
create table if not exists public.trending_news (
  id uuid default uuid_generate_v4() primary key,
  news_data jsonb not null,
  timestamp timestamp with time zone default now()
);

-- Create news_bookmarks table for user's news bookmarks
create table if not exists public.news_bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  news_id text not null,
  title text not null,
  url text,
  ticker text,
  note text,
  created_at timestamp with time zone default now()
);

-- Create conversations table for chat history
create table if not exists public.conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone
);

-- Create chat_messages table for storing chat messages
create table if not exists public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  user_message text not null,
  ai_response text not null,
  context jsonb,
  created_at timestamp with time zone default now()
);

-- Create financial_plans table for storing generated plans
create table if not exists public.financial_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan_data jsonb not null,
  input_data jsonb not null,
  created_at timestamp with time zone default now()
);

-- Create RLS policies for profiles
create policy "Users can view their own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id);

-- Create RLS policies for portfolios
create policy "Users can view their own portfolios"
on public.portfolios for select
using (auth.uid() = user_id);

create policy "Users can create their own portfolios"
on public.portfolios for insert
with check (auth.uid() = user_id);

create policy "Users can update their own portfolios"
on public.portfolios for update
using (auth.uid() = user_id);

create policy "Users can delete their own portfolios"
on public.portfolios for delete
using (auth.uid() = user_id);

-- Create RLS policies for portfolio_stocks
create policy "Users can view stocks in their portfolios"
on public.portfolio_stocks for select
using (
  auth.uid() = (
    select user_id from public.portfolios
    where id = portfolio_id
  )
);

create policy "Users can add stocks to their portfolios"
on public.portfolio_stocks for insert
with check (
  auth.uid() = (
    select user_id from public.portfolios
    where id = portfolio_id
  )
);

create policy "Users can update stocks in their portfolios"
on public.portfolio_stocks for update
using (
  auth.uid() = (
    select user_id from public.portfolios
    where id = portfolio_id
  )
);

create policy "Users can delete stocks from their portfolios"
on public.portfolio_stocks for delete
using (
  auth.uid() = (
    select user_id from public.portfolios
    where id = portfolio_id
  )
);

-- Create RLS policies for portfolio_performance
create policy "Users can view their portfolio performance"
on public.portfolio_performance for select
using (
  auth.uid() = (
    select user_id from public.portfolios
    where id = portfolio_id
  )
);

-- Create RLS policies for news_bookmarks
create policy "Users can view their own news bookmarks"
on public.news_bookmarks for select
using (auth.uid() = user_id);

create policy "Users can create their own news bookmarks"
on public.news_bookmarks for insert
with check (auth.uid() = user_id);

create policy "Users can delete their own news bookmarks"
on public.news_bookmarks for delete
using (auth.uid() = user_id);

-- Create RLS policies for conversations
create policy "Users can view their own conversations"
on public.conversations for select
using (auth.uid() = user_id);

create policy "Users can create their own conversations"
on public.conversations for insert
with check (auth.uid() = user_id);

create policy "Users can update their own conversations"
on public.conversations for update
using (auth.uid() = user_id);

create policy "Users can delete their own conversations"
on public.conversations for delete
using (auth.uid() = user_id);

-- Create RLS policies for chat_messages
create policy "Users can view their own chat messages"
on public.chat_messages for select
using (auth.uid() = user_id);

create policy "Users can create their own chat messages"
on public.chat_messages for insert
with check (auth.uid() = user_id);

-- Create RLS policies for financial_plans
create policy "Users can view their own financial plans"
on public.financial_plans for select
using (auth.uid() = user_id);

create policy "Users can create their own financial plans"
on public.financial_plans for insert
with check (auth.uid() = user_id);

-- Create RLS policies for public data
create policy "Anyone can read stocks data"
on public.stocks for select
using (true);

create policy "Anyone can read stock quotes"
on public.stock_quotes for select
using (true);

create policy "Anyone can read stock history"
on public.stock_history for select
using (true);

create policy "Anyone can read stock searches"
on public.stock_searches for select
using (true);

create policy "Anyone can read popular stocks"
on public.popular_stocks for select
using (true);

create policy "Anyone can read company profiles"
on public.company_profiles for select
using (true);

create policy "Anyone can read latest news"
on public.latest_news for select
using (true);

create policy "Anyone can read stock news"
on public.stock_news for select
using (true);

create policy "Anyone can read trending news"
on public.trending_news for select
using (true);

-- Create function to handle new user profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 