import { z } from 'zod/v4';

export const cdcPayloadSchema = z.object({
  event_id: z.number(),
  table: z.string(),
  op: z.string(),
  row_id: z.string(),
});

export const CDC_CHANNEL = 'cdc_channel';
