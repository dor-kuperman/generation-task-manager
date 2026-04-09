import { createTasksIndex } from '../src/lib/es/indices';

async function main() {
  await createTasksIndex();
  console.log('Elasticsearch setup complete.');
}

main().catch((err) => {
  console.error('ES setup failed:', err);
  process.exit(1);
});
