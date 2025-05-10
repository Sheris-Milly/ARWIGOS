import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
// Remove old agent service import
// import { processQuery, clearConversationHistory } from '@/lib/agents/multiAgentService';
// import { UserInteraction } from '@/types/advisor'; // Keep if needed for context structure

// Define the base URL for the FastAPI backend
const FASTAPI_BACKEND_URL = process.env.FASTAPI_BACKEND_URL || 'http://localhost:8000'; // Default to localhost:8000

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
    // Get user session and token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user || !session.access_token) {
      console.error('Session error or missing token:', sessionError);
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to use the advisor.' },
        { status: 401 }
      );
    }

    const user = session.user;
    const token = session.access_token;
    const userId = user.id;
    const requestBody = await req.json();

    // Validate request body
    if (!requestBody.query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Prepare payload for FastAPI backend
    const fastApiPayload = {
      message: requestBody.query,
      context: requestBody.context || {},
      // Pass conversationId if it exists
    };
    const conversationId = requestBody.conversationId;

    // Construct the FastAPI endpoint URL
    let fastApiUrl = `${FASTAPI_BACKEND_URL}/api/chat`;
    if (conversationId) {
      fastApiUrl += `?conversation_id=${conversationId}`;
    }

    // Forward the request to the FastAPI backend
    const fastApiResponse = await fetch(fastApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Pass Supabase token
      },
      body: JSON.stringify(fastApiPayload),
    });

    // Handle FastAPI response
    if (!fastApiResponse.ok) {
      let errorDetail = 'Failed to get response from advisor backend.';
      try {
        const errorData = await fastApiResponse.json();
        errorDetail = errorData.detail || errorDetail;
      } catch (e) {
        // Ignore if response is not JSON
      }
      console.error(`FastAPI backend error (${fastApiResponse.status}): ${errorDetail}`);
      return NextResponse.json(
        { error: `Advisor backend error: ${errorDetail}` },
        { status: fastApiResponse.status }
      );
    }

    const fastApiResult = await fastApiResponse.json();

    // Return the response from FastAPI
    // The FastAPI response should already contain { message, agent_name, conversation_id, created_at }
    return NextResponse.json(fastApiResult);

    // --- Remove old logic --- 
    // const userInteraction: UserInteraction = {
    //   query: requestBody.query,
    //   context: requestBody.context || {}
    // };
    // ... (fetching portfolio data removed, context is passed directly) ...
    // const agentResponses = await processQuery(userInteraction, userId);
    // ... (saving conversation logic removed, FastAPI handles this) ...
    // return NextResponse.json({
    //   response: agentResponses,
    //   conversationId: requestBody.conversationId || null
    // });
    // --- End Remove old logic ---

  } catch (error) {
    console.error('Error processing advisor request in Next.js API route:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}

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
    // Get user session and token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user || !session.access_token) {
      console.error('Session error or missing token for DELETE:', sessionError);
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const token = session.access_token;

    // Call FastAPI backend to clear history
    // Ensure FASTAPI_BACKEND_URL is defined in the scope (it is at the top of the file).
    const fastApiUrl = `${FASTAPI_BACKEND_URL}/api/chat/history`; 

    const fastApiResponse = await fetch(fastApiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!fastApiResponse.ok) {
      let errorDetail = 'Failed to clear history via advisor backend.';
      try {
        const errorData = await fastApiResponse.json();
        errorDetail = errorData.detail || errorDetail;
      } catch (e) {
        // Ignore if response is not JSON
      }
      console.error(`FastAPI backend error during history clear (${fastApiResponse.status}): ${errorDetail}`);
      return NextResponse.json(
        { error: `Advisor backend error: ${errorDetail}` },
        { status: fastApiResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation history cleared successfully via backend.'
    });

  } catch (error) {
    console.error('Error in Next.js DELETE handler for chat history:', error);
    return NextResponse.json(
      { error: 'An error occurred while clearing conversation history' },
      { status: 500 }
    );
  }
}