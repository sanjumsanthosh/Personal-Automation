-- Main queue table
CREATE TABLE queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notes TEXT NOT NULL,
  urls TEXT[],
  type TEXT NOT NULL CHECK (type IN ('university', 'person', 'paper', 'generic')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  batch_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  error_message TEXT
);

-- Results storage
CREATE TABLE digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID,
  markdown_content TEXT,
  source_notes TEXT,
  source_urls TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- Batch tracking
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'PENDING',
  processed_count INT DEFAULT 0,
  total_count INT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_queue_status ON queue(status);
CREATE INDEX idx_queue_created ON queue(created_at DESC);
CREATE INDEX idx_queue_urls ON queue USING GIN(urls);
CREATE INDEX idx_digests_created ON digests(created_at DESC);
