-- Add performance indexes for statement queries
CREATE INDEX IF NOT EXISTS idx_statement_creator_id ON statement(creator_id);
CREATE INDEX IF NOT EXISTS idx_draft_published_at ON draft(published_at);
CREATE INDEX IF NOT EXISTS idx_draft_created_at ON draft(created_at);
CREATE INDEX IF NOT EXISTS idx_statement_created_at ON statement(created_at); 