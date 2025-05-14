"use client"

import React, { useState, useEffect } from 'react';
import { listConversations, deleteConversation } from '@/lib/api/conversations';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, MessageSquare, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  agent_name?: string;
}

interface ConversationListProps {
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
  className?: string;
}

export function ConversationList({ 
  currentConversationId, 
  onSelectConversation, 
  onNewChat,
  className 
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const fetchConversations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First check localStorage for conversations saved by enhanced-finance-agent.tsx
      try {
        const localStorageConversations = localStorage.getItem('conversations');
        if (localStorageConversations) {
          const parsedConversations = JSON.parse(localStorageConversations);
          
          // Map to our expected format
          const mappedConversations = parsedConversations.map((conv: any) => ({
            id: conv.id,
            title: conv.title || 'Untitled Conversation',
            created_at: conv.createdAt || new Date().toISOString(),
            updated_at: conv.updatedAt || new Date().toISOString(),
            last_message: conv.lastMessage || (conv.messages && conv.messages.length > 0 ? 
                            conv.messages[conv.messages.length - 1].content.substring(0, 50) + '...' : ''),
            agent_name: 'Finance Advisor',
            message_count: conv.messageCount || (conv.messages ? conv.messages.length : 0),
          }));
          
          // Sort by most recent update
          const sortedConversations = mappedConversations.sort((a: Conversation, b: Conversation) => {
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          });
          
          setConversations(sortedConversations);
          console.log(`Loaded ${sortedConversations.length} conversations from localStorage`);
          setIsLoading(false);
          return; // Exit early since we found conversations
        }
      } catch (localStorageErr) {
        console.warn('Error loading from localStorage, falling back to other methods:', localStorageErr);
      }
      
      // Fallback: Handle development mode with session storage
      if (process.env.NODE_ENV === 'development') {
        try {
          const storedConversations = JSON.parse(sessionStorage.getItem('finance_advisor_conversations') || '[]') as Conversation[];
          // Sort by most recent update
          const sortedConversations = storedConversations.sort((a: Conversation, b: Conversation) => {
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          });
          setConversations(sortedConversations);
        } catch (e) {
          console.error('Error retrieving conversations from session storage:', e);
          setConversations([]);
        }
      } else {
        // Production mode with API
        const data = await listConversations();
        setConversations(data);
      }
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
      setError(err.message || 'Failed to load conversations');
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the conversation
    e.preventDefault(); // Ensure click doesn't propagate
    
    try {
      // First remove from local state for immediate UI feedback
      setConversations(prev => prev.filter(conv => conv.id !== id));
      
      // If the current conversation was deleted, start a new chat
      if (id === currentConversationId) {
        onNewChat();
      }
      
      // First try to delete from localStorage
      try {
        // Get conversations from localStorage
        const localStorageConversations = localStorage.getItem('conversations');
        if (localStorageConversations) {
          // Parse and filter out the one to delete
          const parsedConversations = JSON.parse(localStorageConversations);
          const updatedConversations = parsedConversations.filter((conv: any) => conv.id !== id);
          
          // Save the updated list back to localStorage
          localStorage.setItem('conversations', JSON.stringify(updatedConversations));
          console.log(`Deleted conversation ${id} from localStorage. Remaining: ${updatedConversations.length}`);
          setDeleteSuccess(true);
          
          // Trigger a refresh event
          const deleteEvent = new CustomEvent('conversation-saved');
          window.dispatchEvent(deleteEvent);
          
          return; // Exit early since we handled the deletion
        }
      } catch (localStorageErr) {
        console.warn('Error deleting from localStorage, trying alternative methods:', localStorageErr);
      }
      
      // Fallback: Handle direct session storage management in development mode
      if (process.env.NODE_ENV === 'development') {
        try {
          const storedConversations = JSON.parse(sessionStorage.getItem('finance_advisor_conversations') || '[]') as Conversation[];
          const updatedConversations = storedConversations.filter(conv => conv.id !== id);
          sessionStorage.setItem('finance_advisor_conversations', JSON.stringify(updatedConversations));
          console.log('Development mode: Deleted conversation from session storage:', id);
          setDeleteSuccess(true);
        } catch (e) {
          console.error('Error deleting conversation from session storage:', e);
        }
      } else {
        // Production mode: use the API
        await deleteConversation(id);
        console.log('Successfully deleted conversation from API:', id);
        setDeleteSuccess(true);
      }
    } catch (err: any) {
      console.error('Failed to delete conversation:', err);
      setError(err.message || 'Failed to delete conversation');
      // Even if API fails, keep the conversation deleted in the UI
    }
  };

  // Load conversations on component mount
  useEffect(() => {
    fetchConversations();

    // Listen for conversation saved events to refresh the list
    const handleConversationSaved = () => {
      console.log('Detected conversation saved, refreshing list...');
      fetchConversations();
    };

    // Add event listeners
    window.addEventListener('conversation-saved', handleConversationSaved);
    
    // Also refresh periodically to catch any missed conversations
    const refreshInterval = setInterval(() => {
      fetchConversations();
    }, 10000); // Refresh every 10 seconds

    return () => {
      // Clean up event listeners on unmount
      window.removeEventListener('conversation-saved', handleConversationSaved);
      clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    // Reset delete success state after 2 seconds
    if (deleteSuccess) {
      const timer = setTimeout(() => {
        setDeleteSuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [deleteSuccess]);

  // Format date (like "Today", "Yesterday", or "May 10")
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        <Skeleton className="h-9 w-full bg-muted" />
        <Skeleton className="h-9 w-full bg-muted" />
        <Skeleton className="h-9 w-full bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-sm text-red-500 p-2", className)}>
        {error}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center text-center p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30 h-32", className)}>
        <MessageSquare className="h-6 w-6 text-muted-foreground mb-2 opacity-70" />
        <p className="text-sm text-muted-foreground">No conversations yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Click "New Conversation" to get started</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {conversations.map((conversation) => (
        <motion.div 
          key={conversation.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="group relative"
        >
          <div className="relative">
            {/* Conversation item */}
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-left text-sm font-normal h-auto py-2 pr-8",
                conversation.id === currentConversationId 
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="flex flex-col w-full overflow-hidden">
                <div className="flex items-center w-full">
                  <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{conversation.title}</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1 ml-6">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{formatDate(conversation.updated_at)}</span>
                </div>
              </div>
            </Button>
            
            {/* Delete button - positioned absolutely outside of Button */}
            <div 
              className="h-7 w-7 text-destructive bg-background hover:bg-destructive/10 hover:cursor-pointer absolute right-1 top-1/2 -mt-3.5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => handleDeleteConversation(conversation.id, e)}
              aria-label="Delete conversation"
            >
              <Trash2 className="h-4 w-4" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
