import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Define the base URL for the FastAPI backend
const FASTAPI_BACKEND_URL = process.env.FASTAPI_BACKEND_URL || 'http://localhost:8000'; // Default to localhost:8000

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Unauthorized. Please sign in to view messages.' },
        { status: 401 }
      );
    }

    const token = session.access_token;
    const conversationId = params.id; // Get conversation ID from URL params

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Construct the FastAPI endpoint URL
    const fastApiUrl = `${FASTAPI_BACKEND_URL}/api/conversations/${conversationId}/messages`;

    // Forward the request to the FastAPI backend
    const fastApiResponse = await fetch(fastApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}` // Pass Supabase token
      },
    });

    // Handle FastAPI response
    if (!fastApiResponse.ok) {
      let errorDetail = 'Failed to get messages from advisor backend.';
      try {
        const errorData = await fastApiResponse.json();
        errorDetail = errorData.detail || errorDetail;
      } catch (e) {
        // Ignore if response is not JSON
      }
      console.error(`FastAPI backend error (${fastApiResponse.status}): ${errorDetail}`);
      // Return 404 specifically if FastAPI returned 404
      const status = fastApiResponse.status === 404 ? 404 : 500;
      return NextResponse.json(
        { error: `Advisor backend error: ${errorDetail}` },
        { status: status }
      );
    }

    const fastApiResult = await fastApiResponse.json();

    // Return the response from FastAPI
    // Expected format: { conversation: {...}, messages: [...] }
    return NextResponse.json(fastApiResult);

  } catch (error) {
    console.error('Error fetching conversation messages in Next.js API route:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching messages' },
      { status: 500 }
    );
  }
}