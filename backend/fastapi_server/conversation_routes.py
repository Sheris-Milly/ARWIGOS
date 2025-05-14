"""
Conversation management routes for the advisory system
This module provides endpoints for managing conversations.
"""

import logging
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

# These will be set by main.py
supabase_client = None
get_current_user = None
UserWithKeys = None

# Create router but don't add routes yet
router = APIRouter(prefix="/conversations", tags=["conversations"])

# This will be used to track if the module is initialized
_initialized = False

# This will be set by main.py
def initialize(client, auth_func, user_class):
    global supabase_client, get_current_user, UserWithKeys, _initialized
    supabase_client = client
    get_current_user = auth_func
    UserWithKeys = user_class
    _initialized = True
    
    # Register all route handlers after dependencies are initialized
    setup_routes()

# Set up logging
logger = logging.getLogger(__name__)

# Function to setup routes after dependencies are initialized
def setup_routes():
    """Register all routes after dependencies are initialized"""
    # Check if we're initialized
    if not _initialized:
        logger.error("Cannot setup routes: module not initialized")
        return
    
    # GET /conversations/
    router.get("/", response_model=ConversationList)(
        lambda limit=Query(20, ge=1, le=100), offset=Query(0, ge=0), user=Depends(get_current_user): 
        list_conversations(user, limit, offset)
    )
    
    # GET /conversations/{conversation_id}
    router.get("/{conversation_id}", response_model=Conversation)(
        lambda conversation_id: get_conversation(conversation_id, Depends(get_current_user))
    )
    
    # DELETE /conversations/{conversation_id}
    router.delete("/{conversation_id}")(
        lambda conversation_id: delete_conversation(conversation_id, Depends(get_current_user))
    )
    
    # POST /conversations/{conversation_id}/clear
    router.post("/{conversation_id}/clear")(
        lambda conversation_id: clear_conversation(conversation_id, Depends(get_current_user))
    )
    
    # PUT /conversations/{conversation_id}/title
    router.put("/{conversation_id}/title")(
        lambda conversation_id, title: update_conversation_title(conversation_id, title, Depends(get_current_user))
    )
    
    # GET /conversations/{conversation_id}/messages
    router.get("/{conversation_id}/messages")(
        lambda conversation_id, limit=Query(100, ge=1, le=500), offset=Query(0, ge=0), 
        user=Depends(get_current_user): 
        get_conversation_messages(conversation_id, user, limit, offset)
    )

# Route handler functions


