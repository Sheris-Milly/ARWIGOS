from fastapi import FastAPI, HTTPException, Depends, Header, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
import os
import json
from datetime import datetime
import supabase
from langchain.chat_models import ChatOpenAI
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate

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

# Initialize LangChain components
template = """
You are an AI financial advisor with expertise in stock market investments, portfolio management, and financial planning.
Use your knowledge to provide helpful advice and insights based on the user's financial questions and goals.
Your responses should be informative, balanced, and tailored to help users make informed financial decisions.

Current conversation:
{history}
Human: {input}
AI Assistant:
"""

prompt = PromptTemplate(
    input_variables=["history", "input"],
    template=template
)

# Create a Pydantic model for chat input
class ChatInput(BaseModel):
    message: str
    context: Optional[Dict[Any, Any]] = None

# Create a Pydantic model for chat output
class ChatOutput(BaseModel):
    message: str
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
        response = supabase_client.auth.get_user(token)
        if "error" in response:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        
        return response["data"]["user"]
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")

# Create or get LLM instance for a user
def get_llm_for_user(user_id: str):
    try:
        llm = ChatOpenAI(
            temperature=0.7,
            model_name=os.getenv("OPENAI_MODEL_NAME", "gpt-3.5-turbo"),
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        
        memory = ConversationBufferMemory()
        conversation = ConversationChain(
            llm=llm,
            memory=memory,
            prompt=prompt,
            verbose=False
        )
        
        return conversation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error initializing AI model: {str(e)}")

# Routes
@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/chat", response_model=ChatOutput)
async def chat(
    chat_input: ChatInput,
    conversation_id: Optional[str] = None,
    user = Depends(get_current_user)
):
    user_id = user["id"]
    
    try:
        # Get conversation chain for the user
        conversation = get_llm_for_user(user_id)
        
        # Process the message
        response = conversation.predict(input=chat_input.message)
        
        # Save message to Supabase
        timestamp = datetime.now().isoformat()
        
        if conversation_id:
            # Save to existing conversation
            message_data = {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "user_message": chat_input.message,
                "ai_response": response,
                "context": chat_input.context,
                "created_at": timestamp
            }
            
            result = supabase_client.table("chat_messages").insert(message_data).execute()
            
            # Update conversation last activity
            supabase_client.table("conversations").update(
                {"updated_at": timestamp}
            ).eq("id", conversation_id).execute()
        else:
            # Create a new conversation
            conversation_data = {
                "user_id": user_id,
                "title": chat_input.message[:50] + "..." if len(chat_input.message) > 50 else chat_input.message,
                "created_at": timestamp,
                "updated_at": timestamp
            }
            
            conv_result = supabase_client.table("conversations").insert(conversation_data).execute()
            new_conversation_id = conv_result["data"][0]["id"]
            
            # Save message with new conversation ID
            message_data = {
                "conversation_id": new_conversation_id,
                "user_id": user_id,
                "user_message": chat_input.message,
                "ai_response": response,
                "context": chat_input.context,
                "created_at": timestamp
            }
            
            supabase_client.table("chat_messages").insert(message_data).execute()
        
        return {
            "message": response,
            "created_at": timestamp
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat message: {str(e)}")

@app.post("/api/conversations", response_model=ConversationItem)
async def create_conversation(
    conversation_data: ConversationCreate,
    user = Depends(get_current_user)
):
    user_id = user["id"]
    
    try:
        timestamp = datetime.now().isoformat()
        data = {
            "user_id": user_id,
            "title": conversation_data.title,
            "created_at": timestamp,
            "updated_at": timestamp
        }
        
        result = supabase_client.table("conversations").insert(data).execute()
        
        return {
            "id": result["data"][0]["id"],
            "title": result["data"][0]["title"],
            "created_at": result["data"][0]["created_at"],
            "updated_at": result["data"][0]["updated_at"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating conversation: {str(e)}")

@app.get("/api/conversations", response_model=List[ConversationItem])
async def get_conversations(user = Depends(get_current_user)):
    user_id = user["id"]
    
    try:
        result = supabase_client.table("conversations").select("*").eq("user_id", user_id).order("updated_at", desc=True).execute()
        
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching conversations: {str(e)}")

@app.get("/api/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: str,
    user = Depends(get_current_user)
):
    user_id = user["id"]
    
    try:
        # First check if the conversation belongs to the user
        conv_result = supabase_client.table("conversations").select("*").eq("id", conversation_id).eq("user_id", user_id).execute()
        
        if not conv_result["data"]:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Get conversation messages
        messages_result = supabase_client.table("chat_messages").select("*").eq("conversation_id", conversation_id).order("created_at", desc=False).execute()
        
        return {
            "conversation": conv_result["data"][0],
            "messages": messages_result["data"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching conversation messages: {str(e)}")

@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user = Depends(get_current_user)
):
    user_id = user["id"]
    
    try:
        # First check if the conversation belongs to the user
        conv_result = supabase_client.table("conversations").select("*").eq("id", conversation_id).eq("user_id", user_id).execute()
        
        if not conv_result["data"]:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Delete the conversation (messages should cascade delete)
        supabase_client.table("conversations").delete().eq("id", conversation_id).execute()
        
        return {"success": True, "message": "Conversation deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting conversation: {str(e)}")

@app.post("/api/financial-plan", response_model=Dict[str, Any])
async def generate_financial_plan(
    data: Dict[str, Any] = Body(...),
    user = Depends(get_current_user)
):
    user_id = user["id"]
    
    try:
        # Extract financial data
        income = data.get("income", 0)
        savings = data.get("savings", 0)
        expenses = data.get("expenses", 0)
        goals = data.get("goals", [])
        risk_tolerance = data.get("risk_tolerance", "moderate")
        time_horizon = data.get("time_horizon", "medium")
        
        # Get LLM for plan generation
        llm = ChatOpenAI(
            temperature=0.3,
            model_name=os.getenv("OPENAI_MODEL_NAME", "gpt-3.5-turbo"),
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # Create prompt for financial plan
        plan_prompt = f"""
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
        """
        
        # Generate financial plan
        response = llm.predict(input=plan_prompt)
        
        # Parse response to ensure it's valid JSON
        try:
            plan = json.loads(response)
        except json.JSONDecodeError:
            # If the LLM didn't return valid JSON, create a structured response manually
            plan = {
                "Executive Summary": "Generated financial plan based on your inputs.",
                "Savings and Investment Strategy": response[:500],
                "Asset Allocation Recommendation": "Please see detailed recommendations in the full plan.",
                "Timeline for Goals": "Custom timeline based on your financial goals.",
                "Risk Management": f"Recommendations aligned with your {risk_tolerance} risk tolerance.",
                "Next Steps and Action Items": "Follow the personalized investment strategy outlined in this plan."
            }
        
        # Save plan to Supabase
        timestamp = datetime.now().isoformat()
        plan_data = {
            "user_id": user_id,
            "plan_data": plan,
            "input_data": data,
            "created_at": timestamp
        }
        
        result = supabase_client.table("financial_plans").insert(plan_data).execute()
        
        return {
            "plan": plan,
            "plan_id": result["data"][0]["id"] if "data" in result and result["data"] else None,
            "created_at": timestamp
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating financial plan: {str(e)}")

@app.get("/api/financial-plans")
async def get_financial_plans(user = Depends(get_current_user)):
    user_id = user["id"]
    
    try:
        result = supabase_client.table("financial_plans").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        
        return {"plans": result["data"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching financial plans: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("FASTAPI_PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True) 