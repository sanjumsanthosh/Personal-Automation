import { useState } from 'react'
import { TypeSelector } from './components/TypeSelector.tsx'
import { EntryForm } from './components/EntryForm.tsx'
import { EntriesTable } from './components/EntriesTable.tsx'
import { RunsTable } from './components/RunsTable.tsx'
import { RunDetailPanel } from './components/RunDetailPanel.tsx'
import { CreateRunModal } from './components/CreateRunModal.tsx'
import { AddEntriesToRunModal } from './components/AddEntriesToRunModal.tsx'
import { ReportsTable } from './components/ReportsTable.tsx'
import { ReportPreviewPanel } from './components/ReportPreviewPanel.tsx'
import { Button } from './components/ui/button.tsx'
import { Plus } from 'lucide-react'
import type { Run, Report } from './lib/types.ts'

interface RunWithType extends Run {
  types: { name: string } | null
  entries?: Array<{ id: string; content: string; status: string; created_at: string }>
}

interface ReportWithRun extends Report {
  processing_runs: { name: string; type_id: string } | null
}

export default function App() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'dashboard' | 'runs' | 'reports'>('dashboard')

  // Runs tab state
  const [selectedRun, setSelectedRun] = useState<RunWithType | null>(null)
  const [createRunOpen, setCreateRunOpen] = useState(false)
  const [addEntriesOpen, setAddEntriesOpen] = useState(false)

  // Reports tab state
  const [selectedReport, setSelectedReport] = useState<ReportWithRun | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Collector</h1>
        </div>
      </header>

      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-8">
            {['dashboard', 'runs', 'reports'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`border-b-2 py-4 text-sm font-medium capitalize ${activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <TypeSelector
              value={selectedTypes}
              onChange={setSelectedTypes}
            />

            {selectedTypes.length > 0 && (
              <>
                <EntryForm />
                <EntriesTable selectedTypes={selectedTypes} status="pending" />
              </>
            )}
          </div>
        )}

        {/* Runs Tab */}
        {activeTab === 'runs' && (
          <div className="flex gap-6 h-[calc(100vh-200px)]">
            {/* Left: Runs Table */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Processing Runs</h2>
                <Button onClick={() => setCreateRunOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> New Run
                </Button>
              </div>
              <div className="flex-1 overflow-auto">
                <RunsTable
                  onSelectRun={setSelectedRun}
                  selectedRunId={selectedRun?.id || null}
                />
              </div>
            </div>

            {/* Right: Run Detail Panel */}
            {selectedRun && (
              <div className="w-96 border rounded-lg overflow-hidden">
                <RunDetailPanel
                  runId={selectedRun.id}
                  onClose={() => setSelectedRun(null)}
                  onOpenAddEntries={() => setAddEntriesOpen(true)}
                />
              </div>
            )}

            {/* Modals */}
            <CreateRunModal
              open={createRunOpen}
              onOpenChange={setCreateRunOpen}
            />
            {selectedRun && (
              <AddEntriesToRunModal
                open={addEntriesOpen}
                onOpenChange={setAddEntriesOpen}
                runId={selectedRun.id}
                typeId={selectedRun.type_id}
              />
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="flex gap-6 h-[calc(100vh-200px)]">
            {/* Left: Reports Table */}
            <div className="flex-1 flex flex-col">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Generated Reports</h2>
              </div>
              <div className="flex-1 overflow-auto">
                <ReportsTable
                  onSelectReport={setSelectedReport}
                  selectedReportId={selectedReport?.id || null}
                />
              </div>
            </div>

            {/* Right: Report Preview Panel */}
            {selectedReport && (
              <div className="w-[500px] border rounded-lg overflow-hidden">
                <ReportPreviewPanel
                  report={selectedReport}
                  onClose={() => setSelectedReport(null)}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
