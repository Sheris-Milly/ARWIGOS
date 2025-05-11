import os
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, BaseSettings
import requests
import yfinance as yf
import pandas as pd
import matplotlib.pyplot as plt
import supabase

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import create_react_agent, AgentExecutor
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain.tools import Tool
from langchain.chains.router import LLMRouterChain
from langchain.chains.router.multi_prompt import MULTI_PROMPT_ROUTER_TEMPLATE
from langchain.chains.router.llm_router import RouterOutputParser
from langchain_community.chat_message_histories import ChatMessageHistory

# ---------------------------
# Load environment & settings
# ---------------------------
load_dotenv()  # must come first

class Settings(BaseSettings):
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"
    SUPABASE_URL: str
    SUPABASE_KEY: str
    # Default API keys (used as fallback if user doesn't have their own)
    DEFAULT_GOOGLE_API_KEY: str = ""
    DEFAULT_ALPHA_VANTAGE_KEY: str = "XBYMG2VY49SX4K21"
    ALPHA_VANTAGE_HOST: str = "www.alphavantage.co"
    GEMINI_MODEL: str = "gemini-2.0-flash"

    class Config:
        env_file = ".env"

settings = Settings()

# ---------------------------
# FastAPI app setup
# ---------------------------
app = FastAPI(
    title="Finance Advisor API",
    description="API for financial advice, portfolio analysis, and planning"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# mount static for chart images
app.mount("/static", StaticFiles(directory="static"), name="static")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------
# Globals (initialized on startup)
# ---------------------------
supabase_client: supabase.Client  # no assignment here
llm: ChatGoogleGenerativeAI
router_chain: LLMRouterChain
agent_destinations: Dict[str, AgentExecutor]

# ---------------------------
# Pydantic models
# ---------------------------
class ChatInput(BaseModel):
    message: str
    context: Optional[Dict[Any, Any]] = None

class ChatOutput(BaseModel):
    message: str
    agent_name: str
    conversation_id: str
    created_at: str

# ---------------------------
# Auth dependency
# ---------------------------
class UserWithKeys:
    def __init__(self, user_id, email, google_api_key, alpha_vantage_key):
        self.id = user_id
        self.email = email
        self.google_api_key = google_api_key
        self.alpha_vantage_key = alpha_vantage_key

async def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid auth token")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        resp = supabase_client.auth.get_user(token)
        if resp.user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Get user API keys from profiles table
        profile = supabase_client.table("profiles").select("google_api_key,alpha_vantage_key").eq("id", resp.user.id).single().execute()
        
        # Extract API keys or use defaults
        google_api_key = profile.data.get("google_api_key") if profile.data else ""
        alpha_vantage_key = profile.data.get("alpha_vantage_key") if profile.data else ""
        
        # If API keys are missing, check user metadata
        if not google_api_key and resp.user.user_metadata:
            google_api_key = resp.user.user_metadata.get("google_api_key", "")
        if not alpha_vantage_key and resp.user.user_metadata:
            alpha_vantage_key = resp.user.user_metadata.get("alpha_vantage_key", "")
        
        # Create enhanced user object with API keys
        return UserWithKeys(
            user_id=resp.user.id,
            email=resp.user.email,
            google_api_key=google_api_key or settings.DEFAULT_GOOGLE_API_KEY,
            alpha_vantage_key=alpha_vantage_key or settings.DEFAULT_ALPHA_VANTAGE_KEY
        )
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

# ---------------------------
# Chat history helper
# ---------------------------
async def get_chat_history(conversation_id: Optional[str]) -> ChatMessageHistory:
    history = ChatMessageHistory()
    if not conversation_id:
        return history
    try:
        rows = (
            supabase_client
            .table("chat_messages")
            .select("user_message,ai_response")
            .eq("conversation_id", conversation_id)
            .order("created_at", desc=False)
            .limit(50)
            .execute()
            .data
        )
        for row in rows:
            history.add_user_message(row["user_message"])
            history.add_ai_message(row["ai_response"])
    except Exception as e:
        logger.warning(f"Failed to fetch chat history: {e}")
    return history

# ---------------------------
# Tool implementations
# ---------------------------
def search_financial_news(query: str) -> Union[str, List[Dict[str, Any]]]:
    if not settings.DEFAULT_ALPHA_VANTAGE_KEY:
        return "News API key not configured."
    
    api_key = settings.DEFAULT_ALPHA_VANTAGE_KEY
    
    if query.isupper() and query.isalpha() and len(query) <= 5:
        url = f"https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers={query}&apikey={api_key}"
    else:
        url = f"https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey={api_key}"
    
    try:
        res = requests.get(url)
        res.raise_for_status()
        data = res.json()
        
        if not data or 'feed' not in data:
            return f"No articles found for '{query}'."
            
        arts = data['feed'][:5]
        return [{
            "title": a.get("title"),
            "url": a.get("url"),
            "source": a.get("source"),
            "published_at": a.get("time_published")
        } for a in arts] or f"No articles found for '{query}'."
    except Exception as e:
        logger.error(f"News fetch error for '{query}': {e}")
        return f"Error fetching news: {e}"    if not settings.DEFAULT_ALPHA_VANTAGE_KEY:
        return "News API key not configured."
    
    api_key = settings.DEFAULT_ALPHA_VANTAGE_KEY
    
    if query.isupper() and query.isalpha() and len(query) <= 5:
        url = f"https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers={query}&apikey={api_key}"
    else:
        url = f"https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey={api_key}"
    
    try:
        res = requests.get(url)
        res.raise_for_status()
        data = res.json()
        
        if not data or 'feed' not in data:
            return f"No articles found for '{query}'."
            
        arts = data['feed'][:5]
        return [{
            "title": a.get("title"),
            "url": a.get("url"),
            "source": a.get("source"),
            "published_at": a.get("time_published")
        } for a in arts] or f"No articles found for '{query}'."
    except Exception as e:
        logger.error(f"News fetch error for '{query}': {e}")
        return f"Error fetching news: {e}"

def get_stock_price(symbol: str) -> str:
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="1d")
        price = (hist["Close"].iloc[-1] if not hist.empty
                 else ticker.info.get("currentPrice") or ticker.info.get("regularMarketPrice"))
        return f"{symbol}: ${price:.2f}" if price else f"Price not available for {symbol}."
    except Exception as e:
        logger.error(f"Price fetch error for '{symbol}': {e}")
        return f"Error fetching price for {symbol}."

