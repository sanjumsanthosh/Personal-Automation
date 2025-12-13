export interface CreateReportBody {
  summary: string
  markdown_content: string
  entry_ids: string[]
}

export type EntryStatus = 'pending' | 'processed' | 'archived'
export type ReportStatus = 'processed' | 'done'

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
  created_at: string
  modified_at: string
}

export interface Report {
  id: string
  summary: string
  markdown_content: string
  entry_ids: string[]
  status: ReportStatus
  created_at: string
}
