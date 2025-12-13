import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ReportsTable } from '../components/ReportsTable'
import { ReportPreviewPanel } from '../components/ReportPreviewPanel'
import type { Report } from '../lib/types'

interface ReportWithRun extends Report {
  processing_runs: { name: string; type_id: string } | null
}

export const Route = createFileRoute('/reports')({
  component: ReportsPage,
})

function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportWithRun | null>(null)

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