def analyze_portfolio(user_id: str) -> str:
    rows = supabase_client.table("portfolio")\
        .select("symbol,quantity,purchase_date")\
        .eq("user_id", user_id).execute().data
    if not rows:
        return "You have no holdings in your portfolio."
    total_val = 0.0
    details = []
    for r in rows:
        sym, qty = r["symbol"], r["quantity"]
        price = yf.Ticker(sym).history(period="1d")["Close"].iloc[-1]
        val = price * qty
        total_val += val
        details.append((sym, qty, price, val))
    lines = [f"{sym}: {qty} shares @ ${price:.2f} = ${val:.2f}"
             for sym, qty, price, val in details]
    alloc = [f"{sym}: {val/total_val:.1%}" for sym, _, _, val in details]
    return (
        f"Total Portfolio Value: ${total_val:.2f}\n\n"
        "Holdings:\n" + "\n".join(lines) + "\n\n"
        "Allocation:\n" + "\n".join(alloc)
    )

def create_financial_plan(user_id: str, user_llm=None) -> str:
    profile = supabase_client.table("user_profiles")\
        .select("age,goals,risk_tolerance")\
        .eq("user_id", user_id).single().execute().data
    if not profile:
        return "Please set up your profile (age, goals, risk tolerance) first."
    
    prompt = (
        f"Create a personalized financial plan for a client aged {profile['age']}, "
        f"goals: '{profile['goals']}', risk tolerance: '{profile['risk_tolerance']}'. "
        "Provide actionable steps and a timeline."
    )
    
    try:
        # Get user's API key if we don't have a user_llm
        if not user_llm:
            user_data = supabase_client.table("profiles")\
                .select("google_api_key")\
                .eq("id", user_id).single().execute().data
            
            if not user_data or not user_data.get("google_api_key"):
                return "Google API key is required to generate a financial plan. Please update your profile."
            
            # Create a temporary LLM with the user's API key
            user_llm = ChatGoogleGenerativeAI(
                model=settings.GEMINI_MODEL,
                google_api_key=user_data.get("google_api_key"),
                temperature=0.2
            )
        
        # Use the user's LLM to generate the plan
        return user_llm.predict(prompt)
    except Exception as e:
        logger.error(f"Financial plan error: {e}")
        return f"Error generating financial plan: {e}"

