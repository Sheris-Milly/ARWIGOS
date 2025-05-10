from fastapi import FastAPI, HTTPException, Depends, Header, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import requests # For fetching news
import yfinance as yf # For fetching stock prices
import os
import json
from datetime import datetime
import supabase
import random # Added



# Add LangChain agent and Google Gemini imports
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import AgentExecutor, create_react_agent # Example agent type, adjust as needed
from langchain.prompts import PromptTemplate # Keep PromptTemplate if needed for agents
from langchain.memory import ConversationBufferMemory # Keep memory if needed
from langchain.tools import Tool # For defining agent tools
# Add necessary imports for routing and agent creation
# Removed: initialize_agent, AgentType, LLMChain as they are unused. Redundant AgentExecutor import also handled.
from langchain.chains.router import MultiPromptChain
from langchain.chains.router.llm_router import LLMRouterChain, RouterOutputParser
from langchain.chains.router.multi_prompt_prompt import MULTI_PROMPT_ROUTER_TEMPLATE
from langchain.schema import ChatMessageHistory, HumanMessage, AIMessage # Added for history management

# Unused 'template' and 'prompt' variables removed.

# Initialize FastAPI app
app = FastAPI(title="Finance Advisor API", description="API for financial advice and portfolio planning")

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
supabase_client = supabase.create_client(supabase_url, supabase_key)

# Initialize Google Gemini LLM
llm = ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=os.getenv("GOOGLE_API_KEY"))

# --- Agent Setup --- 

# Define Tools

# API Configuration for News
NEWS_API_HOST = 'real-time-finance-data.p.rapidapi.com'
NEWS_API_KEY = os.getenv('RAPIDAPI_KEY') # Ensure this environment variable is set

