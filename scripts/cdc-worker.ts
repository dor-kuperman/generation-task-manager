import { CdcPipeline } from '../src/lib/cdc/pipeline';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const pipeline = new CdcPipeline(connectionString);

async function main() {
  await pipeline.start();

  // Log metrics every 30 seconds
  setInterval(() => {
    const metrics = pipeline.getMetrics();
    console.log('Pipeline metrics:', JSON.stringify(metrics));
  }, 30000);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down CDC pipeline...');
  await pipeline.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down CDC pipeline...');
  await pipeline.stop();
  process.exit(0);
});

main().catch((err) => {
  console.error('CDC pipeline failed:', err);
  process.exit(1);
});
