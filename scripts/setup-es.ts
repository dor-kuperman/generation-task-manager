import { createTasksIndex } from '../src/lib/es/indices';

async function main() {
  await createTasksIndex();
  console.log('Elasticsearch setup complete.');
}

main().catch((err) => {
  if (err?.name === 'ConnectionError') {
    const url = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
    console.error(`Could not connect to Elasticsearch at ${url}.`);
    console.error('Make sure Elasticsearch is running before running this script.');
    process.exit(1);
  }
  console.error('ES setup failed:', err);
  process.exit(1);
});