# Models
class Conversation(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    last_message: Optional[str] = None
    agent_name: Optional[str] = None


class ConversationList(BaseModel):
    conversations: List[Conversation]


# Define the route handler without the decorator
async def list_conversations(
    user: UserWithKeys,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Get the list of user's conversations"""
    try:
        # Get conversations from Supabase
        result = supabase_client.table("conversations")\
            .select("*")\
            .eq("user_id", user.id)\
            .order("updated_at", desc=True)\
            .limit(limit)\
            .offset(offset)\
            .execute()
        
        conversations = result.data if result.data else []
        
        # Get the last message for each conversation
        for conv in conversations:
            try:
                # Get the last message in each conversation
                last_msg = supabase_client.table("chat_messages")\
                    .select("ai_response, agent_name")\
                    .eq("conversation_id", conv["id"])\
                    .order("created_at", desc=True)\
                    .limit(1)\
                    .execute()
                
                if last_msg.data and len(last_msg.data) > 0:
                    conv["last_message"] = last_msg.data[0].get("ai_response", "")[:100] + "..." if len(last_msg.data[0].get("ai_response", "")) > 100 else last_msg.data[0].get("ai_response", "")
                    conv["agent_name"] = last_msg.data[0].get("agent_name")
            except Exception as e:
                logger.error(f"Failed to get last message for conversation {conv['id']}: {e}")
                conv["last_message"] = None
                conv["agent_name"] = None
        
        return {"conversations": conversations}
    except Exception as e:
        logger.error(f"Failed to list conversations: {e}")
        raise HTTPException(500, detail=f"Failed to list conversations: {str(e)}")


async def delete_conversation(
    conversation_id: str,
    user: UserWithKeys,
):
    """Delete a conversation and its messages"""
    try:
        # Verify conversation belongs to the user
        result = supabase_client.table("conversations")\
            .select("id")\
            .eq("id", conversation_id)\
            .eq("user_id", user.id)\
            .execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(404, detail="Conversation not found or not owned by user")
        
        # Delete messages first (foreign key constraint)
        supabase_client.table("chat_messages")\
            .delete()\
            .eq("conversation_id", conversation_id)\
            .execute()
        
        # Delete the conversation
        supabase_client.table("conversations")\
            .delete()\
            .eq("id", conversation_id)\
            .execute()
        
        return {"status": "success", "message": "Conversation deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete conversation: {e}")
        raise HTTPException(500, detail=f"Failed to delete conversation: {str(e)}")


async def clear_conversation(
    conversation_id: str,
    user: UserWithKeys,
):
    """Clear all messages in a conversation but keep the conversation"""
    try:
        # Verify conversation belongs to the user
        result = supabase_client.table("conversations")\
            .select("id")\
            .eq("id", conversation_id)\
            .eq("user_id", user.id)\
            .execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(404, detail="Conversation not found or not owned by user")
        
        # Delete all messages in the conversation
        supabase_client.table("chat_messages")\
            .delete()\
            .eq("conversation_id", conversation_id)\
            .execute()
        
        # Update the conversation's updated_at timestamp
        supabase_client.table("conversations")\
            .update({"updated_at": datetime.now().isoformat()})\
            .eq("id", conversation_id)\
            .execute()
        
        return {"status": "success", "message": "Conversation cleared"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to clear conversation: {e}")
        raise HTTPException(500, detail=f"Failed to clear conversation: {str(e)}")


async def update_conversation_title(
    conversation_id: str,
    title: str,
    user: UserWithKeys,
):
    """Update a conversation's title"""
    try:
        # Verify conversation belongs to the user
        result = supabase_client.table("conversations")\
            .select("id")\
            .eq("id", conversation_id)\
            .eq("user_id", user.id)\
            .execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(404, detail="Conversation not found or not owned by user")
        
        # Update the conversation's title
        supabase_client.table("conversations")\
            .update({"title": title, "updated_at": datetime.now().isoformat()})\
            .eq("id", conversation_id)\
            .execute()
        
        return {"status": "success", "message": "Conversation title updated"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update conversation title: {e}")
        raise HTTPException(500, detail=f"Failed to update conversation title: {str(e)}")


async def get_conversation_messages(
    conversation_id: UUID,
    user: UserWithKeys,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """Get the messages for a specific conversation"""
    try:
        # Verify conversation belongs to the user
        result = supabase_client.table("conversations")\
            .select("*")\
            .eq("id", str(conversation_id))\
            .eq("user_id", user.id)\
            .execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(404, detail="Conversation not found or not owned by user")
            
        # Get the conversation title
        conversation = result.data[0]
        
        # Get messages for the conversation
        messages_result = supabase_client.table("chat_messages")\
            .select("*")\
            .eq("conversation_id", str(conversation_id))\
            .order("created_at", desc=False)\
            .limit(limit)\
            .offset(offset)\
            .execute()
            
        messages = messages_result.data if messages_result.data else []
        
        # Return the conversation data and messages
        return {
            "conversation": conversation,
            "messages": messages
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get conversation messages: {e}")
        raise HTTPException(500, detail=f"Failed to get conversation messages: {str(e)}")


async def get_conversation(
    conversation_id: UUID,
    user: UserWithKeys,
):
    """Get a specific conversation"""
    try:
        # Get the conversation from Supabase
        result = supabase_client.table("conversations")\
            .select("*")\
            .eq("id", str(conversation_id))\
            .eq("user_id", user.id)\
            .limit(1)\
            .execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(404, detail="Conversation not found or not owned by user")
            
        conversation = result.data[0]
        
        # Get the last message for the conversation
        try:
            last_msg = supabase_client.table("chat_messages")\
                .select("ai_response, agent_name")\
                .eq("conversation_id", str(conversation_id))\
                .order("created_at", desc=True)\
                .limit(1)\
                .execute()
            
            if last_msg.data and len(last_msg.data) > 0:
                conversation["last_message"] = last_msg.data[0].get("ai_response", "")[:100] + "..." if len(last_msg.data[0].get("ai_response", "")) > 100 else last_msg.data[0].get("ai_response", "")
                conversation["agent_name"] = last_msg.data[0].get("agent_name")
        except Exception as e:
            logger.error(f"Failed to get last message for conversation {conversation_id}: {e}")
            conversation["last_message"] = None
            conversation["agent_name"] = None
        
        return conversation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get conversation: {e}")
        raise HTTPException(404, detail=f"Failed to get conversation: {str(e)}")
