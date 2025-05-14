'use client'

import { useState, useEffect } from 'react' // Added useEffect
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Edit2, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { Goal, saveGoal, deleteGoal } from '@/lib/api/planning'; // Import Goal type, saveGoal and deleteGoal
// import { useAuth } from '@/hooks/useAuth'; // Assuming useAuth hook provides user ID - REMOVED
import { createClient } from '@/lib/supabase/client'; // Import Supabase client
import { User } from '@supabase/supabase-js'; // Import User type
import { toast } from '@/components/ui/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  const [user, setUser] = useState<User | null>(null); // Add state for user
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | undefined>(undefined);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [editName, setEditName] = useState('');
  const [editTargetAmount, setEditTargetAmount] = useState('');
  const [editCurrentAmount, setEditCurrentAmount] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  
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

  // Show delete confirmation dialog
  const confirmDelete = (id?: string) => {
    if (!id) return;
    setGoalToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Handle goal deletion after confirmation
  const handleRemoveGoal = async () => {
    if (!goalToDelete) return; // Cannot remove if no ID
    
    try {
      // Call the API to delete the goal
      await deleteGoal(goalToDelete);
      
      // Update the UI by removing the goal from the state
      setGoals(goals.filter((goal) => goal.id !== goalToDelete));
      
      toast({
        title: "Goal Deleted",
        description: "The goal has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error removing goal:', error);
      // Error notification is already handled in the deleteGoal function
    } finally {
      setDeleteDialogOpen(false);
      setGoalToDelete(undefined);
    }
  };

  // Initialize goal editing
  const initEditGoal = (goal: Goal) => {
    setGoalToEdit(goal);
    setEditName(goal.name);
    setEditTargetAmount(goal.target_amount.toString());
    setEditCurrentAmount(goal.current_amount.toString());
    setEditTargetDate(goal.target_date);
    setEditPriority(goal.priority);
    setEditDialogOpen(true);
  };

  // Handle goal update
  const handleUpdateGoal = async () => {
    if (!goalToEdit || !user) return;
    
    const targetAmount = parseFloat(editTargetAmount);
    const currentAmount = parseFloat(editCurrentAmount);
    
    if (isNaN(targetAmount) || isNaN(currentAmount) || !editName || !editTargetDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Prepare updated goal data
      const updatedGoal: Goal = {
        ...goalToEdit,
        name: editName,
        target_amount: targetAmount,
        current_amount: currentAmount,
        target_date: editTargetDate,
        priority: editPriority,
      };
      
      // Call API to update the goal
      const savedGoal = await saveGoal(updatedGoal);
      
      // Update goals list
      setGoals(goals.map(g => g.id === savedGoal.id ? savedGoal : g));
      
      toast({
        title: "Goal Updated",
        description: "Your goal has been successfully updated.",
      });
      
      // Close dialog and reset form
      setEditDialogOpen(false);
      setGoalToEdit(null);
    } catch (error) {
      console.error('Error updating goal:', error);
      // Error notification is handled in saveGoal
    } finally {
      setIsSaving(false);
    }
  };

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
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => initEditGoal(goal)} disabled={!goal.id}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => confirmDelete(goal.id)} disabled={!goal.id}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this financial goal from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveGoal}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit Goal Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>
              Update your financial goal details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-goal-name">Goal Name</Label>
              <Input
                id="edit-goal-name"
                placeholder="e.g., House Down Payment"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-target-amount">Target Amount ($)</Label>
                <Input
                  id="edit-target-amount"
                  type="number"
                  placeholder="50000"
                  value={editTargetAmount}
                  onChange={(e) => setEditTargetAmount(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-current-amount">Current Amount ($)</Label>
                <Input
                  id="edit-current-amount"
                  type="number"
                  placeholder="10000"
                  value={editCurrentAmount}
                  onChange={(e) => setEditCurrentAmount(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-target-date">Target Date</Label>
                <Input
                  id="edit-target-date"
                  type="date"
                  value={editTargetDate}
                  onChange={(e) => setEditTargetDate(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={editPriority}
                  onValueChange={(value: 'low' | 'medium' | 'high') => setEditPriority(value)}
                  disabled={isSaving}
                >
                  <SelectTrigger id="edit-priority">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleUpdateGoal} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
