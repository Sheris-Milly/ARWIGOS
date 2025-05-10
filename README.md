
# ARWIGOS – Finance Advisor Application

**AI-powered Real-time Wealth Insights & Goals-Oriented Strategy**

ARWIGOS is a comprehensive financial management and advisory platform designed to empower users with intelligent tools for smarter financial decisions. It seamlessly combines portfolio tracking, real-time stock data, curated financial news, and AI-driven Agents to help users monitor, optimize, and grow their wealth with confidence.



## Features

- 🔐 **User Authentication**: Secure user signup, login, and profile management
- 📊 **Portfolio Management**: Track and manage multiple investment portfolios
- 📈 **Stock Data**: Real-time market data, stock quotes, and historical charts
- 📰 **Financial News**: Latest market news and company-specific updates
- 💬 **AI Advisor**: AI-powered financial advice and planning
- 📱 **Responsive Design**: Full mobile support

## Tech Stack

### Frontend
- Next.js 14+ (App Router)
- React
- Tailwind CSS
- shadcn/ui Components
- Recharts for data visualization

### Backend
- Express.js (Node.js)
- Supabase (Database & Auth)
- Google Gemini AI API

### Data Sources
- Financial APIs via RapidAPI

## Project Structure

```
finance-advisor/
├── app/                # Next.js application routes
├── components/         # React components
├── lib/                # Utility functions and shared code
│   ├── agents/         # AI advisor multi-agent system
│   └── supabase/       # Supabase client utilities
├── public/             # Static files
├── backend/            # Backend server code
│   ├── config/         # Configuration files
│   ├── routes/         # Express.js API routes
│   └── services/       # Business logic and services
└── middleware.ts       # Authentication middleware
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- Supabase account
- RapidAPI account (for financial data)
- Google AI API key (for Gemini)

### Local Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/finance-advisor.git
cd finance-advisor
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up Supabase**

- Create a new project at [supabase.com](https://supabase.com)
- Get your project URL and anon key from the project API settings
- Set up the following tables in SQL editor:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create portfolios table
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create stocks table
CREATE TABLE stocks (
  symbol TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  exchange TEXT,
  sector TEXT,
  industry TEXT,
  last_price DECIMAL,
  price_change DECIMAL,
  price_change_percent DECIMAL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create portfolio_stocks junction table
CREATE TABLE portfolio_stocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES portfolios ON DELETE CASCADE NOT NULL,
  stock_symbol TEXT REFERENCES stocks NOT NULL,
  shares DECIMAL NOT NULL,
  average_price DECIMAL NOT NULL,
  purchase_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (portfolio_id, stock_symbol)
);

-- Create conversations table for AI advisor
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_messages table for AI advisor
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

4. **Create environment variables**

Create a `.env.local` file in the root directory:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# RapidAPI for financial data
NEXT_PUBLIC_RAPIDAPI_KEY=your-rapidapi-key

# Google AI API (Gemini)
NEXT_PUBLIC_GOOGLE_API_KEY=your-google-ai-api-key

# Base URL for API calls
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

5. **Run the development server**

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

6. **Start the backend server** (Optional, for API routes)

```bash
cd backend
npm install
npm run dev
```

The backend server will run on [http://localhost:5000](http://localhost:5000)

## Deployment

### Frontend Deployment with Vercel

1. Push your code to a GitHub repository
2. Import your project to Vercel:
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "Add New" → "Project"
   - Select your repository
   - Configure the build settings:
     - Framework Preset: Next.js
     - Root Directory: ./
   - Add the environment variables from your .env.local file
   - Click "Deploy"

### Backend Deployment

For the Express.js server:

1. **Deploy to Vercel**
   - Create a new `vercel.json` file in the `backend` directory:
     ```json
     {
       "version": 2,
       "builds": [
         {
           "src": "index.js",
           "use": "@vercel/node"
         }
       ],
       "routes": [
         {
           "src": "/(.*)",
           "dest": "index.js"
         }
       ]
     }
     ```
   - Import the backend directory as a separate project in Vercel
   - Add the environment variables

2. **Alternative: Deploy to Railway or Render**
   - These platforms offer simple Node.js deployments with environment variables

### Database Management (Supabase)

Your Supabase project is already cloud-hosted. Remember to:

1. Set up Row Level Security (RLS) policies:
   - Go to your Supabase dashboard → Authentication → Policies
   - Create appropriate RLS policies for each table
   - Example policy for portfolios:
     ```sql
     CREATE POLICY "Users can only access their own portfolios"
     ON portfolios
     FOR ALL
     USING (auth.uid() = user_id);
     ```

2. Set up email templates for authentication:
   - Go to Authentication → Email Templates
   - Customize confirmation and password reset emails

3. Enable required auth providers:
   - Go to Authentication → Providers
   - Configure email/password and other providers as needed

## Troubleshooting

### Common Issues

1. **Authentication problems**:
   - Check that your Supabase URL and keys are correct
   - Ensure RLS policies are properly configured
   - Check browser console for CORS errors

2. **API data not loading**:
   - Verify your RapidAPI key is valid and has sufficient quota
   - Check network tab for API error responses

3. **Deployment issues**:
   - Ensure all environment variables are set in your deployment platform
   - Check build logs for any compilation errors

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Yahoo Finance API for market data
- OpenAI for the language model
- Supabase for database and authentication
- Next.js and Vercel for the frontend framework and hosting
