CREATE TABLE signature_requests (
  id INTEGER PRIMARY KEY,
  nickname TEXT NOT NULL,
  name_key TEXT NOT NULL UNIQUE,
  receipt_hash TEXT NOT NULL UNIQUE,
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TEXT,
  removal_requested_at TEXT
);

CREATE TABLE signature_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  expires INTEGER NOT NULL,
  submissions INTEGER NOT NULL
);

CREATE INDEX signature_rate_limits_expiry ON signature_rate_limits (expires);
