'use client'

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BudgetPlanner } from "./budget-planner"
import { GoalTracker } from "./goal-tracker"
import { RetirementCalculator } from "./retirement-calculator"
import { getPlanningData, PlanningData } from '@/lib/api/planning';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

export function PlanningContent() {
  const [planningData, setPlanningData] = useState<PlanningData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getPlanningData();
        setPlanningData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load planning data.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-10 w-1/3" /> {/* Skeleton for TabsList */}
        <Skeleton className="h-64 w-full" /> {/* Skeleton for Tab Content */}
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-600">Error loading planning data: {error}</div>;
  }

  // Ensure planningData is not null and has the expected arrays, provide defaults if needed
  const safePlanningData: PlanningData = planningData ?? { retirementPlans: [], budgets: [], goals: [] }; 

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6">
      <h2 className="text-2xl font-bold tracking-tight">Financial Planning</h2>
      <Tabs defaultValue="budget" className="space-y-4">
        <TabsList>
          <TabsTrigger value="budget">Budget Planner</TabsTrigger>
          <TabsTrigger value="goals">Goal Tracker</TabsTrigger>
          <TabsTrigger value="retirement">Retirement Calculator</TabsTrigger>
        </TabsList>
        <TabsContent value="budget" className="space-y-4">
          <BudgetPlanner initialBudgets={safePlanningData.budgets} />
        </TabsContent>
        <TabsContent value="goals" className="space-y-4">
          <GoalTracker initialGoals={safePlanningData.goals} />
        </TabsContent>
        <TabsContent value="retirement" className="space-y-4">
          <RetirementCalculator initialPlans={safePlanningData.retirementPlans} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
