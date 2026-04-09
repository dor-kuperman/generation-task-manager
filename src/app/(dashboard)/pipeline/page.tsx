'use client';

import { PipelineMonitor } from '@/components/pipeline-monitor';

export default function PipelinePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">CDC Pipeline Monitor</h1>
      <PipelineMonitor />
    </div>
  );
}
