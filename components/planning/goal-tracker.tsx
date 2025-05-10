'use client'

import { useState, useEffect } from 'react' // Added useEffect
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2 } from 'lucide-react'
import { Goal, saveGoal } from '@/lib/api/planning'; // Import Goal type and saveGoal
// import { useAuth } from '@/hooks/useAuth'; // Assuming useAuth hook provides user ID - REMOVED
import { createClient } from '@/lib/supabase/client'; // Import Supabase client
import { User } from '@supabase/supabase-js'; // Import User type

interface GoalTrackerProps {
  initialGoals: Goal[]; // Accept initial goals
}

export function GoalTracker({ initialGoals }: GoalTrackerProps) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [newGoalName, setNewGoalName] = useState<string>('');
  const [newGoalTargetAmount, setNewGoalTargetAmount] = useState<string>('');
  const [newGoalCurrentAmount, setNewGoalCurrentAmount] = useState<string>('0');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState<string>('');
  const [newGoalPriority, setNewGoalPriority] = useState<'low' | 'medium' | 'high'>('medium');
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

  const handleAddGoal = async () => {
    if (!user) {
      console.error("User not logged in");
      // Add user feedback (e.g., toast)
      return;
    }
    if (newGoalName && newGoalTargetAmount && newGoalTargetDate) {
      const targetAmount = parseFloat(newGoalTargetAmount);
      const currentAmount = parseFloat(newGoalCurrentAmount);

      if (!isNaN(targetAmount) && !isNaN(currentAmount)) {
        const newGoal: Goal = {
          user_id: user.id,
          name: newGoalName,
          target_amount: targetAmount,
          current_amount: currentAmount,
          target_date: newGoalTargetDate,
          priority: newGoalPriority,
        };

        setIsSaving(true);
        try {
          const savedGoal = await saveGoal(newGoal);
          setGoals([...goals, savedGoal]); // Add the saved goal (with ID) to the list
          // Reset form
          setNewGoalName('');
          setNewGoalTargetAmount('');
          setNewGoalCurrentAmount('0');
          setNewGoalTargetDate('');
          setNewGoalPriority('medium');
        } catch (error) {
          console.error('Failed to save goal:', error);
          // Error toast is handled in saveGoal
        } finally {
          setIsSaving(false);
        }
      }
    }
  };

  const handleRemoveGoal = async (idToRemove?: string) => {
    if (!idToRemove) return; // Cannot remove if no ID
    // TODO: Implement delete functionality in API and call it here
    console.warn('Delete functionality not yet implemented.');
    // Example: await deletePlanningItem('goal', idToRemove);
    setGoals(goals.filter((goal) => goal.id !== idToRemove));
  };

  // TODO: Implement functionality to update existing goals (e.g., update current amount)
  // This would likely involve a modal or inline editing and calling saveGoal with the goal's ID.

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Goals</CardTitle>
        <CardDescription>Set and track your progress towards financial goals.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Display Existing Goals */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Goals</h3>
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">You haven't added any goals yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Goal</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.map((goal) => {
                  const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
                  return (
                    <TableRow key={goal.id}> {/* Use goal.id if available */}
                      <TableCell className="font-medium">{goal.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="w-[100px]" />
                          <span>{progress.toFixed(0)}%</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ${goal.current_amount.toLocaleString()} / ${goal.target_amount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(goal.target_date).toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize">{goal.priority}</TableCell>
                      <TableCell className="text-right">
                        {/* Add Edit button here later */}
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveGoal(goal.id)} disabled={!goal.id}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Add New Goal Form */}
        <div className="space-y-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <h3 className="text-lg font-semibold">Add New Goal</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="goal-name">Goal Name</Label>
              <Input id="goal-name" placeholder="e.g., House Down Payment" value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-amount">Target Amount ($)</Label>
              <Input id="target-amount" type="number" placeholder="e.g., 50000" value={newGoalTargetAmount} onChange={(e) => setNewGoalTargetAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-amount">Current Amount ($)</Label>
              <Input id="current-amount" type="number" placeholder="e.g., 10000" value={newGoalCurrentAmount} onChange={(e) => setNewGoalCurrentAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-date">Target Date</Label>
              <Input id="target-date" type="date" value={newGoalTargetDate} onChange={(e) => setNewGoalTargetDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={newGoalPriority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewGoalPriority(value)}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAddGoal} disabled={isSaving || !user || !newGoalName || !newGoalTargetAmount || !newGoalTargetDate}>
            {isSaving ? 'Adding Goal...' : 'Add Goal'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
