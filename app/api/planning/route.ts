import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { RetirementPlan, Budget, Goal } from '@/lib/api/planning';

async function getSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient(
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
}

async function getUser(supabase: ReturnType<typeof createServerClient>) {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.user) {
    return null;
  }
  return session.user;
}

// GET handler to fetch planning data
export async function GET(req: NextRequest) {
  const supabase = getSupabaseClient();
  const user = await getUser(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  try {
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

    return NextResponse.json({ retirementPlans, budgets, goals });

  } catch (error) {
    console.error('Error in GET /api/planning:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

// POST handler to create/update planning data
export async function POST(req: NextRequest) {
  const supabase = getSupabaseClient();
  const user = await getUser(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const { type, data } = await req.json(); // type: 'retirement', 'budget', 'goal'

  if (!type || !data) {
      return NextResponse.json({ error: 'Missing type or data in request body' }, { status: 400 });
  }

  try {
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
    // Supabase upsert handles this if the primary key is included in `data`.
    // Ensure your table has appropriate constraints (e.g., unique constraint on user_id if only one plan/budget/goal set per user is allowed, or use specific IDs).
    const { data: result, error } = await supabase
      .from(tableName)
      .upsert(dataToInsert)
      .select()
      .single(); // Assuming upsert returns the affected row

    if (error) {
      console.error(`Error upserting ${type}:`, error);
      return NextResponse.json({ error: `Failed to save ${type} data` }, { status: 500 });
    }

    return NextResponse.json({ message: `${type} data saved successfully`, data: result });

  } catch (error) {
    console.error(`Error in POST /api/planning (${type}):`, error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

// You might need PUT/DELETE handlers as well depending on requirements
// PUT handler for updating specific items
// DELETE handler for removing items