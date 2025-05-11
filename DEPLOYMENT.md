# Finance Advisor App Deployment Guide

This guide explains how to deploy your Finance Advisor application to Vercel, including both the Next.js frontend with Express backend, and the separate FastAPI backend.

## Deploying to Vercel (Next.js + Express)

The main application (Next.js frontend + Express backend) can be deployed to Vercel using the following steps:

1. Install the Vercel CLI if you haven't already:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Deploy the application from the project root:
   ```
   vercel
   ```

4. Follow the prompts. When asked about the settings, you can use the defaults or customize as needed.

5. Once deployed, Vercel will provide you with a URL for your application.

## Deploying the FastAPI Backend

The FastAPI backend needs to be deployed separately. You have several options:

### Option 1: Deploy to Vercel Serverless Functions

1. Create a separate Vercel project for the FastAPI backend:
   ```
   cd backend/fastapi_server
   vercel
   ```

2. Update the environment variables in the Vercel dashboard to include all required API keys and configuration.

### Option 2: Deploy to a Cloud Provider (Recommended)

For better performance with FastAPI, consider deploying to:

#### Railway

1. Install Railway CLI:
   ```
   npm i -g @railway/cli
   ```

2. Login and deploy:
   ```
   railway login
   cd backend/fastapi_server
   railway init
   railway up
   ```

#### Render

1. Create a new Web Service on Render.com
2. Connect your GitHub repository
3. Set the build command: `pip install -r requirements.txt`
4. Set the start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## Environment Variables

Make sure to set these environment variables in your Vercel and FastAPI deployments:

### Next.js + Express (Vercel)
- `PORT`: Port for Express server (set automatically by Vercel)
- `FRONTEND_URL`: URL of your deployed frontend
- `SUPABASE_URL`: Your Supabase URL
- `SUPABASE_KEY`: Your Supabase key
- Other API keys as needed

### FastAPI Backend
- `FRONTEND_URL`: URL of your deployed frontend
- `BACKEND_URL`: URL of your deployed Express backend
- `SUPABASE_URL`: Your Supabase URL
- `SUPABASE_KEY`: Your Supabase key
- `DEFAULT_GOOGLE_API_KEY`: Your Google API key
- `DEFAULT_ALPHA_VANTAGE_KEY`: Your Alpha Vantage API key

## Running Locally

To run the entire application locally (frontend + both backends):

```
pnpm dev:all
```

This will start:
- Next.js frontend on port 3000
- Express backend on port 5000
- FastAPI backend on port 8000

## Connecting the Services

After deployment, update the environment variables in each service to point to the correct URLs of the other services.
