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

// Fetch all planning data for the user
export async function getPlanningData(): Promise<PlanningData | null> {
  try {
    const response = await fetch('/api/planning');
    const text = await response.text();
    if (!response.ok) {
      let errorData = {};
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

// TODO: Add functions for deleting planning items if needed
// export async function deletePlanningItem(type: 'retirement' | 'budget' | 'goal', id: string): Promise<void> { ... }