export interface CreateReportBody {
  summary: string
  markdown_content: string
  entry_ids: string[]
  run_id?: string
}

export type EntryStatus = 'pending' | 'processing' | 'processed' | 'archived'
export type ReportStatus = 'processed' | 'done'
export type RunStatus = 'created' | 'running' | 'completed' | 'failed'

export interface Type {
  id: string
  name: string
  created_at: string
}

export interface Entry {
  id: string
  type_id: string
  content: string
  status: EntryStatus
  run_id?: string
  why_it_matters?: string
  created_at: string
  modified_at: string
}

export interface Run {
  id: string
  name: string
  type_id: string
  limit_count: number
  status: RunStatus
  created_at: string
  started_at?: string
  completed_at?: string
}

export interface Report {
  id: string
  summary: string
  markdown_content: string
  entry_ids: string[]
  run_id?: string
  sources?: Record<string, unknown>
  status: ReportStatus
  created_at: string
}
