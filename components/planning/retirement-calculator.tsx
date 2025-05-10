'use client'

import { useState, useEffect } from 'react' // Keep useEffect
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { RetirementPlan, saveRetirementPlan } from '@/lib/api/planning'; // Import type and save function
// import { useAuth } from '@/hooks/useAuth'; // Import useAuth hook - REMOVED
import { createClient } from '@/lib/supabase/client'; // Import Supabase client
import { User } from '@supabase/supabase-js'; // Import User type

interface RetirementCalculatorProps {
  initialPlans: RetirementPlan[]; // Accept initial plans
}

export function RetirementCalculator({ initialPlans }: RetirementCalculatorProps) {
  // Assume only one retirement plan per user for now
  const initialPlan = initialPlans.length > 0 ? initialPlans[0] : null;

  const [currentAge, setCurrentAge] = useState<number>(/* initialPlan?.current_age || */ 30) // Removed current_age assumption for now
  const [retirementAge, setRetirementAge] = useState<number>(initialPlan?.retirement_age || 65)
  const [currentSavings, setCurrentSavings] = useState<number>(initialPlan?.current_savings || 50000)
  const [monthlyContribution, setMonthlyContribution] = useState<number>(initialPlan?.monthly_contribution || 500)
  const [investmentReturn, setInvestmentReturn] = useState<number>(initialPlan?.investment_roi || 7) // Use investment_roi from type
  const [desiredIncome, setDesiredIncome] = useState<number>(initialPlan?.desired_income || 60000)
  const [inflationRate, setInflationRate] = useState<number>(3) // Assuming a default inflation rate

  const [projectedSavings, setProjectedSavings] = useState<number>(0)
  const [requiredSavings, setRequiredSavings] = useState<number>(0)
  const [shortfall, setShortfall] = useState<number>(0)
  const [isSaving, setIsSaving] = useState(false);
  // const { user } = useAuth(); // Get user info - REMOVED
  const [user, setUser] = useState<User | null>(null); // Add state for user
  const supabase = createClient(); // Initialize Supabase client

  // Fetch user session on component mount
  useEffect(() => {
    const getUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };
    getUserSession();
  }, [supabase]);

  useEffect(() => {
    calculateRetirement()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAge, retirementAge, currentSavings, monthlyContribution, investmentReturn, desiredIncome, inflationRate])

  const calculateRetirement = () => {
    const yearsToRetirement = retirementAge - currentAge
    const monthsToRetirement = yearsToRetirement * 12
    const monthlyRate = investmentReturn / 100 / 12
    const inflationAdjustedRate = (1 + investmentReturn / 100) / (1 + inflationRate / 100) - 1
    const monthlyInflationAdjustedRate = Math.pow(1 + inflationAdjustedRate, 1 / 12) - 1

    // Future value of current savings
    const fvCurrentSavings = currentSavings * Math.pow(1 + monthlyRate, monthsToRetirement)

    // Future value of monthly contributions (annuity)
    const fvContributions = monthlyContribution * ((Math.pow(1 + monthlyRate, monthsToRetirement) - 1) / monthlyRate)

    const totalProjected = fvCurrentSavings + fvContributions
    setProjectedSavings(totalProjected)

    // Calculate required savings (using 4% rule, adjusted for inflation)
    const inflationAdjustedDesiredIncome = desiredIncome * Math.pow(1 + inflationRate / 100, yearsToRetirement)
    const requiredNestEgg = inflationAdjustedDesiredIncome * 25 // 4% rule (1 / 0.04 = 25)
    setRequiredSavings(requiredNestEgg)

    setShortfall(Math.max(0, requiredNestEgg - totalProjected))
  }

  const handleSavePlan = async () => {
    if (!user) {
      console.error("User not logged in");
      // Add user feedback (e.g., toast)
      return;
    }
    setIsSaving(true);
    const planData: RetirementPlan = {
      // If initialPlan exists and has an id, use it for update
      ...(initialPlan?.id && { id: initialPlan.id }),
      user_id: user.id,
      retirement_age: retirementAge,
      desired_income: desiredIncome,
      current_savings: currentSavings,
      monthly_contribution: monthlyContribution,
      investment_roi: investmentReturn,
      // Add other relevant fields if they exist in your RetirementPlan type
      // e.g., current_age: currentAge (if you add it to the type/table)
    };

    try {
      const savedPlan = await saveRetirementPlan(planData);
      console.log('Retirement plan saved:', savedPlan);
      // Optionally update local state or trigger refetch in parent
    } catch (error) {
      console.error('Failed to save retirement plan:', error);
      // Error toast is handled in saveRetirementPlan
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retirement Calculator</CardTitle>
        <CardDescription>Estimate your retirement savings and see if you're on track.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Input Fields */}
          <div className="space-y-2">
            <Label htmlFor="current-age">Current Age</Label>
            <Input id="current-age" type="number" value={currentAge} onChange={(e) => setCurrentAge(parseInt(e.target.value, 10) || 0)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="retirement-age">Target Retirement Age</Label>
            <Input id="retirement-age" type="number" value={retirementAge} onChange={(e) => setRetirementAge(parseInt(e.target.value, 10) || 0)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="current-savings">Current Retirement Savings ($)</Label>
            <Input id="current-savings" type="number" value={currentSavings} onChange={(e) => setCurrentSavings(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthly-contribution">Monthly Contribution ($)</Label>
            <Input id="monthly-contribution" type="number" value={monthlyContribution} onChange={(e) => setMonthlyContribution(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="investment-return">Expected Annual Investment Return (%)</Label>
            <Input id="investment-return" type="number" value={investmentReturn} onChange={(e) => setInvestmentReturn(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desired-income">Desired Annual Retirement Income ($)</Label>
            <Input id="desired-income" type="number" value={desiredIncome} onChange={(e) => setDesiredIncome(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inflation-rate">Assumed Annual Inflation Rate (%)</Label>
            <Input id="inflation-rate" type="number" value={inflationRate} onChange={(e) => setInflationRate(parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
          <h3 className="text-lg font-semibold">Retirement Projection</h3>
          <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Years Until Retirement:</span>
              <span className="font-medium ml-2">{Math.max(0, retirementAge - currentAge)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Projected Savings at Retirement:</span>
              <span className="font-medium ml-2 text-green-600">{formatCurrency(projectedSavings)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Required Savings for Desired Income:</span>
              <span className="font-medium ml-2">{formatCurrency(requiredSavings)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Estimated Shortfall:</span>
              <span className={`font-medium ml-2 ${shortfall > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(shortfall)}
              </span>
            </div>
          </div>
          {shortfall > 0 && (
            <p className="text-sm text-amber-600">
              Based on these assumptions, you may have a shortfall. Consider increasing contributions or adjusting expectations.
            </p>
          )}
          {shortfall <= 0 && (
             <p className="text-sm text-green-600">
              Based on these assumptions, you appear to be on track to meet your retirement goal!
            </p>
          )}
        </div>
        <Button onClick={handleSavePlan} disabled={isSaving || !user}>
          {isSaving ? 'Saving Plan...' : 'Save Retirement Plan'}
        </Button>
      </CardContent>
    </Card>
  )
}
