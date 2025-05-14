"use client"

import dynamic from 'next/dynamic';

// Use dynamic import within client component
const SimpleAdvisor = dynamic(
  () => import('@/components/advisor/simple-advisor').then(mod => mod.SimpleAdvisor),
  { ssr: false }
);

export function AdvisorClientWrapperNew() {
  return <SimpleAdvisor />;
}
