import { CdcListener } from './listener';
import { transformEvent } from './transformer';
import { BulkIndexer } from './indexer';
import { PipelineStatus } from './status';
import { logger } from '../logger';
import type { CdcNotifyPayload } from '../types';

export class CdcPipeline {
  private listener: CdcListener;
  private indexer: BulkIndexer;
  private status: PipelineStatus;

  constructor(connectionString: string) {
    this.listener = new CdcListener(connectionString);
    this.indexer = new BulkIndexer();
    this.status = new PipelineStatus();
  }

  async start(): Promise<void> {
    logger.info('Starting CDC pipeline...');
    this.status.start();

    this.listener.on('change', (payload: CdcNotifyPayload) => {
      this.handleChange(payload);
    });

    this.listener.on('connected', () => {
      logger.info('CDC pipeline connected');
      this.status.resetErrors();
    });

    this.listener.on('disconnected', () => {
      logger.warn('CDC pipeline disconnected');
    });

    this.indexer.start();
    await this.listener.start();

    // Process backlog on startup
    await this.processBacklog();

    logger.info('CDC pipeline started.');
  }

  async stop(): Promise<void> {
    logger.info('Stopping CDC pipeline...');
    await this.listener.stop();
    this.indexer.stop();
    this.status.stop();
    logger.info('CDC pipeline stopped.');
  }

  private async handleChange(payload: CdcNotifyPayload): Promise<void> {
    try {
      const event = await this.listener.fetchEvent(payload.event_id);
      if (!event) {
        logger.warn({ event_id: payload.event_id }, 'Event not found');
        return;
      }

      const result = transformEvent(event);
      if (result) {
        this.indexer.add(result);
      }

      await this.listener.markProcessed(event.id);
      this.status.recordEvent();

      logger.debug({
        event_id: event.id,
        table: event.table_name,
        op: event.operation,
      }, 'Processed CDC event');
    } catch (err) {
      this.status.recordError();
      logger.error({ err, payload }, 'Failed to process CDC event');
    }
  }

  private async processBacklog(): Promise<void> {
    const events = await this.listener.processBacklog();

    for (const event of events) {
      const result = transformEvent(event);
      if (result) {
        this.indexer.add(result);
      }
      await this.listener.markProcessed(event.id);
      this.status.recordEvent();
    }

    if (events.length > 0) {
      await this.indexer.flush();
      logger.info({ count: events.length }, 'Processed CDC backlog');
    }
  }

  getMetrics() {
    return {
      ...this.status.getMetrics(),
      ...this.indexer.getMetrics(),
    };
  }
}
