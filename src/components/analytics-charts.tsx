'use client';

import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader } from './ui/card';

const STATUS_COLORS: Record<string, string> = {
  todo: '#94a3b8',
  in_progress: '#3b82f6',
  done: '#22c55e',
  archived: '#f59e0b',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#94a3b8',
  medium: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444',
};

interface AggBucket {
  key: string;
  doc_count: number;
}

interface DateBucket {
  key_as_string: string;
  doc_count: number;
}

interface AnalyticsData {
  status_breakdown?: { buckets: AggBucket[] };
  priority_breakdown?: { buckets: AggBucket[] };
  overdue_count?: { doc_count: number };
  tasks_by_day?: { buckets: DateBucket[] };
  top_tags?: { buckets: AggBucket[] };
}

export function AnalyticsCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/analytics');
        if (!res.ok) throw new Error('Failed to load analytics');
        const json = await res.json();
        setData(json.aggregations);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="text-gray-500 text-center py-8">Loading analytics...</p>;
  if (error) return <p className="text-red-600 text-center py-8">{error}</p>;
  if (!data) return <p className="text-gray-500 text-center py-8">No data available.</p>;

  const statusData = data.status_breakdown?.buckets.map((b) => ({
    name: b.key, value: b.doc_count,
  })) ?? [];

  const priorityData = data.priority_breakdown?.buckets.map((b) => ({
    name: b.key, value: b.doc_count,
  })) ?? [];

  const timelineData = data.tasks_by_day?.buckets.map((b) => ({
    date: b.key_as_string.split('T')[0],
    count: b.doc_count,
  })) ?? [];

  const overdueCount = data.overdue_count?.doc_count ?? 0;

  const topTags = data.top_tags?.buckets.map((b) => ({
    name: b.key, count: b.doc_count,
  })) ?? [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Overdue Big Number */}
      <Card>
        <CardHeader><h3 className="font-semibold">Overdue Tasks</h3></CardHeader>
        <CardContent>
          <p className={`text-5xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {overdueCount}
          </p>
        </CardContent>
      </Card>

      {/* Status Donut */}
      <Card>
        <CardHeader><h3 className="font-semibold">By Status</h3></CardHeader>
        <CardContent>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">No data</p>
          )}
        </CardContent>
      </Card>

      {/* Priority Bar */}
      <Card>
        <CardHeader><h3 className="font-semibold">By Priority</h3></CardHeader>
        <CardContent>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value">
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] ?? '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">No data</p>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader><h3 className="font-semibold">Tasks Created Over Time</h3></CardHeader>
        <CardContent>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={timelineData}>
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">No data</p>
          )}
        </CardContent>
      </Card>

      {/* Top Tags */}
      <Card className="md:col-span-2">
        <CardHeader><h3 className="font-semibold">Top Tags</h3></CardHeader>
        <CardContent>
          {topTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topTags.map((tag) => (
                <span key={tag.name} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm">
                  {tag.name}
                  <span className="bg-blue-200 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">{tag.count}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No tags found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