def search_financial_news(query: str) -> str:
    """Searches for financial news for a given stock symbol or general query using real-time-finance-data API."""
    print(f"Searching news for: {query}")
    if not NEWS_API_KEY:
        return "Error: RAPIDAPI_KEY for news service is not configured."

    # Determine if the query is a stock symbol or a general search term
    # For simplicity, we'll use a general market trends endpoint if query is broad, 
    # or stock-news if it looks like a symbol (e.g., AAPL, MSFT).
    # A more robust solution might involve pattern matching or a flag.
    if query.isupper() and len(query) <= 5: # Basic check for a stock symbol
        url = f"https://{NEWS_API_HOST}/stock-news?symbol={query}&language=en"
    else:
        # Using market-trends for general queries, though it might not be a direct search by query term.
        # The API might need a different endpoint for general keyword search if available.
        # For now, this demonstrates using one of the available news endpoints.
        url = f"https://{NEWS_API_HOST}/market-trends?trend_type=most_actives&country=us&language=en" 
        # The above URL for market trends doesn't take a 'query' param directly for search.
        # It provides general market trends. If a direct keyword search is needed, the API endpoint/params would differ.
        # For this example, we'll return general market trends if not a symbol.
        print(f"Query '{query}' is not a symbol, fetching general market trends.")

    headers = {
        'x-rapidapi-key': NEWS_API_KEY,
        'x-rapidapi-host': NEWS_API_HOST
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors
        data = response.json()

        if data.get("status") == "OK" and data.get("data") and data["data"].get("news"):
            articles = data["data"]["news"]
            # Limit to 5 articles for brevity
            formatted_articles = [
                {
                    "title": article.get("article_title"),
                    "url": article.get("article_url"),
                    "source": article.get("source"),
                    "published_at": article.get("post_time_utc")
                }
                for article in articles[:5]
            ]
            return json.dumps(formatted_articles)
        elif data.get("status") != "OK":
            return f"Error from news API: {data.get('message', 'Unknown error')}"
        else:
            return f"No news articles found for '{query}' or in general market trends."

    except requests.exceptions.RequestException as e:
        print(f"Error fetching news for {query}: {e}")
        return f"Error fetching news for '{query}'. HTTP request failed: {str(e)}"
    except json.JSONDecodeError:
        print(f"Error decoding news API response for {query}.")
        return f"Error decoding news API response for '{query}'."
    except Exception as e:
        print(f"An unexpected error occurred while fetching news for {query}: {e}")
        return f"An unexpected error occurred while fetching news for '{query}'."

def get_stock_price(symbol: str) -> str:
    """Fetches the current stock price for a given ticker symbol using yfinance."""
    print(f"Fetching price for: {symbol}")
    try:
        ticker = yf.Ticker(symbol)
        todays_data = ticker.history(period='1d')
        if not todays_data.empty:
            latest_price = todays_data['Close'].iloc[-1]
            return f"The current price of {symbol} is ${latest_price:.2f}"
        else:
            # Attempt to get info if history is empty (e.g. for very recent IPOs or different market)
            info = ticker.info
            current_price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('previousClose')
            if current_price:
                return f"The current price of {symbol} is ${current_price:.2f}"
            else:
                return f"Could not retrieve current price for {symbol}. It might be delisted or an invalid ticker."
    except Exception as e:
        print(f"Error fetching stock price for {symbol}: {e}")
        return f"Error fetching stock price for {symbol}. Please ensure the ticker is correct and try again."

def analyze_portfolio(portfolio_details: str) -> str:
    """Analyzes a user's investment portfolio based on structured input (e.g., JSON string of holdings).
    This function outlines how portfolio data would be processed and how an LLM could provide insights.
    Input: portfolio_details (str) - A JSON string representing portfolio holdings, e.g.,
           '{"stocks": [{"ticker": "AAPL", "shares": 10, "purchase_price": 150}, {"ticker": "MSFT", "shares": 5, "purchase_price": 200}], "cash": 1000, "risk_tolerance": "medium"}'
    """
    print(f"Analyzing portfolio with details: {portfolio_details}")
    try:
        data = json.loads(portfolio_details)
        # Conceptual steps:
        # 1. Validate the structure of 'data'.
        # 2. For each stock, fetch current price using 'get_stock_price' or yfinance.
        # 3. Calculate current value of each holding and total portfolio value.
        # 4. Calculate unrealized gains/losses.
        # 5. Assess diversification (e.g., by sector, asset class - requires more data or assumptions).
        # 6. Evaluate against risk_tolerance if provided.
        # 7. LLM Integration: Pass a summary of the analysis (e.g., current holdings, performance, diversification metrics)
        #    to the LLM with a prompt like: "Given this portfolio analysis [{summary}], provide insights on its strengths,
        #    weaknesses, and potential areas for improvement according to a 'medium' risk tolerance."
        analysis_summary = f"Portfolio data received: {len(data.get('stocks', []))} stock(s), cash: {data.get('cash', 0)}. "
        analysis_summary += "Conceptual analysis would involve fetching current prices, calculating performance, and assessing diversification. "
        analysis_summary += "An LLM would then be used to provide qualitative insights and recommendations based on this data and the user's risk profile."
        return f"Portfolio analysis (conceptual): {analysis_summary} For a detailed analysis, this function would integrate with market data services and an LLM."
    except json.JSONDecodeError:
        return "Error: Invalid JSON format for portfolio details. Please provide a valid JSON string."
    except Exception as e:
        return f"Error during portfolio analysis: {str(e)}"

def create_financial_plan(plan_details: str) -> str:
    """Creates a personalized financial plan based on structured input (e.g., JSON string of financial goals, income, expenses).
    This function outlines how user data would be processed and how an LLM could generate a plan.
    Input: plan_details (str) - A JSON string, e.g.,
           '{"income": 75000, "expenses": 45000, "savings_goals": [{"name": "Retirement", "target_amount": 500000, "years": 20}, {"name": "House Down Payment", "target_amount": 50000, "years": 5}], "risk_tolerance": "growth"}'
    """
    print(f"Creating financial plan with details: {plan_details}")
    try:
        data = json.loads(plan_details)
        # Conceptual steps:
        # 1. Validate the structure of 'data'.
        # 2. Analyze income, expenses, and calculate disposable income/savings capacity.
        # 3. For each savings goal, determine required periodic contributions (this might involve financial formulas).
        # 4. Consider risk tolerance for investment recommendations within the plan.
        # 5. LLM Integration: Pass the structured financial data and calculated metrics to the LLM with a prompt like:
        #    "Generate a comprehensive financial plan for a user with the following profile: {data}. The plan should cover
        #    budgeting advice, savings strategies for stated goals, and investment recommendations aligned with their '{data.get('risk_tolerance', 'moderate')}' risk tolerance."
        plan_summary = f"Financial data received: Income {data.get('income', 'N/A')}, {len(data.get('savings_goals', []))} goal(s). "
        plan_summary += "Conceptual planning involves analyzing cash flow, goal setting, and risk assessment. "
        plan_summary += "An LLM would then generate a personalized financial plan including budgeting, savings, and investment strategies."
        return f"Financial plan creation (conceptual): {plan_summary} For a detailed plan, this function would use an LLM guided by financial planning principles and the provided user data."
    except json.JSONDecodeError:
        return "Error: Invalid JSON format for plan details. Please provide a valid JSON string."
    except Exception as e:
        return f"Error during financial plan creation: {str(e)}"

# --- New Specialist Tools --- 
def optimize_taxes(portfolio_info: str) -> str:
    """Provides advice on tax optimization strategies based on structured portfolio information.
    Input: portfolio_info (str) - JSON string, e.g., '{"holdings": [{"ticker": "XYZ", "basis": 100, "current_value": 80, "type": "stock"}], "tax_bracket": "22%"}'
    """
    print(f"Optimizing taxes for portfolio: {portfolio_info}")
    try:
        data = json.loads(portfolio_info)
        # Conceptual steps:
        # 1. Parse holdings, identify potential tax-loss harvesting opportunities.
        # 2. Consider asset location strategies (e.g., tax-efficient funds in taxable accounts).
        # 3. LLM Integration: "Given this portfolio {data}, suggest tax optimization strategies like tax-loss harvesting or asset location, explaining the benefits."
        advice_summary = "Conceptual tax optimization would analyze holdings for strategies like tax-loss harvesting. An LLM could explain these concepts and tailor advice."
        return f"Tax optimization advice (conceptual): {advice_summary}"
    except json.JSONDecodeError:
        return "Error: Invalid JSON format for portfolio information."
    except Exception as e:
        return f"Error during tax optimization: {str(e)}"

def assess_risk(risk_profile: str) -> str:
    """Assesses investment risk based on a structured user risk profile.
    Input: risk_profile (str) - JSON string, e.g., '{"age": 35, "investment_horizon_years": 20, "risk_tolerance_score": 7 (out of 10), "financial_goals": ["retirement"]}'
    """
    print(f"Assessing risk for profile: {risk_profile}")
    try:
        data = json.loads(risk_profile)
        # Conceptual steps:
        # 1. Analyze components of the risk profile (age, horizon, score, goals).
        # 2. LLM Integration: "Based on this risk profile {data}, assess the user's capacity and willingness to take investment risks. Suggest suitable asset allocation ranges."
        assessment_summary = "Conceptual risk assessment involves analyzing the user's profile. An LLM would interpret this to suggest appropriate risk levels and investment strategies."
        return f"Risk assessment (conceptual): {assessment_summary}"
    except json.JSONDecodeError:
        return "Error: Invalid JSON format for risk profile."
    except Exception as e:
        return f"Error during risk assessment: {str(e)}"

def generate_performance_chart(portfolio_history: str) -> str:
    """Generates data suitable for displaying a performance chart based on historical portfolio values.
    Input: portfolio_history (str) - JSON string representing historical data, e.g.,
           '[{"date": "2023-01-01", "value": 10000}, {"date": "2023-02-01", "value": 10200}, {"date": "2023-03-01", "value": 10150}]'
           Alternatively, could be transactions to calculate historical values.
    """
    print(f"Generating performance chart for data: {portfolio_history}")
    try:
        history = json.loads(portfolio_history)
        if not isinstance(history, list) or not all(isinstance(item, dict) and 'date' in item and 'value' in item for item in history):
            return "Error: Invalid format for portfolio_history. Expected a list of objects with 'date' and 'value'."

        labels = [item['date'] for item in history]
        values = [item['value'] for item in history]

        chart_data = {
            "type": "line",
            "data": {
                "labels": labels,
                "datasets": [
                    {
                        "label": "Portfolio Value Over Time",
                        "data": values,
                        "borderColor": "rgb(54, 162, 235)",
                        "backgroundColor": "rgba(54, 162, 235, 0.5)",
                        "fill": False,
                        "tension": 0.1
                    }
                ]
            },
            "options": {
                "responsive": True,
                "maintainAspectRatio": False,
                "plugins": {
                    "legend": {"position": "top"},
                    "title": {"display": True, "text": "Portfolio Performance"}
                },
                "scales": {
                    "y": {
                        "beginAtZero": False
                    }
                }
            }
        }
        return json.dumps(chart_data)
    except json.JSONDecodeError:
        return "Error: Invalid JSON format for portfolio history."
    except Exception as e:
        return f"Error generating performance chart: {str(e)}"
# --- End New Specialist Tools ---

search_tool = Tool(
    name="FinancialNewsSearch",
    func=search_financial_news,
    description="Searches for recent financial news, market trends, and economic indicators."
)

stock_price_tool = Tool(
    name="StockPriceCheck",
    func=get_stock_price,
    description="Gets the current stock price for a given ticker symbol."
)

portfolio_analysis_tool = Tool(
    name="PortfolioAnalyzer",
    func=analyze_portfolio,
    description="Analyzes a user's investment portfolio based on provided details (holdings, risk tolerance)."
)

financial_plan_tool = Tool(
    name="FinancialPlanner",
    func=create_financial_plan,
    description="Creates a personalized financial plan based on user's income, expenses, goals, risk tolerance, and time horizon."
)

# --- New Specialist Tool Objects ---
tax_optimization_tool = Tool(
    name="TaxOptimizer",
    func=optimize_taxes,
    description="Provides advice on tax optimization strategies like tax-loss harvesting and asset location."
)

risk_management_tool = Tool(
    name="RiskAssessor",
    func=assess_risk,
    description="Assesses the risk level of a portfolio or investment strategy based on user profile and market conditions."
)

performance_chart_tool = Tool(
    name="PerformanceChartGenerator",
    func=generate_performance_chart,
    description="Generates data suitable for displaying a performance chart of a portfolio or asset over time."
)
# --- End New Specialist Tool Objects ---

# Define Agent Memory (Instantiated per request for now)
def get_memory_for_history(chat_message_history: ChatMessageHistory) -> ConversationBufferMemory:
    return ConversationBufferMemory(
        chat_memory=chat_message_history,
        memory_key="chat_history", 
        return_messages=True
    )

# Define Agent Executors
market_analyst_tools = [search_tool, stock_price_tool]
portfolio_manager_tools = [portfolio_analysis_tool, stock_price_tool]
financial_planner_tools = [financial_plan_tool]
general_advisor_tools = [] # General advisor might not need specific tools initially
# --- New Specialist Tool Lists ---
tax_optimizer_tools = [tax_optimization_tool]
risk_manager_tools = [risk_management_tool]
performance_chart_tools = [performance_chart_tool]
# --- End New Specialist Tool Lists ---

# Note: Using REACT_DESCRIPTION agent type as an example. Choose the best type for your needs.
# You might need different prompts or agent types depending on the complexity.

def create_agent_executor(tools: List[Tool], memory: ConversationBufferMemory, system_prompt: str) -> AgentExecutor:
    # A basic ReAct agent prompt needs input, agent_scratchpad, and chat_history
    # Adjust the prompt template based on the chosen agent type and its requirements
    prompt = PromptTemplate.from_template(
        f"{system_prompt}\n\nTools available: {{tools}}\n\nConversation History:\n{{chat_history}}\n\nHuman: {{input}}\n\nThought: {{agent_scratchpad}}"
    )
    agent = create_react_agent(llm=llm, tools=tools, prompt=prompt)
    return AgentExecutor(agent=agent, tools=tools, memory=memory, verbose=True, handle_parsing_errors=True)

# System prompts for each agent
market_analyst_system_prompt = "You are a Market Analyst expert. Provide insights on market trends, financial news, and specific stock information using available tools."
portfolio_manager_system_prompt = "You are a Portfolio Manager expert. Analyze investment portfolios, suggest adjustments, and discuss asset allocation using available tools."
financial_planner_system_prompt = "You are a Financial Planner expert. Help users create financial plans, set savings goals, and manage budgets using available tools."
general_advisor_system_prompt = "You are a general AI financial advisor. Answer general financial questions, explain concepts, or provide information."
# --- New Specialist System Prompts ---
tax_optimizer_system_prompt = "You are a Tax Optimization expert. Provide advice on minimizing tax liabilities related to investments using available tools."
risk_manager_system_prompt = "You are a Risk Management expert. Assess investment risks and suggest mitigation strategies using available tools."
performance_chart_system_prompt = "You are a Performance Analyst. Generate data for performance charts based on user requests using available tools."
# --- End New Specialist System Prompts ---

# Unused aggregator_system_prompt removed.

# Define Destination Chains and Descriptions for Router
prompt_infos = [
    {
        "name": "Market Analyst",
        "description": "Good for answering questions about stock market news, specific stock prices, or market trends.",
        "tools": market_analyst_tools,
        "system_prompt": market_analyst_system_prompt
    },
    {
        "name": "Portfolio Manager",
        "description": "Good for answering questions about investment portfolio analysis, asset allocation, or rebalancing.",
        "tools": portfolio_manager_tools,
        "system_prompt": portfolio_manager_system_prompt
    },
    {
        "name": "Financial Planner",
        "description": "Good for answering questions about creating financial plans, budgeting, savings goals, or retirement planning.",
        "tools": financial_planner_tools,
        "system_prompt": financial_planner_system_prompt
    },
    # --- Add New Specialist Agents to Router Info ---
    {
        "name": "Tax Optimizer",
        "description": "Good for answering questions about tax implications of investments, tax-loss harvesting, or optimizing for taxes.",
        "tools": tax_optimizer_tools,
        "system_prompt": tax_optimizer_system_prompt
    },
    {
        "name": "Risk Manager",
        "description": "Good for answering questions about investment risk, portfolio risk assessment, or risk mitigation strategies.",
        "tools": risk_manager_tools,
        "system_prompt": risk_manager_system_prompt
    },
    {
        "name": "Performance Chart Generator",
        "description": "Good for requests to visualize portfolio or asset performance over time.",
        "tools": performance_chart_tools,
        "system_prompt": performance_chart_system_prompt
    },
    # --- End Add New Specialist Agents ---
    {
        "name": "General Advisor",
        "description": "Good for answering general financial questions or explaining concepts.",
        "tools": general_advisor_tools,
        "system_prompt": general_advisor_system_prompt
    }
]

# Function to create destination chains (AgentExecutors) dynamically
def create_destination_chains(chat_message_history: ChatMessageHistory) -> Dict[str, AgentExecutor]:
    destination_chains = {}
    # Create memory once for all agents in this request, initialized with fetched history
    memory = get_memory_for_history(chat_message_history) 
    for p_info in prompt_infos:
        name = p_info["name"]
        tools = p_info["tools"]
        system_prompt = p_info["system_prompt"]
        # Pass the shared memory instance to each agent executor
        destination_chains[name] = create_agent_executor(tools, memory, system_prompt)
    return destination_chains

# Default chain will be sourced from destination_executors.
# Initial default_chain_memory and default_chain creation removed.

# Set up the Router Chain (remains the same)
destinations = [f"{p['name']}: {p['description']}" for p in prompt_infos]
destinations_str = "\n".join(destinations)
router_template = MULTI_PROMPT_ROUTER_TEMPLATE.format(destinations=destinations_str)
router_prompt = PromptTemplate(
    template=router_template,
    input_variables=["input"],
    output_parser=RouterOutputParser(),
)
router_chain = LLMRouterChain.from_llm(llm, router_prompt)

# MultiPromptChain setup needs adjustment to handle dynamic creation of destination chains
# We will create the MultiPromptChain inside the request handler where history is available

# --- End Agent Setup ---


# Create a Pydantic model for chat input
class ChatInput(BaseModel):
    message: str
    context: Optional[Dict[Any, Any]] = None

# Create a Pydantic model for chat output
class ChatOutput(BaseModel):
    message: str
    agent_name: Optional[str] = None # To indicate which agent responded
    conversation_id: Optional[str] = None # Add conversation_id to the output model
    created_at: str

class ConversationCreate(BaseModel):
    title: str

class ConversationItem(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: Optional[str] = None

# Authentication dependency
async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # Verify token with Supabase
        # Use client.auth.get_user() which returns UserResponse object
        response = supabase_client.auth.get_user(token)
        
        # Check if user is present in the response data
        if response.user is None:
             raise HTTPException(status_code=401, detail="Invalid authentication token or user not found")

        return response.user # Return the user object directly
    except Exception as e:
        # Catch specific Supabase errors if possible, otherwise generic exception
        # Log the error for debugging
        print(f"Authentication error: {e}") 
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")

# Old LLM function (get_llm_for_user) removed.

# Placeholder function (get_agent_executor_for_user) removed.

# Routes
@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/chat", response_model=ChatOutput)
async def chat(
    chat_input: ChatInput,
    conversation_id: Optional[str] = None,
    user = Depends(get_current_user) # User object from Supabase
):
    user_id = user.id # Get user ID from the user object
    current_conversation_id = conversation_id # Store the initial ID
    
    try:
        # Get chat history as ChatMessageHistory object
        chat_message_history_obj = await get_chat_history(current_conversation_id)
        
        # Create destination chains (AgentExecutors) with memory for this request
        destination_executors = create_destination_chains(chat_message_history_obj)
        
        # Create the MultiPromptChain for this request
        # Note: The memory within the destination_executors is used by the agents.
        # MultiPromptChain itself doesn't directly use a shared memory object in this setup.
        multi_agent_chain = MultiPromptChain(
            router_chain=router_chain, 
            destination_chains=destination_executors, 
            default_chain=destination_executors["General Advisor"], # Use the General Advisor agent as default
            verbose=True
        )

        # Invoke the multi-agent chain
        # The input keys depend on the router and destination chains
        # Router needs 'input'. Destination agents need 'input' and 'chat_history'.
        # The MultiPromptChain should handle passing these correctly.
        response_data = multi_agent_chain.invoke({
            "input": chat_input.message
            # chat_history is now managed by the ConversationBufferMemory in each agent
        })

        # Extract response and agent name
        # AgentExecutor output is typically in the 'output' key
        agent_response = response_data.get("output", "Error: Could not get response from agent.") 
        # Router's chosen destination is in the main response dict if not using AgentExecutor directly
        agent_name = response_data.get("destination", "General Advisor") # Get routed agent name
        if not agent_name or agent_name == "default_chain":
             agent_name = "General Advisor"

        # Save message to Supabase
        timestamp = datetime.now().isoformat()
        
        if current_conversation_id:
            # Save to existing conversation
            message_data = {
                "conversation_id": current_conversation_id,
                "user_id": user_id,
                "user_message": chat_input.message,
                "ai_response": agent_response,
                "context": chat_input.context,
                "agent_name": agent_name, # Store agent name
                "created_at": timestamp
            }
            result = supabase_client.table("chat_messages").insert(message_data).execute()
            supabase_client.table("conversations").update(
                {"updated_at": timestamp}
            ).eq("id", current_conversation_id).execute()
        else:
            # Create a new conversation
            conversation_data = {
                "user_id": user_id,
                "title": chat_input.message[:50] + "..." if len(chat_input.message) > 50 else chat_input.message,
                "created_at": timestamp,
                "updated_at": timestamp
            }
            conv_result = supabase_client.table("conversations").insert(conversation_data).execute()
            new_conversation_id = conv_result.data[0]["id"]
            current_conversation_id = new_conversation_id # Update the ID for the response
            
            # Save message with new conversation ID
            message_data = {
                "conversation_id": new_conversation_id,
                "user_id": user_id,
                "user_message": chat_input.message,
                "ai_response": agent_response,
                "context": chat_input.context,
                "agent_name": agent_name, # Store agent name
                "created_at": timestamp
            }
            supabase_client.table("chat_messages").insert(message_data).execute()
        
        return {
            "message": agent_response,
            "agent_name": agent_name,
            "conversation_id": current_conversation_id, # Return the correct conversation ID
            "created_at": timestamp
        }
    except Exception as e:
        print(f"Error processing chat message: {e}") # Log the error
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing chat message: {str(e)}")

@app.post("/api/conversations", response_model=ConversationItem)
async def create_conversation(
    conversation_data: ConversationCreate,
    user = Depends(get_current_user)
):
    user_id = user.id
    
    try:
        timestamp = datetime.now().isoformat()
        data = {
            "user_id": user_id,
            "title": conversation_data.title,
            "created_at": timestamp,
            "updated_at": timestamp
        }
        
        result = supabase_client.table("conversations").insert(data).execute()
        # Add error handling for Supabase insert if needed
        
        return {
            "id": result.data[0]["id"],
            "title": result.data[0]["title"],
            "created_at": result.data[0]["created_at"],
            "updated_at": result.data[0]["updated_at"]
        }
    except Exception as e:
        print(f"Error creating conversation: {e}") # Log the error
        raise HTTPException(status_code=500, detail=f"Error creating conversation: {str(e)}")

@app.get("/api/conversations", response_model=List[ConversationItem])
async def get_conversations(user = Depends(get_current_user)):
    user_id = user.id
    
    try:
        result = supabase_client.table("conversations").select("*").eq("user_id", user_id).order("updated_at", desc=True).execute()
        # Add error handling for Supabase select if needed
        
        return result.data
    except Exception as e:
        print(f"Error fetching conversations: {e}") # Log the error
        raise HTTPException(status_code=500, detail=f"Error fetching conversations: {str(e)}")

@app.get("/api/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: str,
    user = Depends(get_current_user)
):
    user_id = user.id
    
    try:
        # First check if the conversation belongs to the user
        conv_result = supabase_client.table("conversations").select("*").eq("id", conversation_id).eq("user_id", user_id).execute()
        
        if not conv_result.data:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Get conversation messages
        messages_result = supabase_client.table("chat_messages").select("*").eq("conversation_id", conversation_id).order("created_at", desc=False).execute()
        
        return {
            "conversation": conv_result.data[0],
            "messages": messages_result.data
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching conversation messages: {e}") # Log the error
        raise HTTPException(status_code=500, detail=f"Error fetching conversation messages: {str(e)}")

@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user = Depends(get_current_user)
):
    user_id = user.id
    
    try:
        # First check if the conversation belongs to the user
        conv_result = supabase_client.table("conversations").select("*").eq("id", conversation_id).eq("user_id", user_id).execute()
        
        if not conv_result.data:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Delete the conversation (messages should cascade delete if set up in DB)
        supabase_client.table("conversations").delete().eq("id", conversation_id).execute()
        
        return {"success": True, "message": "Conversation deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting conversation: {e}") # Log the error
        raise HTTPException(status_code=500, detail=f"Error deleting conversation: {str(e)}")

@app.post("/api/financial-plan", response_model=Dict[str, Any])
async def generate_financial_plan(
    data: Dict[str, Any] = Body(...),
    user = Depends(get_current_user)
):
    user_id = user.id
    
    try:
        # Extract financial data
        income = data.get("income", 0)
        savings = data.get("savings", 0)
        expenses = data.get("expenses", 0)
        goals = data.get("goals", [])
        risk_tolerance = data.get("risk_tolerance", "moderate")
        time_horizon = data.get("time_horizon", "medium")

        # Use the main Gemini LLM for plan generation for now
        # TODO: Potentially route this to a specific Financial Planner Agent
        plan_llm = llm # Using the globally defined Gemini LLM
        
        # Create prompt for financial plan
        plan_prompt_text = f"""
        Generate a detailed financial plan based on the following information:
        
        Income: ${income} per year
        Current Savings: ${savings}
        Monthly Expenses: ${expenses}
        Financial Goals: {", ".join(goals)}
        Risk Tolerance: {risk_tolerance}
        Time Horizon: {time_horizon}
        
        Include the following sections in your plan:
        1. Executive Summary
        2. Savings and Investment Strategy
        3. Asset Allocation Recommendation
        4. Timeline for Goals
        5. Risk Management
        6. Next Steps and Action Items
        
        Format the response as a structured JSON object with these sections as keys.
        Ensure the output is valid JSON.
        """
        
        # Generate financial plan
        response = plan_llm.invoke(plan_prompt_text)
        plan_response_content = response.content
        
        # Parse response to ensure it's valid JSON
        try:
            # Attempt to strip markdown code block fences if present
            if plan_response_content.strip().startswith("```json"):
                plan_response_content = plan_response_content.strip()[7:-3].strip()
            elif plan_response_content.strip().startswith("```"):
                 plan_response_content = plan_response_content.strip()[3:-3].strip()
                 
            plan = json.loads(plan_response_content)
        except json.JSONDecodeError as json_err:
            print(f"JSON Decode Error: {json_err}")
            print(f"LLM Response causing error:\n{plan_response_content}")
            # If the LLM didn't return valid JSON, create a fallback structured response
            plan = {
                "Executive Summary": "Generated financial plan based on your inputs.",
                "Savings and Investment Strategy": "Detailed strategy available in the full plan.", # Keep it concise
                "Asset Allocation Recommendation": "Recommendations tailored to your profile.",
                "Timeline for Goals": "Custom timeline based on your financial goals.",
                "Risk Management": f"Recommendations aligned with your {risk_tolerance} risk tolerance.",
                "Next Steps and Action Items": "Follow the personalized investment strategy.",
                "RawResponse": plan_response_content # Include raw response for debugging
            }
        
        # Save plan to Supabase
        timestamp = datetime.now().isoformat()
        plan_data = {
            "user_id": user_id,
            "plan_data": plan, # Store the parsed or fallback JSON
            "input_data": data,
            "created_at": timestamp
        }
        
        result = supabase_client.table("financial_plans").insert(plan_data).execute()
        
        return {
            "plan": plan,
            "plan_id": result.data[0]["id"] if result.data else None,
            "created_at": timestamp
        }
    except Exception as e:
        print(f"Error generating financial plan: {e}") # Log the error
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating financial plan: {str(e)}")

@app.get("/api/financial-plans")
async def get_financial_plans(user = Depends(get_current_user)):
    user_id = user.id
    
    try:
        result = supabase_client.table("financial_plans").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        
        return {"plans": result.data}
    except Exception as e:
        print(f"Error fetching financial plans: {e}") # Log the error
        raise HTTPException(status_code=500, detail=f"Error fetching financial plans: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # import random # Moved to top of file
    port = int(os.getenv("FASTAPI_PORT", "8000"))
    # Ensure reload is False or handled carefully in production
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)


# Function to get chat history as ChatMessageHistory object
async def get_chat_history(conversation_id: str) -> ChatMessageHistory:
    history = ChatMessageHistory()
    if not conversation_id:
        return history
    try:
        messages_result = supabase_client.table("chat_messages")\
            .select("user_message, ai_response, agent_name")\ # Added agent_name for context if needed
            .eq("conversation_id", conversation_id)\
            .order("created_at", desc=False)\
            .limit(20) # Limit history length, e.g., last 10 pairs
            .execute()
        
        if messages_result.data:
            for msg in messages_result.data:
                if msg.get('user_message'):
                    history.add_user_message(msg['user_message'])
                if msg.get('ai_response'):
                    history.add_ai_message(msg['ai_response'])
        return history
    except Exception as e:
        print(f"Error fetching chat history: {e}")
        return history # Return empty history on error