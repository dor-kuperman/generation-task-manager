import { Client } from 'pg';
import { sseHub } from './emitter';
import { logger } from '../logger';
import type { CdcNotifyPayload, SSEEvent } from '../types';
import { cdcPayloadSchema, CDC_CHANNEL } from '../cdc/schema';

const CHANNEL = CDC_CHANNEL;

let relayClient: Client | null = null;
let started = false;

export async function startCdcRelay(): Promise<void> {
  if (started) return;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    logger.warn('DATABASE_URL not set — SSE relay disabled');
    return;
  }

  started = true;

  try {
    relayClient = new Client({ connectionString });

    relayClient.on('error', (err) => {
      logger.error({ err }, 'CDC relay connection error');
      started = false;
      setTimeout(() => startCdcRelay(), 5000);
    });

    relayClient.on('notification', (msg) => {
      if (msg.channel === CHANNEL && msg.payload) {
        try {
          const raw = JSON.parse(msg.payload);
          const parsed = cdcPayloadSchema.safeParse(raw);
          if (!parsed.success) {
            logger.warn({ issues: parsed.error.issues }, 'Invalid CDC relay notification payload');
            return;
          }
          const payload: CdcNotifyPayload = parsed.data;

          const pipelineEvent: SSEEvent = {
            type: 'cdc_event',
            data: payload,
          };
          sseHub.broadcast('pipeline', pipelineEvent);

          if (payload.table === 'tasks') {
            const taskEvent: SSEEvent = {
              type: 'task_change',
              data: { op: payload.op, row_id: payload.row_id },
            };
            sseHub.broadcast('tasks', taskEvent);
          }
        } catch (err) {
          logger.error({ err }, 'Failed to parse CDC relay notification');
        }
      }
    });

    await relayClient.connect();
    await relayClient.query(`LISTEN ${CHANNEL}`);
    logger.info('CDC relay started for SSE broadcasting');
  } catch (err) {
    logger.error({ err }, 'Failed to start CDC relay');
    started = false;
  }
}
