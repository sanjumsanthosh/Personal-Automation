import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ReportsTable } from '../components/ReportsTable'
import { ReportPreviewPanel } from '../components/ReportPreviewPanel'
import { supabase } from '../lib/supabase.client'
import type { Report } from '../lib/types'

interface ReportWithRun extends Report {
  processing_runs: { name: string; type_id: string } | null
}

export const Route = createFileRoute('/reports')({
  component: ReportsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    runId: (search.runId as string) || undefined,
  }),
})

function ReportsPage() {
  const { runId } = Route.useSearch()
  const [selectedReport, setSelectedReport] = useState<ReportWithRun | null>(null)

  // Auto-select report when runId is provided
  const { data: reportForRun } = useQuery({
    queryKey: ['report-by-run', runId],
    queryFn: async () => {
      if (!runId) return null
      const { data } = await supabase
        .from('reports')
        .select('*, processing_runs:run_id(name, type_id)')
        .eq('run_id', runId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      return data as ReportWithRun | null
    },
    enabled: !!runId,
  })

  useEffect(() => {
    if (reportForRun) {
      setSelectedReport(reportForRun)
    }
  }, [reportForRun])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">Generated Reports</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex h-[calc(100vh-130px)]">
        {/* Left: Reports Table */}
        <div className="flex-1 p-4 overflow-auto">
          <ReportsTable
            onSelectReport={setSelectedReport}
            selectedReportId={selectedReport?.id || null}
          />
        </div>

        {/* Right: Report Preview Panel */}
        {selectedReport && (
          <div className="w-[500px] border-l border-gray-200 overflow-hidden">
            <ReportPreviewPanel
              report={selectedReport}
              onClose={() => setSelectedReport(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