def assess_risk(user_id: str) -> str:
    rows = supabase_client.table("portfolio")\
        .select("symbol,quantity")\
        .eq("user_id", user_id).execute().data
    if not rows:
        return "No portfolio data to assess risk."
    frames = []
    for r in rows:
        hist = yf.Ticker(r["symbol"]).history(period="1y")["Close"] * r["quantity"]
        frames.append(hist.rename(r["symbol"]))
    df = pd.concat(frames, axis=1).fillna(method="ffill").dropna()
    port_val = df.sum(axis=1)
    vol = port_val.pct_change().dropna().std() * (252 ** 0.5)
    level = "low" if vol < 0.10 else "medium" if vol < 0.20 else "high"
    return f"Annualized volatility: {vol:.2%}. Risk profile: {level}."

def generate_performance_chart(user_id: str) -> str:
    rows = supabase_client.table("portfolio")\
        .select("symbol,quantity")\
        .eq("user_id", user_id).execute().data
    if not rows:
        return "No portfolio data to chart."
    frames = []
    for r in rows:
        hist = yf.Ticker(r["symbol"]).history(period="1y")["Close"] * r["quantity"]
        frames.append(hist.rename(r["symbol"]))
    df = pd.concat(frames, axis=1).fillna(method="ffill").dropna()
    df["Total"] = df.sum(axis=1)

    fig, ax = plt.subplots()
    df["Total"].plot(ax=ax)
    ax.set_title("Portfolio Value Over Last Year")
    ax.set_xlabel("Date")
    ax.set_ylabel("Value ($)")

    os.makedirs("static", exist_ok=True)
    filename = f"static/portfolio_perf_{user_id}.png"
    fig.savefig(filename, bbox_inches="tight")
    plt.close(fig)

    return f"{settings.BACKEND_URL}/static/{os.path.basename(filename)}"

# ---------------------------
# Agent setup helpers
# ---------------------------
def make_tool(name: str, func, desc: str) -> Tool:
    return Tool(name=name, func=func, description=desc)

def build_agents() -> Dict[str, AgentExecutor]:
    tools = {
        "NewsSearch":       make_tool("NewsSearch", search_financial_news, "Fetch financial news"),
        "PriceCheck":       make_tool("PriceCheck", get_stock_price, "Get stock price"),
        "AnalyzePortfolio": make_tool("AnalyzePortfolio", analyze_portfolio, "Analyze your portfolio"),
        "CreatePlan":       make_tool("CreatePlan", create_financial_plan, "Generate a financial plan"),
        "RiskAssessment":   make_tool("RiskAssessment", assess_risk, "Assess portfolio risk"),
        "PerformanceChart": make_tool("PerformanceChart", generate_performance_chart, "Generate performance chart"),
    }

    prompts = {
        "Market":    "You are a Market Analyst. Use NewsSearch and PriceCheck.",
        "Portfolio": "You are a Portfolio Manager. Use AnalyzePortfolio, RiskAssessment, PerformanceChart.",
        "Planner":   "You are a Financial Planner. Use CreatePlan.",
        "General":   "You are a General Finance Advisor. You may use any tool."
    }

    dests = {
        "Market":    ["NewsSearch", "PriceCheck"],
        "Portfolio": ["AnalyzePortfolio", "RiskAssessment", "PerformanceChart"],
        "Planner":   ["CreatePlan"],
        "General":   list(tools.keys()),
    }

    chains: Dict[str, AgentExecutor] = {}
    for name, keys in dests.items():
        selected = [tools[k] for k in keys]
        memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
        prompt_template_str = (
            f"{prompts[name]}\n\n"
            "You have access to the following tools:\n{tools}\n\n"
            "To use a tool, please use the following format:\n"
            "```\n"
            "Thought: Do I need to use a tool? Yes\n"
            "Action: the action to take, should be one of [{tool_names}]\n"
            "Action Input: the input to the action\n"
            "Observation: the result of the action\n"
            "```\n"
            "When you have a response to say to the Human, or if you do not need to use a tool, you MUST use the format:\n"
            "```\n"
            "Thought: Do I need to use a tool? No\n"
            "Final Answer: [your response here]\n"
            "```\n\n"
            "History:\n{chat_history}\n"
            "Human: {input}\n"
            "Thought:{agent_scratchpad}"
        )
        prompt = PromptTemplate.from_template(prompt_template_str)
        agent = create_react_agent(llm=llm, tools=selected, prompt=prompt)
        chains[name] = AgentExecutor(agent=agent, tools=selected, memory=memory, verbose=True)
    return chains

