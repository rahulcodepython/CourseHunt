CREATE TABLE IF NOT EXISTS webhook_events (
    id                text PRIMARY KEY DEFAULT gen_random_uuid(),
    razorpay_event_id text NOT NULL UNIQUE,
    event_type        text NOT NULL,
    payload           JSONB,
    processed         boolean DEFAULT false,
    received_at       timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id  ON webhook_events(razorpay_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
