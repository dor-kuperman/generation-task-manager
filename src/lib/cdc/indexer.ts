import { getESClient } from '../es/client';
import { getIndexName } from '../es/indices';
import { logger } from '../logger';
import type { TransformResult } from './transformer';

const FLUSH_INTERVAL_MS = 500;
const FLUSH_SIZE = 100;

export class BulkIndexer {
  private buffer: TransformResult[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private processedCount = 0;
  private errorCount = 0;

  start(): void {
    this.running = true;
    this.timer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.flush();
  }

  add(result: TransformResult): void {
    this.buffer.push(result);
    if (this.buffer.length >= FLUSH_SIZE) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batch = this.buffer.splice(0);
    const operations: Array<Record<string, unknown>> = [];
    const indexName = getIndexName();

    for (const item of batch) {
      if (item.action === 'delete') {
        operations.push({ delete: { _index: indexName, _id: item.id } });
      } else if (item.action === 'index' && item.document) {
        operations.push({ index: { _index: indexName, _id: item.id } });
        operations.push({ ...item.document } as Record<string, unknown>);
      }
    }

    if (operations.length === 0) return;

    try {
      const client = getESClient();
      const result = await client.bulk({ operations });

      if (result.errors) {
        const errors = result.items.filter((item) => {
          const op = item.index || item.delete;
          return op?.error;
        });
        this.errorCount += errors.length;
        logger.error({ errors: errors.length }, 'Bulk indexing partial failure');
      }

      this.processedCount += batch.length;
      logger.debug({ count: batch.length }, 'Bulk indexed documents');
    } catch (err) {
      this.errorCount += batch.length;
      logger.error({ err, count: batch.length }, 'Bulk indexing failed');
      // Put items back in buffer for retry
      this.buffer.unshift(...batch);
    }
  }

  getMetrics() {
    return {
      processed_count: this.processedCount,
      error_count: this.errorCount,
      buffer_size: this.buffer.length,
    };
  }
}
