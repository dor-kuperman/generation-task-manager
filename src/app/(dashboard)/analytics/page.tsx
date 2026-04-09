'use client';

import { AnalyticsCharts } from '@/components/analytics-charts';

export default function AnalyticsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h1>
      <AnalyticsCharts />
    </div>
  );
}
