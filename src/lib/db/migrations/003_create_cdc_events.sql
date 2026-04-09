CREATE TYPE cdc_operation AS ENUM ('INSERT', 'UPDATE', 'DELETE');

CREATE TABLE cdc_events (
    id          BIGSERIAL PRIMARY KEY,
    table_name  VARCHAR(63) NOT NULL,
    operation   cdc_operation NOT NULL,
    row_id      UUID NOT NULL,
    row_data    JSONB,
    old_data    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed   BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_cdc_events_unprocessed
    ON cdc_events (id) WHERE processed = FALSE;

CREATE INDEX idx_cdc_events_table
    ON cdc_events (table_name, created_at DESC);
