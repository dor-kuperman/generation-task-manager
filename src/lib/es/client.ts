import { Client } from '@elastic/elasticsearch';

let client: Client | undefined;

export function getESClient(): Client {
  if (!client) {
    client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    });
  }
  return client;
}
