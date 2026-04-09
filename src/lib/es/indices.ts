import { getESClient } from './client';

const INDEX_NAME = process.env.ELASTICSEARCH_INDEX || 'tasks';

export function getIndexName(): string {
  return INDEX_NAME;
}

export const tasksMapping = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      analyzer: {
        task_analyzer: {
          type: 'custom' as const,
          tokenizer: 'standard',
          filter: ['lowercase', 'asciifolding', 'task_synonyms'],
        },
      },
      filter: {
        task_synonyms: {
          type: 'synonym' as const,
          synonyms: [
            'bug,defect,issue',
            'feature,enhancement',
            'urgent,critical,blocker',
          ],
        },
      },
    },
  },
  mappings: {
    properties: {
      id: { type: 'keyword' as const },
      title: {
        type: 'text' as const,
        analyzer: 'task_analyzer',
        fields: { keyword: { type: 'keyword' as const } },
      },
      description: { type: 'text' as const, analyzer: 'task_analyzer' },
      status: { type: 'keyword' as const },
      priority: { type: 'keyword' as const },
      assignee_id: { type: 'keyword' as const },
      created_by: { type: 'keyword' as const },
      due_date: { type: 'date' as const },
      tags: { type: 'keyword' as const },
      is_overdue: { type: 'boolean' as const },
      days_until_due: { type: 'integer' as const },
      created_at: { type: 'date' as const },
      updated_at: { type: 'date' as const },
    },
  },
};

export async function createTasksIndex(): Promise<void> {
  const client = getESClient();
  const indexName = getIndexName();

  const exists = await client.indices.exists({ index: indexName });
  if (exists) {
    console.log(`Index "${indexName}" already exists.`);
    return;
  }

  await client.indices.create({
    index: indexName,
    ...tasksMapping,
  });

  console.log(`Created index "${indexName}".`);
}

export async function deleteTasksIndex(): Promise<void> {
  const client = getESClient();
  const indexName = getIndexName();

  const exists = await client.indices.exists({ index: indexName });
  if (exists) {
    await client.indices.delete({ index: indexName });
    console.log(`Deleted index "${indexName}".`);
  }
}
