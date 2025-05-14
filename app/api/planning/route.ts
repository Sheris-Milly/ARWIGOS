import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { RetirementPlan, Budget, Goal } from '@/lib/api/planning';

// Helper function to get the Supabase client
function getSupabase() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;
  
  // Create a Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    }
  });
  
  // Set the session if tokens are available
  if (accessToken && refreshToken) {
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
  }
  
  return supabase;
}

// GET handler to fetch planning data
export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  
  try {
    // Get current user's session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Fetch retirement plans, budgets, and goals for the user
    const { data: retirementPlans, error: retirementError } = await supabase
      .from('retirement_plans')
      .select('*')
      .eq('user_id', userId);

    const { data: budgets, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId);

    const { data: goals, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    if (retirementError || budgetError || goalError) {
      console.error('Error fetching planning data:', { retirementError, budgetError, goalError });
      return NextResponse.json({ error: 'Failed to fetch planning data' }, { status: 500 });
    }

    return NextResponse.json({ 
      retirementPlans: retirementPlans || [], 
      budgets: budgets || [], 
      goals: goals || [] 
    });

  } catch (error) {
    console.error('Error in GET /api/planning:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

// POST handler to create/update planning data
export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  
  try {
    // Get current user's session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const { type, data } = await req.json(); // type: 'retirement', 'budget', 'goal'

    if (!type || !data) {
        return NextResponse.json({ error: 'Missing type or data in request body' }, { status: 400 });
    }

    let tableName: string;
    switch (type) {
      case 'retirement':
        tableName = 'retirement_plans';
        break;
      case 'budget':
        tableName = 'budgets';
        break;
      case 'goal':
        tableName = 'goals';
        break;
      default:
        return NextResponse.json({ error: 'Invalid planning type' }, { status: 400 });
    }

    // Add user_id to the data
    const dataToInsert = { ...data, user_id: userId };

    // Upsert logic: If an ID is provided, update; otherwise, insert.
    const { data: result, error } = await supabase
      .from(tableName)
      .upsert(dataToInsert)
      .select()
      .single();

    if (error) {
      console.error(`Error upserting ${type}:`, error);
      return NextResponse.json({ error: `Failed to save ${type} data` }, { status: 500 });
    }

    return NextResponse.json({ message: `${type} data saved successfully`, data: result });

  } catch (error) {
    console.error(`Error in POST /api/planning:`, error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

// DELETE handler for removing planning items
export async function DELETE(req: NextRequest) {
  const supabase = getSupabase();
  
  try {
    // Get current user's session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'Missing type or id parameter' }, { status: 400 });
    }

    let tableName: string;
    switch (type) {
      case 'retirement':
        tableName = 'retirement_plans';
        break;
      case 'budget':
        tableName = 'budgets';
        break;
      case 'goal':
        tableName = 'goals';
        break;
      default:
        return NextResponse.json({ error: 'Invalid planning type' }, { status: 400 });
    }

    // Ensure the user can only delete their own data
    const { error } = await supabase
      .from(tableName)
      .delete()
      .match({ id, user_id: userId });

    if (error) {
      console.error(`Error deleting ${type}:`, error);
      return NextResponse.json({ error: `Failed to delete ${type}` }, { status: 500 });
    }

    return NextResponse.json({ message: `${type} deleted successfully` });

  } catch (error) {
    console.error(`Error in DELETE /api/planning:`, error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}