-- ================================================================
-- SUNTRONIX CRM — Complete Supabase Schema (Final)
-- Paste this into Supabase → SQL Editor and click Run.
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- TABLE 1: users
-- ================================================================
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL,
  username   TEXT        UNIQUE NOT NULL,
  password   TEXT        NOT NULL,
  role       TEXT        NOT NULL CHECK (role IN ('CEO','Manager','CRE','Editor','Viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO users (name, username, password, role) VALUES
  ('Admin',       'admin',      'admin123',  'CEO'),
  ('Vinodhini',   'vinodhini',  'pass123',   'CRE'),
  ('Arjun Kumar', 'arjun',      'pass123',   'Manager'),
  ('Editor',      'editor',     'editor123', 'Editor');

-- ================================================================
-- TABLE 2: funnels  (leads / deals)
-- ================================================================
DROP TABLE IF EXISTS funnels CASCADE;
CREATE TABLE funnels (
  id               UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT    NOT NULL,
  phone            TEXT,
  email            TEXT,
  city_region      TEXT,
  enquiry_type     TEXT,
  funnel_type      TEXT,
  lead_source      TEXT    NOT NULL DEFAULT 'WhatsApp',
  next_follow_up   DATE,
  products         JSONB   NOT NULL DEFAULT '[]',
  remarks          TEXT,
  delivery_details TEXT,
  payment_terms    TEXT,
  created_by       TEXT    NOT NULL DEFAULT 'admin',
  assigned_to      TEXT,
  quotation_no     TEXT,
  order_number     TEXT,
  quote_qty        NUMERIC,
  quote_amount     NUMERIC CHECK (quote_amount IS NULL OR quote_amount >= 0),
  quote_desc       TEXT,
  status           TEXT    NOT NULL DEFAULT 'Pending'
                   CHECK (status IN ('Pending','Won','Lost','Drop')),
  lost_drop_reason TEXT,
  won_proof_url    TEXT,
  is_existing      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLE 3: followup_logs
-- ================================================================
DROP TABLE IF EXISTS followup_logs CASCADE;
CREATE TABLE followup_logs (
  id                UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  funnel_id         UUID    NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  logged_by         TEXT    NOT NULL,
  follow_up_date    DATE,
  customer_response TEXT,
  outcome           TEXT    CHECK (outcome IN (
                      'Interested','Needs Time','Callback Requested',
                      'Not Interested','Rescheduled','Order Confirmed','Other'
                    )),
  next_follow_up    DATE,
  logged_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLE 4: audit_comments
-- ================================================================
DROP TABLE IF EXISTS audit_comments CASCADE;
CREATE TABLE audit_comments (
  id         UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  funnel_id  UUID    NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  author     TEXT    NOT NULL,
  role       TEXT    NOT NULL,
  text       TEXT    NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLE 5: tasks
-- ================================================================
DROP TABLE IF EXISTS tasks CASCADE;
CREATE TABLE tasks (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT        NOT NULL,
  type          TEXT        NOT NULL DEFAULT 'Call',
  priority      TEXT        NOT NULL DEFAULT 'Medium',
  due_date      DATE,
  due_time      TEXT,
  note          TEXT,
  linked_funnel UUID        REFERENCES funnels(id) ON DELETE SET NULL,
  assigned_to   TEXT,
  created_by    TEXT        NOT NULL,
  done          BOOLEAN     NOT NULL DEFAULT FALSE,
  progress_pct  INTEGER     NOT NULL DEFAULT 0,
  done_at       TEXT,
  done_at_iso   TIMESTAMPTZ,
  status        TEXT,
  updates       JSONB       NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLE 6: contact_segments
-- ================================================================
DROP TABLE IF EXISTS contact_segments CASCADE;
CREATE TABLE contact_segments (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  color       TEXT        NOT NULL DEFAULT '#5B3BE8',
  description TEXT,
  filters     JSONB       NOT NULL DEFAULT '{}',
  created_by  TEXT        NOT NULL DEFAULT 'admin',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLE 7: sales_targets
-- ================================================================
DROP TABLE IF EXISTS sales_targets CASCADE;
CREATE TABLE sales_targets (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  assigned_to    TEXT        NOT NULL,
  period_type    TEXT        NOT NULL CHECK (period_type IN ('daily','weekly','monthly')),
  period_start   DATE        NOT NULL,
  period_end     DATE        NOT NULL,
  target_deals   INTEGER     NOT NULL DEFAULT 0,
  target_revenue NUMERIC     NOT NULL DEFAULT 0,
  set_by         TEXT        NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (assigned_to, period_type, period_start)
);

-- ================================================================
-- TABLE 8: team_messages  (internal chat)
-- ================================================================
DROP TABLE IF EXISTS team_messages CASCADE;
CREATE TABLE team_messages (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel     TEXT        NOT NULL,
  sender      TEXT        NOT NULL,
  sender_role TEXT,
  text        TEXT        NOT NULL,
  mentions    TEXT[]      DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- REALTIME
-- ================================================================
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE funnels;          EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE followup_logs;    EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE audit_comments;   EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE tasks;            EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE users;            EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE contact_segments; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE sales_targets;    EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE team_messages;    EXCEPTION WHEN others THEN NULL; END $$;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnels          ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_comments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_targets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_messages    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_users"         ON users            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_funnels"       ON funnels          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_followup"      ON followup_logs    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_comments"      ON audit_comments   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_tasks"         ON tasks            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_segments"      ON contact_segments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_sales_targets" ON sales_targets    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_team_messages" ON team_messages    FOR ALL USING (true) WITH CHECK (true);

-- ================================================================
-- INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_funnels_status        ON funnels(status);
CREATE INDEX IF NOT EXISTS idx_funnels_created_at    ON funnels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_funnels_assigned_to   ON funnels(assigned_to);
CREATE INDEX IF NOT EXISTS idx_funnels_next_followup ON funnels(next_follow_up);
CREATE INDEX IF NOT EXISTS idx_funnels_lead_source   ON funnels(lead_source);
CREATE INDEX IF NOT EXISTS idx_funnels_phone         ON funnels(phone);
CREATE INDEX IF NOT EXISTS idx_followup_funnel_id    ON followup_logs(funnel_id);
CREATE INDEX IF NOT EXISTS idx_followup_logged_at    ON followup_logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_funnel_id    ON audit_comments(funnel_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned        ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date        ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_sales_targets_person  ON sales_targets(assigned_to, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_messages_channel      ON team_messages(channel, created_at ASC);

-- ================================================================
-- STORAGE BUCKET — Won Proof Images
-- ================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ekanta-proofs', 'ekanta-proofs', TRUE, 10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/heic','image/heif']
)
ON CONFLICT (id) DO UPDATE SET public = TRUE, file_size_limit = 10485760;

CREATE POLICY "anon_read_proofs"   ON storage.objects FOR SELECT USING (bucket_id = 'ekanta-proofs');
CREATE POLICY "anon_upload_proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ekanta-proofs');
CREATE POLICY "anon_update_proofs" ON storage.objects FOR UPDATE USING (bucket_id = 'ekanta-proofs');
CREATE POLICY "anon_delete_proofs" ON storage.objects FOR DELETE USING (bucket_id = 'ekanta-proofs');