# ---------------------------
# Startup event
# ---------------------------
@app.on_event("startup")
async def on_startup():
    global supabase_client

    # verify env
    logger.info(f"Attempting to load Supabase credentials. SUPABASE_URL: {'set' if settings.SUPABASE_URL else 'NOT SET'}, SUPABASE_KEY: {'set' if settings.SUPABASE_KEY else 'NOT SET'}")
    if not settings.SUPABASE_URL:
        logger.error("CRITICAL: SUPABASE_URL is not set in environment variables. Please check your .env file.")
        raise RuntimeError("SUPABASE_URL not set. Server cannot start.")
    if not settings.SUPABASE_KEY:
        logger.error("CRITICAL: SUPABASE_KEY is not set in environment variables. Please check your .env file.")
        raise RuntimeError("SUPABASE_KEY not set. Server cannot start.")

    # Initialize Supabase client
    supabase_client = supabase.create_client(
        settings.SUPABASE_URL, settings.SUPABASE_KEY
    )
    
    # Create static directory for chart images if it doesn't exist
    os.makedirs("static", exist_ok=True)
    
    logger.info("FastAPI server started successfully")
    logger.info("User-specific API keys will be used for AI and data services")

# ---------------------------
# Health check
# ---------------------------
@app.get("/health")
async def health():
    return {"status": "ok"}

# ---------------------------
# Helper to create LLM with user's API key
# ---------------------------
def create_user_llm(google_api_key: str):
    if not google_api_key:
        raise ValueError("Google API key is required to use the AI advisor")
    
    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_MODEL,
        google_api_key=google_api_key,
        temperature=0.2,
        convert_system_message_to_human=True,
        safety_settings=[
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        ]
    )

# ---------------------------
# Create user-specific agents
# ---------------------------
def build_user_agents(user):
    # Create user-specific LLM with their API key
    user_llm = create_user_llm(user.google_api_key)
    
    # Create tools with user context
    tools = [
        make_tool(
            "search_financial_news",
            lambda query: search_financial_news(query, user.alpha_vantage_key),
            "Search for recent financial news articles. Useful for market updates and company news."
        ),
        make_tool(
            "get_stock_price",
            get_stock_price,
            "Get the current price of a stock. Input should be a valid ticker symbol (e.g., AAPL, MSFT)."
        ),
        make_tool(
            "analyze_portfolio",
            lambda: analyze_portfolio(user.id),
            "Analyze the user's investment portfolio for performance, allocation, and risk."
        ),
        make_tool(
            "create_financial_plan",
            lambda: create_financial_plan(user.id, user_llm),
            "Create a personalized financial plan based on the user's goals and risk tolerance."
        ),
        make_tool(
            "assess_risk",
            lambda: assess_risk(user.id),
            "Assess the risk level of the user's current investments and financial situation."
        ),
        make_tool(
            "generate_performance_chart",
            lambda: generate_performance_chart(user.id),
            "Generate a visual chart showing portfolio performance over time."
        ),
    ]
    
    # Create agent destinations with user's LLM
    destinations = {}
    
    # Financial Advisor Agent
    advisor_prompt = PromptTemplate.from_template(
        """You are an expert financial advisor. Answer questions about investments, 
        financial planning, and market trends. Use tools when appropriate.
        
        {chat_history}
        Human: {input}
        AI: """
    )
    advisor_agent = create_react_agent(user_llm, tools, advisor_prompt)
    destinations["financial_advisor"] = AgentExecutor(agent=advisor_agent, tools=tools)
    
    # Portfolio Manager Agent
    portfolio_prompt = PromptTemplate.from_template(
        """You are a portfolio management expert. Help analyze and optimize investment 
        portfolios, asset allocation, and risk management. Use tools when appropriate.
        
        {chat_history}
        Human: {input}
        AI: """
    )
    portfolio_agent = create_react_agent(user_llm, tools, portfolio_prompt)
    destinations["portfolio_manager"] = AgentExecutor(agent=portfolio_agent, tools=tools)
    
    # Market Analyst Agent
    market_prompt = PromptTemplate.from_template(
        """You are a market analysis expert. Provide insights on market trends, 
        economic indicators, and stock performance. Use tools when appropriate.
        
        {chat_history}
        Human: {input}
        AI: """
    )
    market_agent = create_react_agent(user_llm, tools, market_prompt)
    destinations["market_analyst"] = AgentExecutor(agent=market_agent, tools=tools)
    
    # Create router chain with user's LLM
    destinations_str = "\n".join([f"{k}: {v}" for k, v in {
        "financial_advisor": "Questions about financial advice, planning, budgeting, saving, debt management, retirement planning, or general financial guidance.",
        "portfolio_manager": "Questions about portfolio analysis, asset allocation, diversification, rebalancing, or specific investment holdings.",
        "market_analyst": "Questions about market trends, economic news, stock performance, sector analysis, or market forecasts."
    }.items()])
    
    router_template = MULTI_PROMPT_ROUTER_TEMPLATE.format(destinations=destinations_str)
    router_prompt = PromptTemplate(template=router_template, input_variables=["input"])
    router_chain = LLMRouterChain.from_llm(user_llm, router_prompt, RouterOutputParser())
    
    return destinations, router_chain

