import { Metadata } from 'next';
import { AppLayout } from '@/components/app-layout';
import { AdvisorClientWrapperNew } from "@/components/advisor/advisor-client-wrapper-new";

export const metadata: Metadata = {
  title: 'AI Finance Advisor Simulation - ArwiGos',
  description: 'Simulate financial conversations with our AI Finance Advisor.',
};

export default function AdvisorNewPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        
        <AdvisorClientWrapperNew />
      </div>
    </AppLayout>
  );
}
