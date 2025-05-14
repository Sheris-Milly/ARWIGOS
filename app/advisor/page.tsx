import { Metadata } from 'next';
import { AppLayout } from '@/components/app-layout';
import { AdvisorClientWrapper } from '@/components/advisor/advisor-client-wrapper';

export const metadata: Metadata = {
  title: 'AI Finance Agent - ArwiGos',
  description: 'Interact with our AI Finance Agent system for personalized financial insights.',
};

export default function AdvisorPage() {
  return (
    <AppLayout>
      <div className="h-full w-full p-1">
        <AdvisorClientWrapper />
      </div>
    </AppLayout>
  );
}