# ---------------------------
# Modified search_financial_news to use user's API key
# ---------------------------
def search_financial_news(query: str, api_key: str = None) -> Union[str, List[Dict[str, Any]]]:
    if not api_key:
        return "News API key not configured. Please add your RapidAPI key in your profile settings."
    
    host = settings.NEWS_API_HOST
    headers = {
        "x-rapidapi-key": api_key,
        "x-rapidapi-host": host,
    }
    
    if query.isupper() and query.isalpha() and len(query) <= 5:
        url = f"https://{host}/stock-news?symbol={query}&language=en"
    else:
        url = f"https://{host}/market-trends?trend_type=most_actives&country=us&language=en"
    
    try:
        res = requests.get(url, headers=headers)
        res.raise_for_status()
        arts = res.json().get("data", {}).get("news", [])[:5]
        return [{
            "title": a.get("article_title"),
            "url": a.get("article_url"),
            "source": a.get("source"),
            "published_at": a.get("post_time_utc")
        } for a in arts] or f"No articles found for '{query}'."
    except Exception as e:
        logger.error(f"News fetch error for '{query}': {e}")
        return f"Error fetching news: {e}"

# ---------------------------
# Chat endpoint
# ---------------------------
@app.post("/chat", response_model=ChatOutput)
async def chat_endpoint(
    chat: ChatInput,
    user=Depends(get_current_user),
    conversation_id: Optional[str] = None
):
    try:
        # Validate API keys
        if not user.google_api_key:
            raise HTTPException(
                status_code=400, 
                detail="Google API key is required. Please update your profile with a valid API key."
            )
        
        if not user.alpha_vantage_key:
            raise HTTPException(
                status_code=400, 
                detail="RapidAPI key is required. Please update your profile with a valid API key."
            )
        
        # Create a new conversation ID if not provided
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
        
        # Get chat history
        history = await get_chat_history(conversation_id)
        
        # Build user-specific agents with their API keys
        user_agents, user_router = build_user_agents(user)
        
        # Route to the appropriate agent
        route_result = user_router.invoke({"input": chat.message})
        agent_name = route_result["destination"]
        agent = user_agents.get(agent_name)
        
        if not agent:
            raise HTTPException(status_code=400, detail=f"Unknown agent: {agent_name}")
        
        # Invoke the agent with memory
        agent_response = agent.invoke({"input": chat.message, "chat_history": history.messages})
        response_text = agent_response["output"]
        
        # Save the conversation
        try:
            supabase_client.table("chat_messages").insert({
                "conversation_id": conversation_id,
                "user_id": user.id,
                "user_message": chat.message,
                "ai_response": response_text,
                "agent_name": agent_name,
                "created_at": datetime.now().isoformat()
            }).execute()
        except Exception as e:
            logger.error(f"Failed to save chat message: {e}")
        
        return ChatOutput(
            message=response_text,
            agent_name=agent_name,
            conversation_id=conversation_id,
            created_at=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
