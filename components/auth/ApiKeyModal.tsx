'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (googleApiKey: string, rapidApiKey: string) => Promise<void>;
  // userId is removed as it will be derived from the auth token on the backend
}

export function ApiKeyModal({ isOpen, onClose, onSave }: ApiKeyModalProps) {
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [rapidApiKey, setRapidApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!googleApiKey.trim() || !rapidApiKey.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter both API keys.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      await onSave(googleApiKey, rapidApiKey);
      toast({
        title: 'Success',
        description: 'API keys saved successfully.',
      });
      onClose(); // Close modal on successful save
    } catch (error) {
      console.error('Failed to save API keys:', error);
      toast({
        title: 'Error',
        description: (error instanceof Error ? error.message : 'Failed to save API keys. Please try again.'),
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Setup API Keys</DialogTitle>
          <DialogDescription>
            Please enter your Google AI (Gemini) API Key and RapidAPI Key to use all features of the application.
            These keys will be stored securely and associated with your account.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="googleApiKey" className="text-right col-span-1">
              Google API Key
            </Label>
            <Input
              id="googleApiKey"
              value={googleApiKey}
              onChange={(e) => setGoogleApiKey(e.target.value)}
              className="col-span-3"
              placeholder="Enter your Google AI API Key"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rapidApiKey" className="text-right col-span-1">
              RapidAPI Key
            </Label>
            <Input
              id="rapidApiKey"
              value={rapidApiKey}
              onChange={(e) => setRapidApiKey(e.target.value)}
              className="col-span-3"
              placeholder="Enter your RapidAPI Key"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Keys'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}