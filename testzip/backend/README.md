# Finance Advisor Backend

This repository contains the backend services for the Finance Advisor application, which provides financial data, portfolio management, and AI-driven financial advice.

## Architecture Overview

The backend consists of an Express.js server that handles user authentication, portfolio management, stock data, and integration with the AI advisor.

## Tech Stack

- **Express.js**: Main backend API for portfolio management and stock data 
- **Supabase**: Authentication and database
- **Socket.IO**: Real-time updates (optional)

## Prerequisites

- Node.js (v16+)
- Supabase account
- RapidAPI account (for Yahoo Finance API)

## Setup & Installation

### 1. Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
# Express Server Settings
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Supabase Settings
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Optional for admin operations

# RapidAPI Settings
RAPIDAPI_KEY=your-rapidapi-key
RAPIDAPI_HOST=yahoo-finance15.p.rapidapi.com

# Google AI Settings (Optional)
GOOGLE_API_KEY=your-google-ai-api-key
GEMINI_MODEL=gemini-pro
```

Make sure to replace placeholder values with your actual credentials.

### 2. Install Dependencies

```bash
# Install dependencies
npm install
# or
pnpm install
```

### 3. Start the Server

```bash
# Start the development server
npm run dev
# or
pnpm dev

# For production
npm start
```

The server will run on the port specified in your `.env` file (default: 5000).

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Portfolios
- `GET /api/portfolio` - Get all portfolios for a user
- `GET /api/portfolio/:id` - Get a specific portfolio
- `POST /api/portfolio` - Create a new portfolio
- `PUT /api/portfolio/:id` - Update a portfolio
- `DELETE /api/portfolio/:id` - Delete a portfolio

### Portfolio Stocks
- `POST /api/portfolio/:id/stocks` - Add a stock to a portfolio
- `PUT /api/portfolio/:portfolioId/stocks/:stockEntryId` - Update a stock in a portfolio
- `DELETE /api/portfolio/:portfolioId/stocks/:stockEntryId` - Remove a stock from a portfolio

### Stock Data
- `GET /api/stocks/quote/:ticker` - Get stock quote
- `GET /api/stocks/search` - Search stocks by keyword
- `GET /api/stocks/history/:ticker` - Get historical data for a stock
- `GET /api/stocks/popular/:type` - Get popular stocks (active, gainers, losers)

### News
- `GET /api/news/latest` - Get latest financial news
- `GET /api/news/stock/:ticker` - Get news for a specific stock

## Deployment

### Express.js Server Deployment

The Express.js server can be deployed to various platforms:

#### 1. Vercel

1. Create a `vercel.json` file in the backend directory:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

2. Deploy with Vercel CLI or connect to your GitHub repository

#### 2. Railway or Render

These platforms offer simple Node.js deployments:
1. Connect your GitHub repository
2. Configure the build settings:
   - Build command: `npm install`
   - Start command: `npm start`
3. Add the environment variables from your `.env` file

## Troubleshooting

### Common Issues

1. **Environment variable errors**:
   - Make sure your `.env` file is in the correct location (in the backend directory)
   - Check that the variable names match exactly what's expected in the code

2. **Authentication issues**:
   - Verify your Supabase URL and keys
   - Check that Supabase RLS policies are set up correctly

3. **API data not loading**:
   - Verify your RapidAPI key is active and has sufficient quota
   - Check for rate limiting or API service disruptions

## License

This project is licensed under the MIT License. 