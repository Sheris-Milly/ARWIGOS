import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { processQuery, clearConversationHistory } from '@/lib/agents/multiAgentService';
import { UserInteraction } from '@/types/advisor';

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );

  try {
    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to use the advisor.' },
        { status: 401 }
      );
    }

    const user = session.user;
    
    const userId = user.id;
    const requestBody = await req.json();
    
    // Validate request body
    if (!requestBody.query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    const userInteraction: UserInteraction = {
      query: requestBody.query,
      context: requestBody.context || {}
    };
    
    // Get user's portfolio data if not provided in context
    if (!userInteraction.context?.portfolioData) {
      try {
        const { data: portfolios } = await supabase
          .from('portfolios')
          .select('*, portfolio_stocks(*, stock_details:stocks(*))')
          .eq('user_id', userId);
          
        if (portfolios) {
          userInteraction.context = {
            ...userInteraction.context,
            portfolioData: portfolios
          };
        }
      } catch (error) {
        console.error('Error fetching portfolio data:', error);
      }
    }
    
    // Process the query through the multi-agent system
    
    const agentResponses = await processQuery(userInteraction, userId);
    
    // Save the conversation to the database
    try {
      // First check if we have an existing conversation
      let conversationId = requestBody.conversationId;
      
      if (!conversationId) {
        // Create a new conversation
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: userId,
            title: userInteraction.query.substring(0, 50) + (userInteraction.query.length > 50 ? '...' : ''),
          })
          .select()
          .single();
        
        if (convError) {
          console.error('Error creating conversation:', convError);
        } else {
          conversationId = newConversation.id;
        }
      }
      
      if (conversationId) {
        // Add the message to the conversation
        await supabase
          .from('chat_messages')
          .insert({
            conversation_id: conversationId,
            user_id: userId,
            user_message: userInteraction.query,
            ai_response: agentResponses,
            context: userInteraction.context || {}
          });
          
        // Update conversation last activity
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
    
    return NextResponse.json({
      response: agentResponses,
      conversationId: requestBody.conversationId || null
    });
  } catch (error) {
    console.error('Error processing advisor request:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}

// DELETE handler to clear conversation history
export async function DELETE(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );

  try {
    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to use the advisor.' },
        { status: 401 }
      );
    }

    const user = session.user;
    
    const userId = user.id;
    
    // Clear conversation history from memory
    clearConversationHistory(userId);
    
    return NextResponse.json({
      success: true,
      message: 'Conversation history cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing conversation history:', error);
    return NextResponse.json(
      { error: 'An error occurred while clearing conversation history' },
      { status: 500 }
    );
  }
}