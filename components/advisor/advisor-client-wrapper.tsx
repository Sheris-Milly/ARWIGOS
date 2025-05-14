"use client"

import dynamic from 'next/dynamic';

// Use dynamic import within client component
const EnhancedFinanceAgent = dynamic(
  () => import('@/components/advisor/enhanced-finance-agent').then(mod => mod.EnhancedFinanceAgent),
  { ssr: false }
);

export function AdvisorClientWrapper() {
  return <EnhancedFinanceAgent />;
}
