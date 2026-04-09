CREATE OR REPLACE FUNCTION cdc_trigger_fn()
RETURNS TRIGGER AS $$
DECLARE
    event_id BIGINT;
    payload  JSONB;
    row_id   UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        row_id := OLD.id;
        INSERT INTO cdc_events (table_name, operation, row_id, row_data, old_data)
        VALUES (TG_TABLE_NAME, 'DELETE', OLD.id, NULL, to_jsonb(OLD))
        RETURNING id INTO event_id;
    ELSIF TG_OP = 'UPDATE' THEN
        row_id := NEW.id;
        INSERT INTO cdc_events (table_name, operation, row_id, row_data, old_data)
        VALUES (TG_TABLE_NAME, 'UPDATE', NEW.id, to_jsonb(NEW), to_jsonb(OLD))
        RETURNING id INTO event_id;
    ELSIF TG_OP = 'INSERT' THEN
        row_id := NEW.id;
        INSERT INTO cdc_events (table_name, operation, row_id, row_data, old_data)
        VALUES (TG_TABLE_NAME, 'INSERT', NEW.id, to_jsonb(NEW), NULL)
        RETURNING id INTO event_id;
    END IF;

    payload := jsonb_build_object(
        'event_id', event_id,
        'table', TG_TABLE_NAME,
        'op', TG_OP,
        'row_id', row_id
    );

    PERFORM pg_notify('cdc_channel', payload::text);

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tasks_cdc
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION cdc_trigger_fn();
