import { AppLayout } from '@/components/app-layout';
import { EnhancedFinanceAgent } from '@/components/advisor/enhanced-finance-agent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Advisor - Finance Dashboard',
  description: 'Interact with the AI Financial Advisor for personalized insights.',
};

export default function AdvisorPage() {
  // Removed data fetching as EnhancedFinanceAgent now handles its own data/state
  // const marketData = await fetchMarketData(); // Example fetch
  // const newsData = await fetchNewsData(); // Example fetch

  // Wrap the content with AppLayout
  return (
    <AppLayout>
      <EnhancedFinanceAgent />
    </AppLayout>
  );
}
