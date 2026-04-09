import { Client } from 'pg';
import { EventEmitter } from 'events';
import type { CdcNotifyPayload, CdcEvent } from '../types';
import { logger } from '../logger';
import { cdcPayloadSchema, CDC_CHANNEL } from './schema';

const CHANNEL = CDC_CHANNEL;
const MAX_BACKOFF_MS = 30000;

export class CdcListener extends EventEmitter {
  private client: Client | null = null;
  private reconnectAttempt = 0;
  private connectionString: string;
  private running = false;

  constructor(connectionString: string) {
    super();
    this.connectionString = connectionString;
  }

  async start(): Promise<void> {
    this.running = true;
    await this.connect();
    await this.processBacklog();
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }

  private async connect(): Promise<void> {
    try {
      this.client = new Client({ connectionString: this.connectionString });

      this.client.on('error', (err) => {
        logger.error({ err }, 'CDC listener connection error');
        this.handleDisconnect();
      });

      this.client.on('notification', (msg) => {
        if (msg.channel === CHANNEL && msg.payload) {
          try {
            const raw = JSON.parse(msg.payload);
            const parsed = cdcPayloadSchema.safeParse(raw);
            if (!parsed.success) {
              logger.warn({ issues: parsed.error.issues }, 'Invalid CDC notification payload');
              return;
            }
            const payload: CdcNotifyPayload = parsed.data;
            this.emit('change', payload);
          } catch (err) {
            logger.error({ err }, 'Failed to parse CDC notification');
          }
        }
      });

      await this.client.connect();
      await this.client.query(`LISTEN ${CHANNEL}`);
      this.reconnectAttempt = 0;
      logger.info('CDC listener connected and listening');
      this.emit('connected');
    } catch (err) {
      logger.error({ err }, 'Failed to connect CDC listener');
      this.handleDisconnect();
    }
  }

  private handleDisconnect(): void {
    if (!this.running) return;

    this.client = null;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempt), MAX_BACKOFF_MS);
    this.reconnectAttempt++;
    logger.info({ delay, attempt: this.reconnectAttempt }, 'Reconnecting CDC listener...');
    this.emit('disconnected');

    setTimeout(() => {
      if (this.running) this.connect();
    }, delay);
  }

  async processBacklog(): Promise<CdcEvent[]> {
    if (!this.client) return [];

    try {
      const { rows } = await this.client.query<CdcEvent>(
        `SELECT * FROM cdc_events WHERE processed = FALSE ORDER BY id ASC LIMIT 1000`,
      );
      logger.info({ count: rows.length }, 'Processing CDC backlog');
      return rows;
    } catch (err) {
      logger.error({ err }, 'Failed to process CDC backlog');
      return [];
    }
  }

  async markProcessed(eventId: number): Promise<void> {
    if (!this.client) return;
    await this.client.query(
      'UPDATE cdc_events SET processed = TRUE WHERE id = $1',
      [eventId],
    );
  }

  async fetchEvent(eventId: number): Promise<CdcEvent | null> {
    if (!this.client) return null;
    const { rows } = await this.client.query<CdcEvent>(
      'SELECT * FROM cdc_events WHERE id = $1',
      [eventId],
    );
    return rows[0] ?? null;
  }
}
