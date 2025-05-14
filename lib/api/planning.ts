import { toast } from '@/hooks/use-toast';

// Define types for planning data (should match backend/types)
export interface RetirementPlan {
  id?: string; // Optional: Used for updates
  user_id: string;
  retirement_age: number;
  desired_income: number;
  current_savings: number;
  monthly_contribution: number;
  investment_roi: number; // Expected annual ROI (%)
  created_at?: string;
  updated_at?: string;
}

export interface Budget {
  id?: string; // Optional: Used for updates
  user_id: string;
  month: string; // e.g., 'YYYY-MM'
  income: number;
  expenses: Record<string, number>; // Category: Amount
  savings_goal: number;
  created_at?: string;
  updated_at?: string;
}

export interface Goal {
  id?: string; // Optional: Used for updates
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string; // 'YYYY-MM-DD'
  priority: 'low' | 'medium' | 'high';
  created_at?: string;
  updated_at?: string;
}

export interface PlanningData {
  retirementPlans: RetirementPlan[];
  budgets: Budget[];
  goals: Goal[];
}

// Check if in development mode
const isDevMode = () => {
  return typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     process.env.NODE_ENV === 'development');
};

// Helper function to generate mock planning data for development mode
function getMockPlanningData(): PlanningData {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setFullYear(today.getFullYear() + 3);
  
  return {
    retirementPlans: [
      {
        user_id: 'dev-user',
        retirement_age: 65,
        desired_income: 75000,
        current_savings: 250000,
        monthly_contribution: 1500,
        investment_roi: 7,
        created_at: today.toISOString(),
        updated_at: today.toISOString()
      }
    ],
    budgets: [
      {
        user_id: 'dev-user',
        month: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
        income: 8500,
        expenses: {
          'Housing': 2500,
          'Transportation': 600,
          'Food': 800,
          'Utilities': 400,
          'Entertainment': 300,
          'Health': 200,
          'Other': 500
        },
        savings_goal: 1500,
        created_at: today.toISOString(),
        updated_at: today.toISOString()
      }
    ],
    goals: [
      {
        user_id: 'dev-user',
        name: 'Emergency Fund',
        target_amount: 25000,
        current_amount: 15000,
        target_date: futureDate.toISOString().split('T')[0],
        priority: 'high',
        created_at: today.toISOString(),
        updated_at: today.toISOString()
      },
      {
        user_id: 'dev-user',
        name: 'Down Payment',
        target_amount: 60000,
        current_amount: 20000,
        target_date: futureDate.toISOString().split('T')[0],
        priority: 'medium',
        created_at: today.toISOString(),
        updated_at: today.toISOString()
      }
    ]
  };
}

// Fetch all planning data for the user
export async function getPlanningData(): Promise<PlanningData | null> {
  try {
    // Development mode check - provide mock data if the server returns 500
    if (isDevMode()) {
      try {
        const response = await fetch('/api/planning');
        const text = await response.text();
        
        if (!response.ok) {
          console.warn('API error in development mode, returning mock planning data');
          return getMockPlanningData();
        }
        
        if (!text) {
          console.warn('Empty response in development mode, returning mock planning data');
          return getMockPlanningData();
        }
        
        const data: PlanningData = JSON.parse(text);
        return data;
      } catch (err) {
        console.warn('Error in development mode, returning mock planning data:', err);
        return getMockPlanningData();
      }
    }
    
    // Production mode - standard implementation
    const response = await fetch('/api/planning');
    const text = await response.text();
    if (!response.ok) {
      let errorData: { error?: string } = {};
      try {
        errorData = text ? JSON.parse(text) : {};
      } catch (e) {
        errorData = { error: text };
      }
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    if (!text) {
      throw new Error('Empty response from planning API.');
    }
    const data: PlanningData = JSON.parse(text);
    return data;
  } catch (error) {
    console.error('Error fetching planning data:', error);
    toast({
      title: 'Error Fetching Planning Data',
      description: error instanceof Error ? error.message : 'Could not load planning details.',
      variant: 'destructive',
    });
    
    // Even in production, if toast is shown, return null instead of throwing
    return null;
  }
}

// Save (create or update) a planning item
export async function savePlanningItem(type: 'retirement' | 'budget' | 'goal', data: RetirementPlan | Budget | Goal): Promise<any> {
  try {
    const response = await fetch('/api/planning', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, data }),
    });

    // Check if the response is ok before trying to parse JSON
    if (!response.ok) {
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        // Try to get more specific error from response body
        const errorResult = await response.json();
        errorMsg = errorResult.error || errorMsg;
      } catch (e) {
        // If parsing JSON fails, try reading as text
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMsg = errorText;
          }
        } catch (textError) {
          // Ignore if reading text also fails
        }
      }
      throw new Error(errorMsg);
    }

    // If response is ok, parse the JSON
    const result = await response.json();

    toast({
      title: 'Success',
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} data saved successfully.`,
    });
    return result.data; // Return the saved/updated data (including ID if new)
  } catch (error) {
    console.error(`Error saving ${type} data:`, error);
    toast({
      title: `Error Saving ${type.charAt(0).toUpperCase() + type.slice(1)} Data`,
      description: error instanceof Error ? error.message : `Could not save ${type} details.`,
      variant: 'destructive',
    });
    throw error; // Re-throw error to be handled by the caller if needed
  }
}

// Example specific save functions (optional, could use savePlanningItem directly)
export const saveRetirementPlan = (data: RetirementPlan) => savePlanningItem('retirement', data);
export const saveBudget = (data: Budget) => savePlanningItem('budget', data);
export const saveGoal = (data: Goal) => savePlanningItem('goal', data);

// Delete a planning item (retirement plan, budget, or goal)
export async function deletePlanningItem(type: 'retirement' | 'budget' | 'goal', id: string): Promise<void> {
  try {
    const response = await fetch(`/api/planning?type=${type}&id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        // Try to get more specific error from response body
        const errorResult = await response.json();
        errorMsg = errorResult.error || errorMsg;
      } catch (e) {
        // If parsing JSON fails, try reading as text
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMsg = errorText;
          }
        } catch (textError) {
          // Ignore if reading text also fails
        }
      }
      throw new Error(errorMsg);
    }

    toast({
      title: 'Success',
      description: `The ${type} has been deleted.`,
    });
  } catch (error) {
    console.error(`Error deleting ${type}:`, error);
    toast({
      title: `Error Deleting ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      description: error instanceof Error ? error.message : `Could not delete ${type}.`,
      variant: 'destructive',
    });
    throw error;
  }
}

// Specific delete functions
export async function deleteGoal(id: string): Promise<void> {
  return deletePlanningItem('goal', id);
}