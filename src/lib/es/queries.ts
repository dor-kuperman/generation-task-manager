import { getESClient } from './client';
import { getIndexName } from './indices';
import type { TaskDocument, TaskStatus, TaskPriority } from '../types';
import type { QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types';


interface SearchOptions {
  query: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string;
  tags?: string[];
  from?: number;
  size?: number;
  userId?: string;
  isAdmin?: boolean;
}

export async function searchTasks(opts: SearchOptions) {
  const client = getESClient();
  const must: QueryDslQueryContainer[] = [];
  const filter: QueryDslQueryContainer[] = [];

  if (opts.query) {
    must.push({
      multi_match: {
        query: opts.query,
        fields: ['title^3', 'description', 'tags^2'],
        fuzziness: 'AUTO',
      },
    });
  }

  if (opts.status) filter.push({ term: { status: opts.status } });
  if (opts.priority) filter.push({ term: { priority: opts.priority } });
  if (opts.assignee_id) filter.push({ term: { assignee_id: opts.assignee_id } });
  if (opts.tags?.length) filter.push({ terms: { tags: opts.tags } });

  if (!opts.isAdmin && opts.userId) {
    filter.push({
      bool: {
        should: [
          { term: { created_by: opts.userId } },
          { term: { assignee_id: opts.userId } },
        ],
        minimum_should_match: 1,
      },
    });
  }

  const result = await client.search<TaskDocument>({
    index: getIndexName(),
    query: {
      bool: {
        must: must.length > 0 ? must : [{ match_all: {} }],
        filter,
      },
    },
    highlight: {
      fields: {
        title: { pre_tags: ['<mark>'], post_tags: ['</mark>'] },
        description: { pre_tags: ['<mark>'], post_tags: ['</mark>'] },
      },
    },
    from: opts.from ?? 0,
    size: opts.size ?? 20,
  });

  const total = typeof result.hits.total === 'number'
    ? result.hits.total
    : result.hits.total?.value ?? 0;

  return {
    hits: result.hits.hits.map((hit) => ({
      source: hit._source!,
      score: hit._score ?? 0,
      highlight: hit.highlight as Record<string, string[]> | undefined,
    })),
    total,
  };
}

export async function getAnalytics(userId?: string, isAdmin?: boolean) {
  const client = getESClient();

  const filter: QueryDslQueryContainer[] = [];
  if (!isAdmin && userId) {
    filter.push({
      bool: {
        should: [
          { term: { created_by: userId } },
          { term: { assignee_id: userId } },
        ],
        minimum_should_match: 1,
      },
    });
  }

  const result = await client.search({
    index: getIndexName(),
    size: 0,
    query: filter.length > 0 ? { bool: { filter } } : { match_all: {} },
    aggs: {
      status_breakdown: { terms: { field: 'status' } },
      priority_breakdown: { terms: { field: 'priority' } },
      overdue_count: { filter: { term: { is_overdue: true } } },
      tasks_by_day: {
        date_histogram: {
          field: 'created_at',
          calendar_interval: 'day',
        },
      },
      avg_completion_by_priority: {
        terms: { field: 'priority' },
        aggs: {
          done: { filter: { term: { status: 'done' } } },
        },
      },
      top_tags: { terms: { field: 'tags', size: 10 } },
    },
  });

  return result.aggregations;
}

